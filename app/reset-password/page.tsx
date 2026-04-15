"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated successfully! You can now log in.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-slate-900 to-black text-white">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
        
        <h1 className="text-2xl font-semibold mb-2">Set new password</h1>
        <p className="text-sm text-gray-400 mb-6">
          Choose a strong password to secure your account.
        </p>

        <form onSubmit={handleUpdate} className="space-y-4">
          <input
            type="password"
            placeholder="Enter new password"
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold p-3 rounded-lg transition">
            Update Password
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-center text-gray-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}