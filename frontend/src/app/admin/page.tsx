"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Bot, BarChart3, Search, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = "http://localhost:8000";

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [allBots, setAllBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchAdminData(savedToken);
    } else {
      setError("No admin token found. Please login first.");
      setLoading(false);
    }
  }, []);

  const fetchAdminData = async (authToken: string) => {
    try {
      setLoading(true);
      const [statsRes, botsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_BASE_URL}/admin/bots/all`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      setStats(statsRes.data);
      setAllBots(botsRes.data);
      setError(null);
    } catch (err: any) {
      console.error("Admin fetch error", err);
      setError(err.response?.data?.detail || "Failed to fetch admin data. Are you an admin?");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/search-user?email=${searchEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "User not found");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-medium">Loading Admin Dashboard...</div>;

  if (error) return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 max-w-md text-center">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="mb-4">{error}</p>
        <Link href="/" className="text-blue-600 font-semibold hover:underline flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Go back to login
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-xl">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Control</h1>
              <p className="text-gray-500">System-wide overview and user management</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition">
            <ArrowLeft size={20} /> Back to App
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_users}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Bot size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Bots</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_bots}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Published Bots</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_published_bots}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Search & Result */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Search size={20} /> Search User
              </h2>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="email"
                  placeholder="user@example.com"
                  className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  required
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                  Search
                </button>
              </form>

              {searchResult && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-2">{searchResult.email}</h3>
                  <p className="text-sm text-gray-500 mb-4">ID: {searchResult.user_id}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Bots</p>
                      <p className="text-xl font-bold">{searchResult.total_bots}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Published</p>
                      <p className="text-xl font-bold text-green-600">{searchResult.published_bots}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All Bots Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">System Bots</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Bot Name</th>
                      <th className="px-6 py-4 font-semibold">User ID</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allBots.map((bot) => (
                      <tr key={bot.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">{bot.name}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">{bot.user_id.slice(0, 8)}...</td>
                        <td className="px-6 py-4">
                          {bot.is_published ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase">Published</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold uppercase">Private</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {bot.created_at ? new Date(bot.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
