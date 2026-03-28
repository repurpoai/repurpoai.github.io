const TOGETHER_API_BASE = "https://api.together.xyz/v1";

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

type TogetherImageResponse = {
  model?: string;
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
  };
};

function getApiKey() {
  const apiKey = process.env.TOGETHER_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing TOGETHER_API_KEY.");
  }

  return apiKey;
}

function getImageModel() {
  return process.env.TOGETHER_IMAGE_MODEL?.trim() || "black-forest-labs/FLUX.1-schnell-Free";
}

function aspectRatioToSize(aspectRatio: AspectRatio) {
  switch (aspectRatio) {
    case "3:4":
      return { width: 768, height: 1024 };
    case "4:3":
      return { width: 1024, height: 768 };
    case "9:16":
      return { width: 768, height: 1344 };
    case "16:9":
      return { width: 1344, height: 768 };
    case "1:1":
    default:
      return { width: 1024, height: 1024 };
  }
}

export async function generateImageFromPrompt(input: {
  prompt: string;
  aspectRatio?: AspectRatio;
}) {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new Error("Image prompt is required.");
  }

  if (prompt.length > 1500) {
    throw new Error("Image prompt is too long.");
  }

  const { width, height } = aspectRatioToSize(input.aspectRatio ?? "1:1");
  const response = await fetch(`${TOGETHER_API_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getImageModel(),
      prompt,
      width,
      height,
      steps: 4,
      n: 1,
      response_format: "base64",
      output_format: "png"
    })
  });

  const data = (await response.json().catch(() => null)) as TogetherImageResponse | null;

  if (!response.ok) {
    throw new Error(data?.error?.message || `Together AI image request failed with status ${response.status}.`);
  }

  const base64 = data?.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error("No image was returned by Together AI.");
  }

  return {
    dataUrl: `data:image/png;base64,${base64}`,
    model: data?.model ?? getImageModel()
  };
}
