import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const systemPrompt = `You are a prompt engineer. Given a user's prompt (often vague, short, or poorly structured), you must:

1. Produce an improved version that is clearer, more specific, and more likely to get good results from an AI assistant. Add necessary context, structure, or constraints only when it helps.
2. Return a short explanation (2-4 sentences) of what you changed and why.

You must respond with valid JSON only, no other text. Use this exact shape:
{"improvedPrompt": "the improved prompt text", "explanation": "your brief explanation"}`;

// Rate limit: 10 requests per 60 seconds per IP (only when Upstash env vars are set)
function getRatelimit() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
  });
}

function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return (forwarded?.split(",")[0]?.trim() || realIp || "anonymous") as string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured. Set OPENAI_API_KEY in .env.local." },
      { status: 500 }
    );
  }

  const ratelimit = getRatelimit();
  if (ratelimit) {
    const { success, remaining } = await ratelimit.limit(getClientId(request));
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
      );
    }
  }

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json(
      { error: "Missing or empty prompt." },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "No response from the model." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content) as { improvedPrompt?: string; explanation?: string };
    const improvedPrompt = typeof parsed.improvedPrompt === "string" ? parsed.improvedPrompt : "";
    const explanation = typeof parsed.explanation === "string" ? parsed.explanation : "";

    if (!improvedPrompt) {
      return NextResponse.json(
        { error: "Model did not return a valid improved prompt." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      improvedPrompt,
      explanation: explanation || "No explanation provided.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("rate limit") || message.includes("429")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }
    if (message.includes("API key") || message.includes("401")) {
      return NextResponse.json(
        { error: "Invalid API key. Check OPENAI_API_KEY in .env.local." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: message || "Failed to improve prompt." },
      { status: 502 }
    );
  }
}
