"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  Plus, 
  Sparkles,
  Command,
  LayoutDashboard,
  ChevronRight,
  User,
  Home as HomeIcon,
  Bot as BotIcon,
  Menu,
  X,
  Settings,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";
import Dashboard from "@/components/Dashboard";
import AgentWorkspace from "@/components/AgentWorkspace";

const API_BASE_URL = "/api";
const ADMIN_EMAIL = "placidusagukwe21@gmail.com";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [bots, setBots] = useState<any[]>([]);
  const [selectedBot, setSelectedBot] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth View Toggle: 'login' | 'register' | 'forgot'
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (authView === 'login') {
        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);
        
        const res = await axios.post(`${API_BASE_URL}/auth/token`, formData);
        const { access_token, user } = res.data;
        
        setToken(access_token);
        setUser(user);
        setIsAdmin(user.email === ADMIN_EMAIL);
        
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(user));
        
        fetchBots(access_token);
      } else if (authView === 'register') {
        await axios.post(`${API_BASE_URL}/auth/register`, { email, password });
        alert("Account created! You can now log in.");
        setAuthView('login');
      } else if (authView === 'forgot') {
        // Updated redirect URL for production
        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : "";
        await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email, redirect_to: redirectUrl });
        alert("If an account exists, a reset link has been sent to your email.");
        setAuthView('login');
      }
    } catch (err: any) {
      console.error("Auth error", err);
      alert(err.response?.data?.detail || "Authentication failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchBots = async (authToken: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/bots`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setBots(res.data.bots);
    } catch (err) {
      console.error("Error fetching bots", err);
    }
  };

  const createBot = async () => {
    const name = prompt("Enter a name for your new AI:");
    if (!name) return;
    try {
      await axios.post(
        `${API_BASE_URL}/bots`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBots(token!);
    } catch (err) {
      alert("Error creating bot");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    setSelectedBot(null);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen bg-[#fafafa] selection:bg-blue-100 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl shadow-blue-100/50 border border-slate-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg mb-8">
              <Sparkles size={28} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {authView === 'login' ? 'Welcome Back' : authView === 'register' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {authView === 'login' 
                ? 'Enter credentials to access workspace' 
                : authView === 'register'
                  ? 'Start your intelligence journey'
                  : 'We will email you a password reset link'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all duration-200 font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {authView !== 'forgot' && (
              <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-semibold text-gray-700">Password</label>
                      {authView === 'login' && (
                          <button 
                              type="button" 
                              onClick={() => setAuthView('forgot')}
                              className="text-xs font-bold text-blue-600 hover:underline"
                          >
                              Forgot?
                          </button>
                      )}
                  </div>
                  <div className="relative group">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all duration-200 font-medium pr-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all duration-200 shadow-xl shadow-blue-100 active:scale-[0.98] disabled:opacity-70"
            >
              {isProcessing ? 'Processing...' : (authView === 'login' ? 'Sign In' : authView === 'register' ? 'Sign Up' : 'Send Reset Link')}
            </button>

            {authView === 'forgot' && (
              <button 
                  type="button" 
                  onClick={() => setAuthView('login')}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition"
              >
                  <ArrowLeft size={16} /> Back to Login
              </button>
            )}
          </form>

          {authView !== 'forgot' && (
              <div className="pt-6 border-t border-gray-100 text-center">
                  <p className="text-sm font-medium text-gray-500">
                      {authView === 'login' ? "Don't have an account?" : "Already have an account?"}
                      <button 
                          onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')}
                          className="ml-2 text-blue-600 font-bold hover:underline"
                      >
                          {authView === 'login' ? 'Create one now' : 'Log in here'}
                      </button>
                  </p>
              </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans relative">
      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[280px] bg-[#f8fafc] border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5 font-bold text-slate-900 text-lg">
                <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
                <Sparkles size={20} />
                </div>
                OmniService
            </div>
            <button className="md:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
                <X size={20} />
            </button>
          </div>

          <div className="space-y-1">
            <button 
                onClick={() => { setSelectedBot(null); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    !selectedBot ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-200/50'
                }`}
            >
                <HomeIcon size={18} />
                Overview
            </button>
            <button 
                onClick={() => { createBot(); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200/50 transition-all duration-200"
            >
                <Plus size={18} className="text-blue-500" />
                Initialize Agent
            </button>
          </div>
        </div>
        
        {/* Bot List Section */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          <div className="px-3 mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Intelligence</p>
              <BotIcon size={12} className="text-slate-400" />
          </div>
          {bots.map((bot) => (
            <button
              key={bot.id}
              onClick={() => {
                setSelectedBot(bot);
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 group flex items-center gap-3 ${
                selectedBot?.id === bot.id 
                ? "bg-white text-blue-600 shadow-lg shadow-slate-200 border border-slate-100" 
                : "text-slate-500 hover:bg-slate-200/50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                selectedBot?.id === bot.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                <Command size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate">{bot.name}</p>
                <p className={`text-[9px] font-medium opacity-60`}>
                   {bot.id.slice(0, 8)}...
                </p>
              </div>
              <ChevronRight size={12} className={selectedBot?.id === bot.id ? "opacity-100" : "opacity-0 group-hover:opacity-40"} />
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 bg-slate-100/50 border-t border-slate-200 space-y-3">
          {isAdmin && (
            <Link 
              href="/admin" 
              className="flex items-center gap-3 w-full p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-100 font-bold text-xs"
            >
              <LayoutDashboard size={16} />
              Admin Dashboard
            </Link>
          )}
          
          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">{user?.email}</p>
              <button onClick={handleLogout} className="text-[9px] font-bold text-red-500 hover:text-red-600 transition uppercase tracking-wider">
                End Session
              </button>
            </div>
            <Settings size={16} className="text-slate-400 hover:text-gray-600 cursor-pointer" />
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Mobile Navbar Header */}
        <header className="h-16 border-b border-slate-100 flex md:hidden justify-between items-center px-4 shrink-0 bg-white sticky top-0 z-30">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md">
                    <Sparkles size={16} />
                </div>
                OmniService
            </div>
            <div className="w-10" />
        </header>

        {selectedBot ? (
          <AgentWorkspace 
            bot={selectedBot} 
            token={token} 
            onDeleteSuccess={() => {
                setSelectedBot(null);
                fetchBots(token!);
            }}
          />
        ) : (
          <Dashboard 
            bots={bots} 
            onSelectBot={(bot) => setSelectedBot(bot)} 
            onCreateBot={createBot} 
            onRefreshBots={() => fetchBots(token!)}
            token={token}
          />
        )}
      </main>
    </div>
  );
}
