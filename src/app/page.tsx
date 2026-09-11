"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [showKomoot, setShowKomoot] = useState(false);
  const [showGarmin, setShowGarmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    errorParam === "strava_denied" ? "Strava access was denied." :
    errorParam === "strava_failed" ? "Strava connection failed. Try again." : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleGarminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/garmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push("/map");
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  async function handleKomootSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/map");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-3xl font-bold text-gray-900">My Activity Map</h1>
          <p className="text-gray-500 mt-2">
            Connect your fitness app to see all your adventures on a map
          </p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {!showKomoot && !showGarmin ? (
          <div className="space-y-3">
            {/* Strava */}
            <a
              href="/api/auth/strava"
              className="flex items-center gap-4 w-full bg-[#FC4C02] hover:bg-[#e04400] text-white font-semibold px-5 py-4 rounded-2xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white shrink-0">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              <div className="text-left">
                <div>Continue with Strava</div>
                <div className="text-xs font-normal opacity-80">OAuth — no password needed</div>
              </div>
            </a>

            {/* Garmin */}
            <button
              onClick={() => setShowGarmin(true)}
              className="flex items-center gap-4 w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold px-5 py-4 rounded-2xl transition-colors"
            >
              <span className="text-3xl shrink-0">⌚</span>
              <div className="text-left">
                <div>Continue with Garmin</div>
                <div className="text-xs font-normal text-gray-400">Garmin Connect email &amp; password</div>
              </div>
            </button>

            {/* Komoot */}
            <button
              onClick={() => setShowKomoot(true)}
              className="flex items-center gap-4 w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold px-5 py-4 rounded-2xl transition-colors"
            >
              <span className="text-3xl shrink-0">🧭</span>
              <div className="text-left">
                <div>Continue with Komoot</div>
                <div className="text-xs font-normal text-gray-400">Email &amp; password required</div>
              </div>
            </button>
          </div>
        ) : showGarmin ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <button
              onClick={() => { setShowGarmin(false); setError(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="font-semibold text-gray-900 mb-4">Sign in with Garmin Connect</h2>
            <form onSubmit={handleGarminSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="••••••••" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors">
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <button
              onClick={() => { setShowKomoot(false); setError(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="font-semibold text-gray-900 mb-4">Sign in with Komoot</h2>
            <form onSubmit={handleKomootSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-4">
              Note: only works with native Komoot accounts (not Google-linked)
            </p>
          </div>
        )}

        <p className="text-xs text-gray-300 text-center mt-8 font-mono">
          {process.env.NEXT_PUBLIC_GIT_SHA ?? "dev"}
        </p>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
