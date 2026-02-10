"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Supabase puts the token in the URL hash, but Next.js useSearchParams might not see it easily
  // In a standard Supabase setup, when you click the link, it redirect with #access_token=...
  
  useEffect(() => {
    // Check if we have the access token in the hash
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token=")) {
        setError("Invalid or expired reset link. Please request a new one.");
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");

      if (!accessToken) {
        throw new Error("No access token found in link.");
      }

      await axios.post(
        `${API_BASE_URL}/auth/reset-password`, 
        { new_password: password },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      alert("Password updated! Redirecting to login...");
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Set New Password</h2>
        <p className="text-gray-500 mt-2 font-medium">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleReset} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all duration-200 font-medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <p className="text-red-500 text-xs font-bold px-1">{error}</p>}

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all duration-200 shadow-xl shadow-blue-100 active:scale-[0.98] disabled:opacity-70"
        >
          {isProcessing ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden lg:flex w-1/2 bg-blue-600 p-12 flex-col justify-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
        <div className="relative z-10 flex items-center gap-2 font-bold text-2xl tracking-tight mb-8">
            <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles size={24} />
            </div>
            OmniService
        </div>
        <h1 className="text-5xl font-bold leading-[1.1] relative z-10">Secure your <span className="text-blue-200">intelligence</span>.</h1>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
