import { z } from "zod";
import {
  type ContentPlatform,
  type ContentTone,
  type LengthPreset
} from "@/lib/plans";
import { limitCharacters } from "@/lib/utils";

const TOGETHER_API_BASE = "https://api.together.xyz/v1";

const platformOutputSchema = z.object({
  linkedin: z.string().min(1).optional(),
  x: z.string().min(1).optional(),
  instagram: z.string().min(1).optional(),
  reddit: z.string().min(1).optional(),
  newsletter: z.string().min(1).optional()
});

export type PlatformOutputs = Partial<Record<ContentPlatform, string>>;

type TogetherChatResponse = {
  model?: string;
  choices?: Array<{
    text?: string;
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const toneInstructions: Record<ContentTone, string> = {
  professional:
    "Use a credible, polished, business-ready voice. Keep it sharp, practical, and composed.",
  casual:
    "Use a warm, conversational voice. Make it feel natural and easy to read without becoming sloppy.",
  viral:
    "Use a hook-first, high-energy style built for attention and shareability, but stay factual and grounded in the source.",
  authority:
    "Use an expert, confident, insight-led voice. Make it feel like strong thinking from someone who deeply understands the topic."
};

const lengthInstructions: Record<LengthPreset, string> = {
  short: "Keep each output clearly compressed. Prioritize the strongest ideas only.",
  medium: "Use a balanced amount of detail, structure, and breathing room.",
  long: "Expand with more context, transitions, examples from the source, and fuller development."
};

const lengthTargets: Record<LengthPreset, Record<ContentPlatform, string>> = {
  short: {
    linkedin: "around 80 to 140 words, 2 to 3 short paragraphs max",
    x: "a short thread of 3 to 5 posts, each punchy and compact",
    instagram: "around 70 to 130 words with a strong hook and tight caption flow",
    reddit: "around 120 to 180 words, direct and practical",
    newsletter: "around 140 to 220 words with headline, short summary, and compact body"
  },
  medium: {
    linkedin: "around 160 to 260 words, 3 to 5 short paragraphs",
    x: "a thread of 6 to 8 posts with a clear arc",
    instagram: "around 140 to 220 words with more story and context",
    reddit: "around 220 to 340 words with grounded detail",
    newsletter: "around 260 to 420 words with headline, summary, and developed body"
  },
  long: {
    linkedin: "around 280 to 420 words with fuller development and a stronger close",
    x: "a deeper thread of 9 to 12 posts with smooth progression",
    instagram: "around 240 to 380 words with richer storytelling and context",
    reddit: "around 380 to 550 words with detailed but natural explanation",
    newsletter: "around 500 to 800 words with a clear editorial flow"
  }
};

const platformInstructions: Record<ContentPlatform, string> = {
  linkedin:
    "LinkedIn: strong opening line, 3 to 5 short paragraphs, one compact bullet-style section if useful, and a thoughtful closing line or question.",
  x:
    "X: create a numbered thread with short posts separated by blank lines. Start with a strong opener and end with a concise takeaway.",
  instagram:
    "Instagram: create a caption with a strong hook, short visual-friendly lines, natural paragraph breaks, and a light hashtag section only if it genuinely fits the source.",
  reddit:
    "Reddit: write in a human, grounded, non-corporate way. Prioritize clarity, usefulness, and natural flow over hype.",
  newsletter:
    "Newsletter: start with a headline, add a short summary line, then write a concise, readable editorial-style body."
};

function getApiKey() {
  const apiKey = process.env.TOGETHER_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing TOGETHER_API_KEY.");
  }

  return apiKey;
}

function getModelName() {
  return process.env.TOGETHER_MODEL?.trim() || "Qwen/Qwen3.5-9B";
}

function cleanJsonCandidate(raw: string) {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseStructuredJson(raw: string) {
  const cleaned = cleanJsonCandidate(raw);
  const attempts: string[] = [cleaned];

  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    attempts.push(cleanJsonCandidate(fencedMatch[1]));
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    attempts.push(cleanJsonCandidate(cleaned.slice(firstBrace, lastBrace + 1)));
  }

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      return platformOutputSchema.parse(parsed);
    } catch {
      // keep trying alternate candidates
    }
  }

  throw new Error("The model returned malformed JSON.");
}

function validateRequestedPlatforms(outputs: PlatformOutputs, platforms: ContentPlatform[]) {
  for (const platform of platforms) {
    const value = outputs[platform];
    if (!value || !value.trim()) {
      throw new Error(`The model did not return a usable ${platform} output.`);
    }
  }
}

