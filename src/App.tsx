/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Inbox, 
  Trash2, 
  Copy, 
  Download, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  Search, 
  Check, 
  AlertCircle,
  X,
  FileText,
  Mail,
  ChevronRight,
  Clipboard,
  Upload,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Account, GraphMessage, refreshAccessToken, fetchGraphInbox, extractOtp } from './lib/graph';

// --- Components ---

/**
 * Inbox Modal to view historical messages
 */
function InboxModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const [messages, setMessages] = useState<GraphMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<GraphMessage | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function loadInbox() {
      try {
        const token = await refreshAccessToken(account.clientId, account.refreshToken);
        const data = await fetchGraphInbox(token);
        setMessages(data);
      } catch (err: any) {
        setError(err.message || "Failed to load inbox");
      } finally {
        setLoading(false);
      }
    }
    loadInbox();
  }, [account]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border-2 border-slate-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-[8px_8px_0px_rgba(15,23,42,1)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-slate-900 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-200">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900">Inbox Explorer</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{account.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg border-2 border-transparent hover:border-slate-900 transition-all text-slate-400 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* List */}
          {!isFullscreen && (
            <div className="w-1/2 border-r-2 border-slate-900 overflow-y-auto custom-scrollbar bg-slate-50/30">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="font-bold text-xs uppercase tracking-widest">Accessing Graph...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-red-500 p-6 text-center">
                  <AlertCircle className="w-10 h-10" />
                  <p className="font-bold text-sm uppercase tracking-tight">{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 p-8 text-center uppercase tracking-widest font-black opacity-40">
                  <Mail className="w-12 h-12 mb-4" />
                  <p>Storage Empty</p>
                </div>
              ) : (
                <div className="divide-y-2 divide-slate-100">
                  {messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedMsg(msg)}
                      className={`w-full text-left p-4 hover:bg-[#c1fcda]/20 transition-all group flex flex-col gap-1 ${selectedMsg?.id === msg.id ? 'bg-[#c1fcda]/40' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(msg.receivedDateTime).toLocaleTimeString()} — {new Date(msg.receivedDateTime).toLocaleDateString()}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-300 transition-all ${selectedMsg?.id === msg.id ? 'translate-x-1 text-slate-900' : 'group-hover:translate-x-1'}`} />
                      </div>
                      <h4 className="font-bold text-slate-900 line-clamp-1 text-sm">{msg.subject || "(No Subject)"}</h4>
                      <p className="text-xs font-medium text-slate-500 line-clamp-1">{msg.bodyPreview}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className={`${isFullscreen ? 'w-full' : 'w-1/2'} flex flex-col bg-white transition-all duration-300`}>
            {selectedMsg ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b-2 border-slate-900 flex items-start justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-black text-slate-900 text-lg leading-tight">{selectedMsg.subject}</h3>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Received: {new Date(selectedMsg.receivedDateTime).toLocaleString()}</span>
                      <a 
                        href={selectedMsg.webLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1 text-emerald-600 hover:underline"
                      >
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 border-2 border-slate-900 rounded-lg hover:bg-[#c1fcda] transition-all shadow-[2px_2px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-white"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                   {selectedMsg.body.contentType === 'html' ? (
                    <div 
                      className={`text-slate-700 text-sm prose prose-slate max-w-none bg-white border-2 border-slate-100 rounded-xl p-4 md:p-6 ${isFullscreen ? 'md:p-12' : ''}`}
                      dangerouslySetInnerHTML={{ __html: selectedMsg.body.content }}
                    />
                  ) : (
                    <pre className={`text-slate-700 text-sm whitespace-pre-wrap font-mono bg-slate-50 border-2 border-slate-100 rounded-xl p-4 md:p-6 ${isFullscreen ? 'md:p-12' : ''}`}>
                      {selectedMsg.body.content}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-200 p-8 text-center">
                <Mail className="w-24 h-24 mb-6 opacity-40 rotate-12" />
                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">Select Message Header</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Import Modal for pasting account info
 */
function ImportModal({ onImport, onClose }: { onImport: (lines: string[]) => void; onClose: () => void }) {
  const [text, setText] = useState("");

  const handleImport = () => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    onImport(lines);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setText(prev => (prev ? prev + '\n' + content : content));
      };
      reader.readAsText(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border-2 border-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-[8px_8px_0px_rgba(15,23,42,1)]"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#c1fcda] border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_rgba(15,23,42,1)]">
               <Upload className="w-5 h-5 text-slate-900" />
             </div>
             <h3 className="font-black text-2xl text-slate-900 uppercase">Input Stream</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full border-2 border-transparent transition-all"><X /></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Protocol: email|pass|refresh_token|client_id</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="user@outlook.com|pass123|eyJ0eX...|12345-abc-..."
              className="w-full h-48 bg-slate-50 border-2 border-slate-900 rounded-xl p-4 text-slate-900 font-mono text-xs focus:bg-white transition-all outline-none custom-scrollbar resize-none font-bold"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer group">
              <input type="file" className="hidden" accept=".txt" onChange={handleFileChange} />
              <div className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-slate-300 group-hover:border-slate-900 rounded-xl transition-all h-14 bg-slate-50 group-hover:bg-white">
                <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 uppercase tracking-widest">Select .TXT</span>
              </div>
            </label>
            <button
               disabled={!text.trim()}
               onClick={handleImport}
               className="neo-button h-14 flex-[0.8]"
            >
              Stream In
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Export Modal with custom formatter
 */
function ExportModal({ accounts, onClose }: { accounts: Account[]; onClose: () => void }) {
  const [format, setFormat] = useState("{email}|{password}|{otp}");
  
  const presets = [
    "{email}|{password}",
    "{email}:{password}",
    "{email}|{password}|{otp}",
    "{email}|{password}|{otp}|{time}",
  ];

  const handleExport = () => {
    const output = accounts.map(acc => {
      return format
        .replace(/{email}/g, acc.email)
        .replace(/{password}/g, acc.password)
        .replace(/{otp}/g, acc.latestOtp)
        .replace(/{status}/g, acc.status)
        .replace(/{time}/g, acc.lastChecked);
    }).join('\n');

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exported_accounts_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border-2 border-slate-900 rounded-2xl w-full max-w-md p-6 shadow-[8px_8px_0px_rgba(15,23,42,1)]"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-400 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_rgba(15,23,42,1)]">
               <Download className="w-5 h-5 text-slate-900" />
             </div>
             <h3 className="font-black text-2xl text-slate-900 uppercase">Export Hub</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full border-2 border-transparent transition-all"><X /></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Template Syntax</label>
            <input
              type="text"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl p-4 text-slate-900 font-mono text-sm focus:bg-white transition-all outline-none font-bold shadow-inner"
            />
            <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Vars: <code className="text-emerald-600 underline">{`{email}, {password}, {otp}, {status}, {time}`}</code>
            </p>
          </div>

          <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Schemes</label>
             <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button 
                    key={p} 
                    onClick={() => setFormat(p)}
                    className={`text-[10px] font-black px-3 py-2 rounded-lg border-2 transition-all shadow-[2px_2px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${format === p ? 'bg-emerald-400 border-slate-900 text-slate-900' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900'}`}
                  >
                    {p}
                  </button>
                ))}
             </div>
          </div>

          <button
             onClick={handleExport}
             className="neo-button w-full h-14 !bg-[#c1fcda]"
          >
            Download {accounts.length} units
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Main App Component ---

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  
  // Modals
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [activeAccountForInbox, setActiveAccountForInbox] = useState<Account | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('accounts_v1');
    if (saved) {
      setAccounts(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('accounts_v1', JSON.stringify(accounts));
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    if (!search) return accounts;
    return accounts.filter(acc => 
      acc.email.toLowerCase().includes(search.toLowerCase()) || 
      acc.status.toLowerCase().includes(search.toLowerCase())
    );
  }, [accounts, search]);

  const handleImport = (lines: string[]) => {
    const newAccounts: Account[] = lines.map(line => {
      const parts = line.split('|');
      return {
        id: crypto.randomUUID(),
        email: parts[0] || "",
        password: parts[1] || "",
        refreshToken: parts[2] || "",
        clientId: parts[3] || "",
        status: "Ready",
        latestOtp: "",
        lastChecked: "",
        raw: line
      };
    }).filter(a => a.email && a.refreshToken);

    setAccounts(prev => [...prev, ...newAccounts]);
  };

  const handleFetchOtp = async (account: Account) => {
    setLoadingIds(prev => new Set(prev).add(account.id));
    updateAccountStatus(account.id, "Refreshing...");

    try {
      const token = await refreshAccessToken(account.clientId, account.refreshToken);
      updateAccountStatus(account.id, "Fetching Mail...");
      
      const messages = await fetchGraphInbox(token);
      let foundOtp = "";
      
      for (const msg of messages) {
        const text = `${msg.subject} ${msg.bodyPreview}`.toLowerCase();
        const otp = extractOtp(text);
        if (otp) {
          foundOtp = otp;
          break;
        }
      }

      if (foundOtp) {
        setAccounts(prev => prev.map(a => 
          a.id === account.id 
            ? { ...a, latestOtp: foundOtp, status: "Success", lastChecked: new Date().toLocaleTimeString() }
            : a
        ));
      } else {
        updateAccountStatus(account.id, "OTP Not Found");
      }
    } catch (err: any) {
      console.error(err);
      updateAccountStatus(account.id, err.message || "Error");
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(account.id);
        return next;
      });
    }
  };

  const updateAccountStatus = (id: string, status: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleFetchAll = async () => {
    const targetIds = selectedIds.size > 0 ? Array.from(selectedIds) : accounts.map(a => a.id);
    const targetAccounts = accounts.filter(a => targetIds.includes(a.id));
    await Promise.all(targetAccounts.map(acc => handleFetchOtp(acc)));
  };

  const deleteAccounts = () => {
    if (selectedIds.size === 0) return;
    setAccounts(prev => prev.filter(a => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAccounts.map(a => a.id)));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation Bar */}
      <nav className="bg-[#f4f7f5]/80 backdrop-blur-md border-b-2 border-slate-900 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center border-2 border-slate-900 rounded-lg bg-[#c1fcda] rotate-[-10deg]">
              <RefreshCw className="w-5 h-5 text-slate-900" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900 uppercase">Pro OTP</span>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-12 flex-1 w-full space-y-24">
        {/* Header/Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start shrink-0">
          <div className="space-y-6">
            <div className="text-emerald-600 font-bold text-sm tracking-widest uppercase">// IDENTITY INFRASTRUCTURE</div>
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
              Identity at <span className="text-emerald-500">Scale.</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium max-w-sm leading-relaxed">
              High-entropy Microsoft accounts. Aged, warmed, and ready for deployment. Restocked every 30 seconds.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={() => setShowImport(true)} className="neo-button !bg-[#c1fcda]">
                Initialize Import
              </button>
              <button disabled={accounts.length === 0} onClick={() => setShowExport(true)} className="neo-button-secondary">
                Check Status
              </button>
            </div>
          </div>

          <div className="bg-white neo-border rounded-xl p-6 h-full flex flex-col min-h-[240px]">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">LIVE FEED — PRO-OTP NETWORK</span>
            </div>
            <div className="flex-1 font-mono text-[11px] space-y-3">
               {[
                 "User 346... imported 1x Hotmail_Trusted",
                 "Health check: All endpoints nominal",
                 "User 546... fetched 493x Outlook_Auth",
                 `System: ${accounts.length} accounts currently in queue`,
                 "Token proxy: status=200 ok"
               ].map((log, i) => (
                 <div key={i} className="flex gap-2 text-slate-600">
                    <span className="text-slate-400">›</span>
                    <span>{log}</span>
                 </div>
               ))}
               <div className="w-2 h-4 bg-slate-900 animate-pulse inline-block align-middle ml-1" />
            </div>
          </div>
        </section>

        {/* Main Content: Accounts Management */}
        <section className="space-y-8 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white neo-border rounded-lg flex items-center justify-center">
                <Inbox className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Account Stock</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time mail management from API</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search accounts..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border-2 border-slate-900 rounded-lg pl-9 pr-4 py-2 text-sm font-bold shadow-[2px_2px_0px_rgba(15,23,42,1)] focus:translate-y-[1px] focus:translate-x-[1px] focus:shadow-none transition-all outline-none"
                />
              </div>
              <button onClick={handleFetchAll} className="neo-button !py-2 !px-4 text-sm !bg-[#c1fcda]">
                <RefreshCw className={`w-4 h-4 ${loadingIds.size > 0 ? 'animate-spin' : ''}`} />
                {selectedIds.size > 0 ? `Fetch ${selectedIds.size}` : 'Fetch All'}
              </button>
            </div>
          </div>

          <div className="bg-white neo-border rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="p-4 w-12">
                     <button 
                       onClick={toggleSelectAll}
                       className={`w-5 h-5 rounded flex items-center justify-center transition-colors border-2 border-slate-900 ${selectedIds.size === filteredAccounts.length && filteredAccounts.length > 0 ? 'bg-emerald-400' : 'bg-white'}`}
                     >
                       {selectedIds.size === filteredAccounts.length && filteredAccounts.length > 0 && <Check className="w-3 h-3 text-slate-900 stroke-[3]" />}
                     </button>
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mail Type / Details</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">OTP Response</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <Inbox className="w-16 h-16 text-slate-200" />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No accounts in stock</p>
                          <button onClick={() => setShowImport(true)} className="text-emerald-500 font-bold hover:underline">Import Accounts &rarr;</button>
                       </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => (
                    <tr key={account.id} className={`group hover:bg-slate-50/50 transition-colors ${selectedIds.has(account.id) ? 'bg-[#c1fcda]/10' : ''}`}>
                      <td className="p-5">
                         <button 
                          onClick={() => toggleSelect(account.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all border-2 border-slate-900 ${selectedIds.has(account.id) ? 'bg-emerald-400' : 'bg-white'}`}
                        >
                          {selectedIds.has(account.id) && <Check className="w-3 h-3 text-slate-900 stroke-[3]" />}
                        </button>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-slate-900" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {account.email}
                              <button onClick={() => copyToClipboard(account.email)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3" /></button>
                            </div>
                            <div className="text-xs font-mono text-slate-400">{account.password}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${account.status === 'Success' ? 'bg-emerald-500' : account.status.startsWith('Err') ? 'bg-red-500' : 'bg-blue-500'}`} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{account.status}</span>
                          </div>
                          {account.lastChecked && <div className="text-[10px] font-bold text-slate-300 ml-4">{account.lastChecked}</div>}
                        </div>
                      </td>
                      <td className="p-5">
                         {loadingIds.has(account.id) ? (
                           <div className="h-10 flex items-center gap-2 px-4 bg-slate-50 border-2 border-slate-900 rounded-lg font-bold text-slate-400 text-sm">
                             <RefreshCw className="w-4 h-4 animate-spin" /> FETCHING...
                           </div>
                         ) : account.latestOtp ? (
                           <button 
                             onClick={() => copyToClipboard(account.latestOtp)}
                             className="h-10 flex items-center gap-3 px-4 bg-[#c1fcda] border-2 border-slate-900 rounded-lg font-black text-slate-900 text-lg tracking-widest shadow-[2px_2px_0px_rgba(15,23,42,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                           >
                             {account.latestOtp} <Copy className="w-4 h-4 opacity-50" />
                           </button>
                         ) : (
                           <div className="h-10 flex items-center px-4 bg-slate-50 border-2 border-slate-900 rounded-lg font-bold text-slate-300 text-xs uppercase italic tracking-widest">
                             Pending
                           </div>
                         )}
                      </td>
                      <td className="p-5 text-right w-32">
                         <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setActiveAccountForInbox(account)}
                              className="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_rgba(15,23,42,1)] hover:bg-[#c1fcda] transition-all"
                            >
                               <Inbox className="w-5 h-5 text-slate-900" />
                            </button>
                            <button 
                              onClick={() => handleFetchOtp(account)}
                              className="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_rgba(15,23,42,1)] hover:bg-slate-50 transition-all"
                            >
                               <RefreshCw className="w-5 h-5 text-slate-900" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}
        {showExport && <ExportModal accounts={selectedIds.size > 0 ? accounts.filter(a => selectedIds.has(a.id)) : accounts} onClose={() => setShowExport(false)} />}
        {activeAccountForInbox && <InboxModal account={activeAccountForInbox} onClose={() => setActiveAccountForInbox(null)} />}
      </AnimatePresence>
    </div>
  );
}
