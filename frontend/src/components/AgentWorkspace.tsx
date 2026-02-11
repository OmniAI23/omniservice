"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { 
  FileText, 
  AudioWaveform, 
  MessageSquare, 
  Share2, 
  Database,
  Send,
  Sparkles,
  Search,
  Trash2,
  ExternalLink,
  Shield,
  Info,
  Globe,
  Plus,
  Copy,
  Check,
  Code
} from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import Toast, { useToast } from "./Toast";

interface AgentWorkspaceProps {
  bot: any;
  token: string | null;
  onDeleteSuccess: () => void;
}

export default function AgentWorkspace({ bot: initialBot, token, onDeleteSuccess }: AgentWorkspaceProps) {
  const [bot, setBot] = useState(initialBot);
  const [activeTab, setActiveTab] = useState<'knowledge' | 'chat' | 'publish'>('chat');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Toast Management
  const { toast, showToast, hideToast } = useToast();

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // URL Crawler State
  const [urlInput, setUrlInput] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);

  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const publicChatUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/public/bot/${bot.public_id}/chat`
    : "";

  const embedSnippet = `<script 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" 
  data-bot-id="${bot.public_id}"
></script>`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput || !bot) return;

    const userMsg = { role: "user", text: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/chat/chat?bot_id=${bot.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_input: chatInput }),
        }
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botResponse = "";

      setChatMessages((prev) => [...prev, { role: "bot", text: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        botResponse += chunk;
        setChatMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].text = botResponse;
          return updated;
        });
      }
    } catch (err) {
      console.error("Chat error", err);
      showToast("Chat response failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlCrawl = async () => {
    if (!urlInput) return;
    setIsCrawling(true);
    try {
      await axios.post(`/api/upload-url?bot_id=${bot.id}`, 
        { url: urlInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Website integrated!");
      setUrlInput("");
    } catch (err) {
      showToast("Crawl failed. Check URL.", "error");
    } finally {
      setIsCrawling(false);
    }
  };

  const togglePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await axios.patch(`/api/bots/${bot.id}`, 
        { is_published: !bot.is_published },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBot(res.data.bot);
      showToast(res.data.bot.is_published ? "Agent is now live!" : "Agent unpublished.");
    } catch (err) {
      showToast("Status update failed.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const performDelete = async () => {
    try {
      await axios.delete(`/api/bots/${bot.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onDeleteSuccess();
    } catch (err) {
      showToast("Failed to delete agent.", "error");
    }
  };

  const copyToClipboard = (text: string, setter: any) => {
    navigator.clipboard.writeText(text);
    setter(true);
    showToast("Copied to clipboard!");
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Management Header */}
      <header className="border-b border-slate-100 bg-white shrink-0 z-30">
        <div className="px-6 py-6 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{bot.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Agent ID: <span className="font-mono text-slate-500 uppercase">{bot.id}</span>
                  </p>
                  {bot.is_published && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded-full uppercase tracking-tighter">
                          Live & Public
                      </span>
                  )}
              </div>
            </div>
            
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-600 hover:text-white transition-all self-start border border-red-100"
            >
              <Trash2 size={12} />
              Delete Agent
            </button>
          </div>
          
          <nav className="flex items-center p-1 bg-slate-100 rounded-xl self-start">
            <TabButton active={activeTab === 'knowledge'} onClick={() => setActiveTab('knowledge')} icon={<Database size={14} />} label="Knowledgebase" />
            <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={14} />} label="Test Chat" />
            <TabButton active={activeTab === 'publish'} onClick={() => setActiveTab('publish')} icon={<Share2 size={14} />} label="Publish" />
          </nav>
        </div>
      </header>

      {/* Tab Content Area */}
      <div className="flex-1 min-h-0 relative bg-slate-50/30 flex flex-col">
        {activeTab === 'knowledge' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <UploadCard 
                    title="Documents" 
                    description="PDF, DOCX, or TXT." 
                    icon={<FileText size={20} className="text-blue-500" />} 
                    accept=".pdf,.docx,.txt" 
                    onUpload={async (fd: any) => { 
                      await axios.post(`/api/upload`, fd, { headers: { Authorization: `Bearer ${token}` } });
                    }} 
                    showToast={showToast}
                    botId={bot.id} 
                  />
                  
                  <UploadCard 
                    title="Audio" 
                    description="MP3, WAV, etc." 
                    icon={<AudioWaveform size={20} className="text-purple-500" />} 
                    accept="audio/*" 
                    onUpload={async (fd: any) => {
                      await axios.post(`/api/upload/audio`, fd, { headers: { Authorization: `Bearer ${token}` } });
                    }} 
                    showToast={showToast}
                    botId={bot.id} 
                    variant="purple" 
                  />
                  
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Globe size={20} /></div>
                          <h4 className="font-bold text-slate-900 text-sm">Website Crawler</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4">Integrate live web content into your agent's brain.</p>
                      <div className="mt-auto relative">
                          <input type="url" placeholder="https://example.com" className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                          <button onClick={handleUrlCrawl} disabled={isCrawling || !urlInput} className="absolute right-1 top-1 p-1 bg-emerald-600 text-white rounded-md disabled:opacity-50">
                              {isCrawling ? <span className="animate-spin block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span> : <Plus size={14} />}
                          </button>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-8">
              <div className="max-w-4xl mx-auto w-full">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-fade-in py-20">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Sparkles size={28} /></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Sandbox Environment</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Test your agent's responses based on the uploaded knowledge base.</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in mb-6`}>
                    <div className={`max-w-[85%] sm:max-w-[75%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm ${msg.role === "user" ? "bg-slate-800 text-white" : "bg-blue-600 text-white"}`}>
                          {msg.role === "user" ? "ME" : "AI"}
                      </div>
                      <div className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-slate-100 text-slate-900 rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"}`}>
                          <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                      <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-[10px]">AI</div>
                          <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          </div>
                      </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-white border-t border-slate-100 shrink-0">
              <div className="max-w-4xl mx-auto relative">
                <input type="text" placeholder="Test your agent's knowledge..." className="w-full p-4 pl-5 pr-14 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-sm font-medium" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} />
                <button onClick={handleSendMessage} disabled={isLoading || !chatInput} className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all duration-200 disabled:opacity-30">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'publish' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10">
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative">
                  <div className="relative z-10">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Share2 size={28} /></div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Deploy your Intelligence</h3>
                      <p className="text-slate-500 font-medium mb-8">Deploy your agent as a public API or embed it on your own website.</p>
                      
                      <div className="space-y-6">
                          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                  <p className={`font-bold ${bot.is_published ? 'text-green-600' : 'text-slate-700'}`}>
                                    {bot.is_published ? 'Agent is Live' : 'Privately Managed'}
                                  </p>
                              </div>
                              <button 
                                onClick={togglePublish}
                                disabled={isPublishing}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg ${
                                    bot.is_published 
                                    ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 shadow-red-50" 
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-50"
                                }`}
                              >
                                {isPublishing ? 'Updating...' : bot.is_published ? 'Unpublish Agent' : 'Publish Agent'}
                              </button>
                          </div>
                          
                          {bot.is_published && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                {/* API Endpoint */}
                                <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <ExternalLink size={16} className="text-blue-500" />
                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Public API Endpoint</p>
                                        </div>
                                        <button onClick={() => copyToClipboard(publicChatUrl, setCopiedLink)} className="p-2 hover:bg-slate-50 rounded-lg transition text-slate-400 hover:text-blue-600">
                                            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-600 break-all border border-slate-100">
                                        POST {publicChatUrl}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">Send JSON: <code className="bg-slate-100 px-1">{"{ \"message\": \"...\" }"}</code> to interact.</p>
                                </div>

                                {/* Embedding Snippet */}
                                <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Code size={16} className="text-purple-500" />
                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Embedding Snippet</p>
                                        </div>
                                        <button onClick={() => copyToClipboard(embedSnippet, setCopiedSnippet)} className="p-2 hover:bg-slate-50 rounded-lg transition text-slate-400 hover:text-purple-600">
                                            {copiedSnippet ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <div className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-blue-300 break-all">
                                        {embedSnippet}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">Paste this snippet at the end of your <code className="bg-slate-100 px-1">{"<body>"}</code> tag.</p>
                                </div>
                            </div>
                          )}
                      </div>
                  </div>
                  <div className="absolute top-0 right-0 p-8"><Shield size={120} className="text-slate-50/50 -mr-10 -mt-10" /></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        botName={bot.name}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={performDelete}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${active ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
      {icon}{label}
    </button>
  );
}

function UploadCard({ title, description, icon, accept, onUpload, botId, showToast, variant = "blue" }: any) {
    const [isUploading, setIsUploading] = useState(false);
    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'blue' ? 'bg-blue-50' : 'bg-purple-50'}`}>{icon}</div>
                <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4">{description}</p>
            <div className="mt-auto">
                <label className={`cursor-pointer w-full py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${isUploading ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                    {isUploading ? "Uploading..." : "Upload File"}
                    <input type="file" accept={accept} className="hidden" disabled={isUploading} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("bot_id", botId);
                        try { 
                            await onUpload(formData); 
                            showToast(`${title} integrated!`);
                        } catch (err) { 
                            showToast("Upload failed", "error"); 
                        } finally { 
                            setIsUploading(false); 
                            e.target.value = ""; 
                        }
                    }} />
                </label>
            </div>
        </div>
    );
}
