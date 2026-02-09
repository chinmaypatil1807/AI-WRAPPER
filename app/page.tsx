"use client";

import { useState } from "react";

type Result = {
  improvedPrompt: string;
  explanation: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleImprove() {
    setError(null);
    setResult(null);
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult({
        improvedPrompt: data.improvedPrompt,
        explanation: data.explanation ?? "",
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result?.improvedPrompt) return;
    try {
      await navigator.clipboard.writeText(result.improvedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Prompt Improver
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Paste a prompt below and get a clearer, more effective version plus a short explanation.
        </p>
      </header>

      <div className="space-y-4">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Your prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. write me a story about a robot"
          rows={5}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleImprove}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Improving…" : "Improve"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <section>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Improved prompt
              </h2>
              <button
                type="button"
                onClick={handleCopy}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {result.improvedPrompt}
            </div>
          </section>
          {result.explanation && (
            <section>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Explanation
              </h2>
              <p className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-sm">
                {result.explanation}
              </p>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
