"use client";

import { useState } from "react";
import axios from "axios";
import { Sparkles, ArrowLeft, ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = "/api";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');

      if (!accessToken) {
        setMessage({ type: 'error', text: 'Invalid or expired reset link.' });
        return;
      }

      await axios.post(`${API_BASE_URL}/auth/reset-password`, 
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setMessage({ type: 'success', text: 'Password updated! You can now log in.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to reset password.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg mb-8">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Set New Password</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Choose a strong password to secure your account</p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-bold text-center ${
            message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
            <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all duration-200 font-medium"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all duration-200 font-medium"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all duration-200 shadow-xl shadow-blue-100 active:scale-[0.98] disabled:opacity-70"
          >
            {isProcessing ? 'Updating...' : 'Reset Password'}
          </button>

          <Link 
            href="/" 
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition mt-4"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