function buildPrompt(input: {
  sourceTitle: string;
  sourceText: string;
  tone: ContentTone;
  lengthPreset: LengthPreset;
  platforms: ContentPlatform[];
  retryMode?: boolean;
}) {
  const requestedPlatformRules = input.platforms
    .map(
      (platform) =>
        `- ${platformInstructions[platform]} Target length for this request: ${lengthTargets[input.lengthPreset][platform]}.`
    )
    .join("\n");

  return `
You are a platform-specific content repurposing editor.

Your job is to transform one source into outputs for the requested platforms only.

Requested platforms:
${input.platforms.map((platform) => `- ${platform}`).join("\n")}

Tone:
${input.tone.toUpperCase()} — ${toneInstructions[input.tone]}

Length preset:
${input.lengthPreset.toUpperCase()} — ${lengthInstructions[input.lengthPreset]}

Non-negotiable source fidelity rules:
- Use only facts, claims, names, dates, examples, numbers, and ideas explicitly present in the source.
- Do not invent details.
- Do not add outside knowledge.
- Do not imply certainty where the source is uncertain.
- If the source is limited, keep the output limited instead of guessing.

Formatting rules:
- Return exactly one valid JSON object.
- No markdown code fences.
- No explanation before or after JSON.
- Include only the requested platform keys.
- Every requested key must be present exactly once.
- Each value must be plain text.

Quality rules:
- Make SHORT, MEDIUM, and LONG feel materially different in depth, pacing, and total output size.
- Match the target length for each requested platform closely.
- Avoid filler, repetition, and generic motivational phrasing.
- Keep hooks, structure, and closing lines specific to each platform.

Platform requirements:
${requestedPlatformRules}

${
  input.retryMode
    ? `Important retry instruction:
Your previous answer was not valid enough for the schema.
Return only one valid JSON object now, with every requested key filled.`
    : ""
}

Schema reminder:
{
${input.platforms.map((platform) => `  "${platform}": "string"`).join(",\n")}
}

Source title:
${input.sourceTitle}

Source text:
${limitCharacters(input.sourceText, 26000)}
  `.trim();
}

function extractResponseText(response: TogetherChatResponse) {
  const choice = response.choices?.[0];
  if (!choice) return "";

  if (typeof choice.message?.content === "string") {
    return choice.message.content.trim();
  }

  if (Array.isArray(choice.message?.content)) {
    return choice.message.content
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  }

  if (typeof choice.text === "string") {
    return choice.text.trim();
  }

  return "";
}

async function createChatCompletion(input: {
  sourceTitle: string;
  sourceText: string;
  tone: ContentTone;
  lengthPreset: LengthPreset;
  platforms: ContentPlatform[];
  retryMode?: boolean;
}) {
  const response = await fetch(`${TOGETHER_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getModelName(),
      messages: [
        {
          role: "system",
          content:
            "Respond only with valid JSON. Do not use markdown fences. Do not include commentary before or after the JSON."
        },
        {
          role: "user",
          content: buildPrompt(input)
        }
      ],
      response_format: {
        type: "json_object"
      },
      temperature: input.retryMode ? 0.2 : 0.5,
      max_tokens:
        input.lengthPreset === "long" ? 5600 : input.lengthPreset === "medium" ? 4200 : 2600
    })
  });

  const data = (await response.json().catch(() => null)) as TogetherChatResponse | null;

  if (!response.ok) {
    throw new Error(data?.error?.message || `Together AI text request failed with status ${response.status}.`);
  }

  if (!data) {
    throw new Error("Together AI returned an empty response.");
  }

  const rawText = extractResponseText(data);
  if (!rawText) {
    throw new Error("The model returned an empty response.");
  }

  const parsed = parseStructuredJson(rawText);
  validateRequestedPlatforms(parsed, input.platforms);

  const outputs = Object.fromEntries(
    input.platforms.map((platform) => [platform, parsed[platform]?.trim() ?? ""])
  ) as PlatformOutputs;

  return {
    outputs,
    modelName: data.model ?? getModelName()
  };
}

export async function generateRepurposedContent(input: {
  sourceTitle: string;
  sourceText: string;
  tone: ContentTone;
  lengthPreset: LengthPreset;
  platforms: ContentPlatform[];
}) {
  try {
    return await createChatCompletion(input);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "The model returned malformed JSON." ||
        error.message.startsWith("The model did not return a usable"))
    ) {
      return await createChatCompletion({
        ...input,
        retryMode: true
      });
    }

    throw error;
  }
}
