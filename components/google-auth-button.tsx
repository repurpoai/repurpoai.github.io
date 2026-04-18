"use client";

import { useState } from "react";
import { Chrome, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type GoogleAuthButtonProps = {
  actionLabel: string;
  className?: string;
  nextPath?: string;
};

export function GoogleAuthButton({
  actionLabel,
  className,
  nextPath = "/dashboard"
}: GoogleAuthButtonProps) {
  const supabase = createClient();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    try {
      setPending(true);

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
          : `/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      setPending(false);
    } catch {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
      {pending ? "Connecting..." : actionLabel}
    </Button>
  );
}
