import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// Load GEMINI_API_KEY from .env.local if not already in process.env
if (!process.env.GEMINI_API_KEY) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/GEMINI_API_KEY="?([^"\n\r]+)"?/);
    if (match) {
      process.env.GEMINI_API_KEY = match[1];
    }
  } catch {
    // ignore
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    console.log("Testing Gemini API connection...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: "Reply with OK and tell which model version you are if my API key works.",
    });

    console.log("\nSuccess! Gemini replied:");
    console.log(response.text?.trim());
  } catch (err) {
    console.error("Gemini API Error:", err);
  }
}

main();
