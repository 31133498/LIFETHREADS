
import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry } from '../types';
import { X, Image as ImageIcon, Calendar, Save, Trash, UploadCloud, Maximize2, Loader2, Sparkles } from 'lucide-react';
import { generateEntryReflection, generateReflectionImage } from '../services/geminiService';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<DiaryEntry>) => void;
  initialData?: DiaryEntry | null;
}

const EntryModal: React.FC<EntryModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [images, setImages] = useState<string[]>([]);
  const [aiReflection, setAiReflection] = useState<string | undefined>(undefined);
  const [aiImage, setAiImage] = useState<string | undefined>(undefined);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      setDate(new Date(initialData.date).toISOString().slice(0, 16));
      setImages(initialData.images || []);
      setAiReflection(initialData.aiReflection);
      setAiImage(initialData.aiImage);
    } else {
      setContent('');
      setDate(new Date().toISOString().slice(0, 16));
      setImages([]);
      setAiReflection(undefined);
      setAiImage(undefined);
    }
  }, [initialData, isOpen]);

  // CRITICAL: Optimizes images to prevent localStorage QuotaExceededError (the "blank screen" issue)
  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000; // Limit resolution for storage
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Use JPEG compression (0.7 quality) to drastically reduce byte size
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const processFiles = async (files: FileList) => {
    setIsProcessing(true);
    try {
      const optimizedImages = await Promise.all(
        Array.from(files)
          .filter(file => file.type.startsWith('image/'))
          .map(file => optimizeImage(file))
      );
      setImages(prev => [...prev, ...optimizedImages]);
    } catch (error) {
      console.error("Image processing failed:", error);
      alert("Error processing images. They might be too large.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReflect = async () => {
    if (!content.trim()) {
      alert("Please write something first so the AI can reflect on it!");
      return;
    }
    setIsReflecting(true);
    try {
      // Parallel execution for best performance
      const [reflection, image] = await Promise.all([
        generateEntryReflection(content, date),
        generateReflectionImage(content)
      ]);
      setAiReflection(reflection);
      setAiImage(image || undefined);
    } catch (error) {
      console.error("AI Generation error:", error);
    } finally {
      setIsReflecting(false);
    }
  };

  const handleSave = () => {
    if (!content.trim() || isProcessing || isReflecting) return;
    onSave({
      id: initialData?.id,
      content,
      date: new Date(date).toISOString(),
      images,
      aiReflection,
      aiImage
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-hidden">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {initialData ? 'Edit Memory' : 'New Memory'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <Calendar size={14} /> Date & Time
            </label>
            <input 
              type="datetime-local" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Text Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-500">Thoughts</label>
              <button 
                onClick={handleReflect}
                disabled={isReflecting || !content.trim()}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 hover:bg-indigo-50 px-2 py-1 rounded-md transition-all disabled:opacity-40"
              >
                {isReflecting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                Reflect with AI
              </button>
            </div>
            <textarea 
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in your life? All moments are worth keeping..."
              className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-700"
            />
          </div>

          {/* Photos Area */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-semibold text-slate-500">Your Photos</label>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} 
                {isProcessing ? 'Optimizing...' : 'Add Photos'}
              </button>
              <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={(e) => e.target.files && processFiles(e.target.files)} className="hidden" />
            </div>

            <div 
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
              }}
              className={`relative min-h-[140px] border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center p-4 ${
                dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              {images.length === 0 ? (
                <div className="text-center opacity-40">
                  <ImageIcon size={32} className="mx-auto mb-2" />
                  <p className="text-xs font-medium">Drag photos here</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 w-full">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square group">
                      <img src={img} className="w-full h-full object-cover rounded-xl border border-slate-200 cursor-pointer" onClick={() => setZoomImage(img)} />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter((_, i) => i !== idx)); }} 
                        className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Preview Area */}
          {(aiReflection || aiImage || isReflecting) && (
            <div className="bg-gradient-to-br from-indigo-50 to-violet-100 border border-indigo-200 rounded-2xl p-5 relative overflow-hidden shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-tighter">AI Visual Insight</span>
                {aiReflection && !isReflecting && (
                  <button onClick={() => {setAiReflection(undefined); setAiImage(undefined)}} className="ml-auto text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {isReflecting ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 bg-indigo-200/50 rounded w-3/4"></div>
                  <div className="h-3 bg-indigo-200/50 rounded w-1/2"></div>
                  <div className="h-32 bg-indigo-200/50 rounded-xl w-full"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiReflection && <p className="text-sm text-indigo-900 italic leading-relaxed font-medium">"{aiReflection}"</p>}
                  {aiImage && (
                    <div className="relative group">
                      <img src={aiImage} alt="AI Vision" className="w-full h-auto rounded-xl shadow-md border border-white cursor-zoom-in transition-transform hover:scale-[1.01]" onClick={() => setZoomImage(aiImage)} />
                      <div className="absolute bottom-2 right-2 bg-indigo-600/20 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-indigo-800 font-black uppercase">Generated Dream</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={handleSave}
            disabled={!content.trim() || isProcessing || isReflecting}
            className="flex-grow flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]"
          >
            <Save size={18} /> {initialData ? 'Update Memory' : 'Save to My Thread'}
          </button>
        </div>
      </div>

      {zoomImage && (
        <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-8 cursor-zoom-out" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95" />
          <button className="absolute top-6 right-6 p-2 text-white/50 hover:text-white"><X size={32} /></button>
        </div>
      )}
    </div>
  );
};

export default EntryModal;
