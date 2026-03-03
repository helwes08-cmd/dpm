import OpenAI from "openai";

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.LLM_PROVIDER;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }

  return new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  });
}

