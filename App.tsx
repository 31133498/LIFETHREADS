
import React, { useState, useEffect, useMemo } from 'react';
import { DiaryEntry } from './types';
import TimelineEntry from './components/TimelineEntry';
import EntryModal from './components/EntryModal';
/* Added Loader2 to imports from lucide-react */
import { Plus, Search, Sparkles, User, Settings, Info, Calendar as CalendarIcon, X as XIcon, AlertCircle, Loader2 } from 'lucide-react';
import { generateEntryReflection, generateYearSummary, generateReflectionImage } from './services/geminiService';

const App: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReflectingId, setIsReflectingId] = useState<string | null>(null);
  const [yearSummary, setYearSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeThreads_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch (e) {
      console.error("Failed to load entries from storage", e);
    }
  }, []);

  // Persistent Save with Safety Checks
  useEffect(() => {
    // If entries are empty, we still want to save the empty array to clear storage
    try {
      const serialized = JSON.stringify(entries);
      localStorage.setItem('lifeThreads_entries', serialized);
      setStorageError(null);
    } catch (e) {
      console.error("LocalStorage Limit Reached", e);
      setStorageError("Storage full! Try deleting some photos or older entries to save new ones.");
    }
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const filtered = entries.filter(e => 
      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.date.includes(searchQuery)
    );
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, searchQuery]);

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm("Are you sure you want to delete this memory forever?")) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSaveEntry = (data: Partial<DiaryEntry>) => {
    if (data.id) {
      setEntries(prev => prev.map(e => e.id === data.id ? { ...e, ...data } as DiaryEntry : e));
    } else {
      const newEntry: DiaryEntry = {
        id: crypto.randomUUID(),
        content: data.content || '',
        date: data.date || new Date().toISOString(),
        images: data.images || [],
        aiReflection: data.aiReflection,
        aiImage: data.aiImage
      };
      setEntries(prev => [newEntry, ...prev]);
    }
  };

  const handleReflect = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || isReflectingId) return;

    setIsReflectingId(id);
    try {
      const [reflection, aiImage] = await Promise.all([
        generateEntryReflection(entry.content, entry.date),
        generateReflectionImage(entry.content)
      ]);

      setEntries(prev => prev.map(e => 
        e.id === id ? { ...e, aiReflection: reflection, aiImage: aiImage || undefined } : e
      ));
    } catch (err) {
      console.error("AI Reflection failed", err);
    } finally {
      setIsReflectingId(null);
    }
  };

  const handleGenerateYearSummary = async () => {
    if (entries.length === 0) return;
    setIsGeneratingSummary(true);
    try {
      const summary = await generateYearSummary(entries.map(e => `${e.date}: ${e.content}`));
      setYearSummary(summary);
    } catch (err) {
      console.error("Year summary failed", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-slate-50 text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      {/* Global Storage Warning */}
      {storageError && (
        <div className="fixed top-20 inset-x-4 z-[100] max-w-lg mx-auto bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 shadow-2xl text-rose-800 animate-in slide-in-from-top-4">
          <AlertCircle className="shrink-0 text-rose-500" size={20} />
          <p className="text-sm font-semibold">{storageError}</p>
          <button onClick={() => setStorageError(null)} className="ml-auto p-1 hover:bg-rose-100 rounded-full transition-colors"><XIcon size={16} /></button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-800">LifeThreads</h1>
              <p className="text-[9px] uppercase font-black text-indigo-400 tracking-[0.2em] -mt-0.5">Your Story, Interconnected</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <button className="text-sm font-bold text-indigo-600 px-4 py-2 hover:bg-indigo-50 rounded-xl transition-colors">Thread View</button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 mt-6 md:mt-10 mb-12">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2.5rem] p-8 md:p-14 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-sm border border-indigo-400/30">Welcome back</span>
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-[1.15]">How is your story unfolding?</h2>
            <p className="text-indigo-100 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-medium">
              A digital vault for your memories, connected like a conversation with your past self.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button onClick={handleAddEntry} className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0">
                <Plus size={22} strokeWidth={3} /> New Entry
              </button>
              <button 
                onClick={handleGenerateYearSummary} 
                disabled={isGeneratingSummary || entries.length === 0} 
                className="bg-indigo-500/40 backdrop-blur-lg border border-indigo-300/30 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-500/60 transition-all disabled:opacity-50"
              >
                {isGeneratingSummary ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />} 
                {isGeneratingSummary ? "Thinking..." : "Summarize the Year"}
              </button>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-60 h-60 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>

        {yearSummary && (
          <div className="mt-8 bg-white border border-indigo-100 p-8 md:p-10 rounded-[2rem] shadow-sm animate-in fade-in slide-in-from-top-4 relative group">
            <button onClick={() => setYearSummary(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
              <XIcon size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Sparkles size={24} /></div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Your Narrative</h3>
            </div>
            <p className="text-slate-700 leading-relaxed italic text-lg whitespace-pre-wrap font-serif">"{yearSummary}"</p>
          </div>
        )}
      </section>

      {/* Main Feed */}
      <main className="max-w-3xl mx-auto px-4">
        <div className="mb-12 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search through your life threads..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none shadow-sm transition-all text-lg" 
          />
        </div>

        <div className="relative pb-20">
          {filteredEntries.length > 0 ? (
            <div className="space-y-0">
              {filteredEntries.map((entry, idx) => (
                <TimelineEntry 
                  key={entry.id} 
                  entry={entry} 
                  isLast={idx === filteredEntries.length - 1} 
                  onDelete={handleDeleteEntry} 
                  onEdit={handleEditEntry} 
                  onReflect={handleReflect} 
                  isReflecting={isReflectingId === entry.id} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info className="text-slate-300" size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-700 mb-3">Your thread is waiting.</h3>
              <p className="text-slate-400 mb-10 max-w-xs mx-auto text-lg leading-relaxed">The best way to predict the future is to document the present.</p>
              <button 
                onClick={handleAddEntry} 
                className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-1 active:scale-95 active:translate-y-0"
              >
                Create My First Entry
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action (Mobile Only) */}
      <button 
        onClick={handleAddEntry} 
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform active:bg-indigo-700"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      <EntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEntry} 
        initialData={editingEntry} 
      />
    </div>
  );
};

export default App;
