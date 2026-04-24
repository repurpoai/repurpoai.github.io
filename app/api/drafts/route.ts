import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewerContext } from "@/lib/viewer";

type DraftTableError = {
  code?: string;
  message?: string;
  details?: string;
};

function isMissingDraftTable(error: DraftTableError) {
  const haystack = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    error.code === "42P01" ||
    haystack.includes('relation "public.drafts" does not exist') ||
    haystack.includes('relation "drafts" does not exist') ||
    haystack.includes("could not find the table")
  );
}


async function getDraftClient() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await getDraftClient();
  const { data, error } = await supabase
    .from("drafts")
    .select("input_type, raw_content, settings_json, updated_at")
    .eq("user_id", viewer.userId)
    .maybeSingle();

  if (error) {
    if (isMissingDraftTable(error)) {
      return Response.json({ draft: null, skipped: true });
    }

    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ draft: data ?? null });
}

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const record = body as {
    inputType?: string;
    rawContent?: string;
    settingsJson?: Record<string, unknown>;
  };

  if (record.inputType !== "link" && record.inputType !== "text" && record.inputType !== "youtube") {
    return Response.json({ error: "Invalid draft type." }, { status: 400 });
  }

  const supabase = await getDraftClient();
  const { error } = await supabase.from("drafts").upsert(
    {
      user_id: viewer.userId,
      input_type: record.inputType,
      raw_content: typeof record.rawContent === "string" ? record.rawContent : "",
      settings_json: record.settingsJson ?? {}
    },
    { onConflict: "user_id" }
  );

  if (error) {
    if (isMissingDraftTable(error)) {
      console.warn("Drafts table missing; autosave skipped.");
      return Response.json({ success: true, skipped: true });
    }

    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
