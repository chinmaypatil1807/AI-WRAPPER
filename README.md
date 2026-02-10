# AI Wrapper — Prompt Improver

Turn a bad or vague prompt into a better one. Paste your prompt, get an **improved version** plus a short **explanation** of what changed.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your OpenAI API key:

   - Copy `.env.local.example` to `.env.local`
   - Set `OPENAI_API_KEY` to your [OpenAI API key](https://platform.openai.com/api-keys)

3. **(Optional)** Limit usage on Vercel so you don’t run out of tokens:
   - Create a free [Upstash Redis](https://console.upstash.com/) database
   - In `.env.local` (and in Vercel → Project → Settings → Environment Variables), set:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
   - When both are set, the API is limited to **10 requests per 60 seconds per IP**.

4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy (Vercel)

- Push to GitHub and [import the repo on Vercel](https://vercel.com/new).
- Set `OPENAI_API_KEY` in Vercel environment variables.
- To enable rate limiting, also set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel.

## Rate limiting

- If Upstash env vars are **not** set: no rate limit (useful for local dev).
- If they **are** set: **10 requests per 60 seconds per IP** (sliding window). Users who exceed this get a “Too many requests” message and can retry after a minute.
