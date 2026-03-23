import { GoogleGenAI } from "@google/genai";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  return new GoogleGenAI({ apiKey });
}

function getImageModel() {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || "imagen-4.0-generate-001";
}

export async function generateImageFromPrompt(input: {
  prompt: string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}) {
  const client = getClient();
  const model = getImageModel();

  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new Error("Image prompt is required.");
  }

  if (prompt.length > 1500) {
    throw new Error("Image prompt is too long.");
  }

  const response = await client.models.generateImages({
    model,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: input.aspectRatio ?? "1:1"
    }
  });

  const firstImage = response.generatedImages?.[0];
  const imageBytes = firstImage?.image?.imageBytes;

  if (!imageBytes) {
    throw new Error("No image was returned by the model.");
  }

  return {
    dataUrl: `data:image/png;base64,${imageBytes}`,
    model
  };
}