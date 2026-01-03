
import React, { useState, useEffect, useMemo } from 'react';
import { DiaryEntry } from './types';
import TimelineEntry from './components/TimelineEntry';
import EntryModal from './components/EntryModal';
import { Plus, Search, Sparkles, User, Settings, Info, Calendar as CalendarIcon, X as XIcon, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    const saved = localStorage.getItem('lifeThreads_entries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setEntries(parsed);
      } catch (e) {
        console.error("Failed to parse saved entries");
        localStorage.removeItem('lifeThreads_entries'); // Clear corrupted data
      }
    }
  }, []);

  useEffect(() => {
    if (entries.length === 0) return;
    try {
      localStorage.setItem('lifeThreads_entries', JSON.stringify(entries));
      setStorageError(null);
    } catch (e) {
      console.error("Storage limit reached:", e);
      setStorageError("Memory storage is full! Please delete some entries or high-res photos.");
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
    if (window.confirm("Delete this memory? This cannot be undone.")) {
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
      console.error("Reflection failed", err);
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
      console.error("Summary failed", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-slate-50 text-slate-900 selection:bg-indigo-100">
      {storageError && (
        <div className="fixed top-20 inset-x-4 z-[100] max-w-lg mx-auto bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 shadow-xl text-rose-800 animate-in slide-in-from-top-4">
          <AlertCircle className="shrink-0" size={20} />
          <p className="text-sm font-semibold">{storageError}</p>
          <button onClick={() => setStorageError(null)} className="ml-auto p-1 hover:bg-rose-100 rounded-full"><XIcon size={16} /></button>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">LifeThreads</h1>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Digital Diary</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <button className="text-sm font-bold text-indigo-600 px-4 py-2 hover:bg-indigo-50 rounded-lg transition-colors">Timeline</button>
            <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Settings size={18} /></button>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 mt-8 mb-12">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Document your year.</h2>
            <p className="text-indigo-100 text-lg md:text-xl max-w-xl mb-8 leading-relaxed">
              Interconnected memories organized in a beautiful thread, enhanced by AI vision.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button onClick={handleAddEntry} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-lg active:scale-95"><Plus size={20} /> New Entry</button>
              <button onClick={handleGenerateYearSummary} disabled={isGeneratingSummary || entries.length === 0} className="bg-indigo-500/30 backdrop-blur-md border border-indigo-400/30 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500/40 transition-all disabled:opacity-50">
                <Sparkles size={20} className={isGeneratingSummary ? "animate-spin" : ""} /> {isGeneratingSummary ? "Thinking..." : "Summarize Year"}
              </button>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {yearSummary && (
          <div className="mt-8 bg-white border border-indigo-100 p-8 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-4 relative">
            <button onClick={() => setYearSummary(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"><XIcon size={20} /></button>
            <div className="flex items-center gap-2 mb-4"><Sparkles className="text-indigo-600" size={20} /><h3 className="text-lg font-bold text-slate-800">Your Year's Story</h3></div>
            <p className="text-slate-700 leading-relaxed italic whitespace-pre-wrap">{yearSummary}</p>
          </div>
        )}
      </section>

      <main className="max-w-4xl mx-auto px-4">
        <div className="mb-10 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search your life thread..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all" />
        </div>

        <div className="relative">
          {filteredEntries.length > 0 ? (
            <div className="space-y-0">
              {filteredEntries.map((entry, idx) => (
                <TimelineEntry key={entry.id} entry={entry} isLast={idx === filteredEntries.length - 1} onDelete={handleDeleteEntry} onEdit={handleEditEntry} onReflect={handleReflect} isReflecting={isReflectingId === entry.id} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <Info className="mx-auto text-slate-300 mb-4" size={40} />
              <h3 className="text-lg font-semibold text-slate-600">Nothing here yet</h3>
              <p className="text-slate-400 mb-6">Start your journey by adding your first memory.</p>
              <button onClick={handleAddEntry} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Get Started</button>
            </div>
          )}
        </div>
      </main>

      <button onClick={handleAddEntry} className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"><Plus size={28} /></button>
      <EntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEntry} initialData={editingEntry} />
    </div>
  );
};

export default App;
