"use client";

import { useState } from "react";
import { Sparkles, Plus, Command, ChevronRight, Trash2 } from "lucide-react";
import axios from "axios";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface Bot {
  id: string;
  name: string;
}

interface DashboardProps {
  bots: Bot[];
  onSelectBot: (bot: Bot) => void;
  onCreateBot: () => void;
  onRefreshBots: () => void;
  token: string | null;
}

export default function Dashboard({ bots, onSelectBot, onCreateBot, onRefreshBots, token }: DashboardProps) {
  const [modalData, setModalData] = useState<{ isOpen: boolean; botId: string; botName: string }>({
    isOpen: false,
    botId: "",
    botName: ""
  });
  
  const handleDeleteClick = (e: React.MouseEvent, botId: string, botName: string) => {
    e.stopPropagation();
    setModalData({ isOpen: true, botId, botName });
  };

  const performDelete = async () => {
    try {
      await axios.delete(`/api/bots/${modalData.botId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefreshBots();
    } catch (err) {
      alert("Failed to delete the agent.");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 sm:p-12 bg-[#fafafa] overflow-y-auto scrollbar-visible">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Intelligence Workspace</h2>
          <p className="text-slate-500 text-base font-medium">
            Manage your custom AI agents and knowledge bases.
          </p>
        </div>

        {/* Grid of Bots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          <button
            onClick={onCreateBot}
            className="group relative flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <Plus size={28} />
            </div>
            <p className="font-bold text-slate-900">Initialize Agent</p>
            <p className="text-xs text-slate-500 mt-1">Create a new brain</p>
          </button>

          {bots.map((bot) => (
            <div
              key={bot.id}
              onClick={() => onSelectBot(bot)}
              className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              <button 
                onClick={(e) => handleDeleteClick(e, bot.id, bot.name)}
                className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all duration-200 z-10"
              >
                <Trash2 size={16} />
              </button>

              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Command size={20} />
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1 truncate pr-8">{bot.name}</h3>
              <p className="text-xs font-medium text-slate-400 mb-4 uppercase tracking-wider">
                ID: {bot.id.slice(0, 8)}...
              </p>
              
              <div className="flex items-center gap-2 mt-auto">
                <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                  Active
                </div>
                <div className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                  RAG-Enabled
                </div>
              </div>
            </div>
          ))}
        </div>

        {bots.length === 0 && (
          <div className="mt-12 p-10 bg-blue-600 rounded-[3rem] text-white overflow-hidden relative shadow-2xl shadow-blue-200">
            <div className="relative z-10 max-w-md">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6"><Sparkles size={24} /></div>
              <h3 className="text-2xl font-bold mb-3">Welcome to OmniService</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">You haven't initialized any agents yet.</p>
              <button onClick={onCreateBot} className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg">Get Started</button>
            </div>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={modalData.isOpen}
        botName={modalData.botName}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        onConfirm={performDelete}
      />
    </div>
  );
}
