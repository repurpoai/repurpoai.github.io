import { NextResponse } from "next/server";
import { z } from "zod";
import { generateImageFromPrompt } from "@/lib/together-image";
import { isImageUnlocked } from "@/lib/plans";
import { getViewerContext } from "@/lib/viewer";

const bodySchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required."),
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional()
});

export async function POST(request: Request) {
  const viewer = await getViewerContext();

  if (!viewer) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  if (!isImageUnlocked(viewer.tier)) {
    return NextResponse.json(
      { error: "Image generation is available on Plus and Pro only." },
      { status: 403 }
    );
  }

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const result = await generateImageFromPrompt({
      prompt: parsed.data.prompt,
      aspectRatio: parsed.data.aspectRatio
    });

    return NextResponse.json({
      imageDataUrl: result.dataUrl,
      model: result.model
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Image generation failed."
      },
      { status: 500 }
    );
  }
}