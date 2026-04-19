import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

function normalizeMessage(value: string | null) {
  if (!value) return null;
  return value.replace(/\+/g, " ");
}

function buildRedirect(
  request: NextRequest,
  pathname: string,
  params?: Record<string, string | null | undefined>
) {
  const url = new URL(pathname, request.url);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const queryError = normalizeMessage(searchParams.get("error_description") ?? searchParams.get("error"));

  if (queryError) {
    return buildRedirect(request, "/login", { error: queryError });
  }

  if (!code) {
    return buildRedirect(request, "/login", { error: "Missing OAuth code." });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (!error) {
    return buildRedirect(request, nextPath);
  }

  const normalized = error.message?.toLowerCase() ?? "";
  const message = normalized.includes("code verifier")
    ? "The Google sign-in session was interrupted. Please try again from the login page."
    : error.message || "Google sign-in failed. Please try again.";

  return buildRedirect(request, "/login", { error: message });
}
