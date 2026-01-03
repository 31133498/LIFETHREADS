
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

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
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
      alert("Failed to process images. Storage may be full.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReflect = async () => {
    if (!content.trim()) return;
    setIsReflecting(true);
    try {
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
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
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Text Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-500">Thoughts</label>
              <button 
                onClick={handleReflect}
                disabled={isReflecting || !content.trim()}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 disabled:opacity-40 transition-colors"
              >
                {isReflecting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                AI Reflect & Vision
              </button>
            </div>
            <textarea 
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? How was your day?"
              className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Photos Area */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-semibold text-slate-500">Personal Photos</label>
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
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
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
                      <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Result Area */}
          {(aiReflection || aiImage || isReflecting) && (
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 md:p-5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-tighter">AI Preview</span>
                {aiReflection && <button onClick={() => {setAiReflection(undefined); setAiImage(undefined)}} className="ml-auto text-slate-400 hover:text-slate-600"><X size={14} /></button>}
              </div>
              
              {isReflecting ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 bg-indigo-200/50 rounded w-3/4"></div>
                  <div className="h-3 bg-indigo-200/50 rounded w-1/2"></div>
                  <div className="h-32 bg-indigo-200/50 rounded-xl w-full"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiReflection && <p className="text-sm text-indigo-900 italic leading-relaxed">"{aiReflection}"</p>}
                  {aiImage && (
                    <img src={aiImage} alt="AI Vision" className="w-full h-auto rounded-xl shadow-sm border border-indigo-200/50 cursor-zoom-in" onClick={() => setZoomImage(aiImage)} />
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
            <Save size={18} /> {initialData ? 'Update Memory' : 'Post to Thread'}
          </button>
        </div>
      </div>

      {zoomImage && (
        <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-8" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95" />
        </div>
      )}
    </div>
  );
};

export default EntryModal;
