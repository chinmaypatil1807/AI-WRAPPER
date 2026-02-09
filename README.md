# Prompt Improver

Turn a bad or vague prompt into a better one. Paste your prompt, get an **improved version** plus a short **explanation** of what changed.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your OpenAI API key:

   - Copy `.env.local.example` to `.env.local`
   - Set `OPENAI_API_KEY` to your [OpenAI API key](https://platform.openai.com/api-keys)

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## MVP

- **Input**: Your prompt (textarea).
- **Output**: Improved prompt (copyable) and explanation.
- Improvement is done by an LLM (OpenAI `gpt-4o-mini`) via the `/api/improve` route; the API key stays server-side in `.env.local`.
