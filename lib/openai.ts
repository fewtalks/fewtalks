import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

let openai: any;

if (!apiKey) {
  console.warn("OpenAI API key is not configured. Please add OPENAI_API_KEY to .env.local");
  // Return a mock client for development
  openai = {
    responses: {
      create: () => Promise.resolve({
        output_text: "1. Mock tweet one\n2. Mock tweet two\n3. Mock tweet three",
      }),
    },
  };
} else {
  openai = new OpenAI({ apiKey });
}

export { openai };

