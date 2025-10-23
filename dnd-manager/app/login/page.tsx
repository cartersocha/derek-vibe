"use client";

import { useState } from "react";
import { login } from "@/lib/auth/actions";
import { sanitizePassword } from "@/lib/security/sanitize";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const sanitizedPassword = sanitizePassword(password);
      const result = await login(sanitizedPassword);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // If no error, redirect will happen automatically
    } catch (error) {
      // Check if this is a redirect error (which is expected)
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        // Let Next.js handle the redirect
        throw error;
      }
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a1f]">
      <div className="max-w-md w-full space-y-8 p-12 bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl">
        <div>
          <h2
            className="mt-6 text-center text-4xl font-bold glitch tracking-[0.15em]"
            data-text="ENTER ACCESS CODE"
          >
            ENTER ACCESS CODE
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none relative block w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 placeholder-gray-500 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(sanitizePassword(e.target.value))}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-[#ff00ff] text-sm text-center font-mono">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-bold rounded text-black bg-[#ff00ff] hover:bg-[#cc00cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff00ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[#ff00ff]/50"
            >
              {loading ? "ACCESSING..." : "ENTER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
