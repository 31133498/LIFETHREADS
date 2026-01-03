
import React, { useState } from 'react';
import { DiaryEntry } from '../types';
import { Calendar, Trash2, Edit3, Sparkles, X, Maximize2 } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface TimelineEntryProps {
  entry: DiaryEntry;
  isLast: boolean;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryEntry) => void;
  onReflect: (id: string) => void;
  isReflecting: boolean;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({ 
  entry, 
  isLast, 
  onDelete, 
  onEdit, 
  onReflect,
  isReflecting 
}) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Defensive helper for date formatting to prevent app crashes on corrupted data
  const safeFormat = (dateStr: string, formatStr: string) => {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, formatStr) : "Date Unknown";
  };

  const renderImageGrid = () => {
    if (!entry.images || entry.images.length === 0) return null;

    const count = entry.images.length;

    if (count === 1) {
      return (
        <div className="relative group overflow-hidden rounded-2xl border border-slate-100">
          <img 
            src={entry.images[0]} 
            alt="Memory" 
            className="w-full max-h-[500px] object-cover cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-500" 
            onClick={() => setActiveImage(entry.images[0])}
          />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
          {entry.images.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              className="w-full aspect-[4/5] object-cover cursor-zoom-in hover:brightness-95 transition-all" 
              onClick={() => setActiveImage(img)}
            />
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 h-[400px] overflow-hidden rounded-2xl">
          <img 
            src={entry.images[0]} 
            className="w-full h-full object-cover cursor-zoom-in hover:brightness-95 transition-all" 
            onClick={() => setActiveImage(entry.images[0])}
          />
          <div className="grid grid-rows-2 gap-2 h-full">
            <img 
              src={entry.images[1]} 
              className="w-full h-full object-cover cursor-zoom-in hover:brightness-95 transition-all" 
              onClick={() => setActiveImage(entry.images[1])}
            />
            <img 
              src={entry.images[2]} 
              className="w-full h-full object-cover cursor-zoom-in hover:brightness-95 transition-all" 
              onClick={() => setActiveImage(entry.images[2])}
            />
          </div>
        </div>
      );
    }

    // 4 or more
    return (
      <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
        {entry.images.slice(0, 4).map((img, idx) => (
          <div key={idx} className="relative group overflow-hidden h-[200px]">
            <img 
              src={img} 
              className="w-full h-full object-cover cursor-zoom-in hover:brightness-95 transition-all" 
              onClick={() => setActiveImage(img)}
            />
            {idx === 3 && count > 4 && (
              <div 
                className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                onClick={() => setActiveImage(img)}
              >
                <span className="text-white text-xl font-bold">+{count - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex group">
      {/* Thread Line Decorator */}
      <div className="flex flex-col items-center mr-4 md:mr-6">
        <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110">
          <Calendar size={18} className="text-indigo-600" />
        </div>
        {!isLast && <div className="w-0.5 flex-grow bg-slate-200 mt-2 mb-2 rounded-full"></div>}
      </div>

      {/* Content Card */}
      <div className="flex-grow pb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
                {safeFormat(entry.date, 'EEEE, MMMM do, yyyy')}
              </p>
              <h3 className="text-xl font-semibold text-slate-800">
                {safeFormat(entry.date, 'HH:mm')}
              </h3>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onReflect(entry.id)}
                disabled={isReflecting}
                className={`p-2 rounded-lg transition-all ${isReflecting ? 'bg-indigo-100 text-indigo-600' : 'text-indigo-500 hover:bg-indigo-50'}`}
                title="AI Reflection & Vision"
              >
                <Sparkles size={18} className={isReflecting ? "animate-spin" : ""} />
              </button>
              <button 
                onClick={() => onEdit(entry)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Edit3 size={18} />
              </button>
              <button 
                onClick={() => onDelete(entry.id)}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="prose prose-slate max-w-none mb-4">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </p>
          </div>

          <div className="mb-4">
            {renderImageGrid()}
          </div>

          {(entry.aiReflection || entry.aiImage || isReflecting) && (
            <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 md:p-6 overflow-hidden relative">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-tighter">AI Visual Reflection</span>
              </div>
              
              {isReflecting ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-indigo-200/50 rounded w-3/4"></div>
                  <div className="h-4 bg-indigo-200/50 rounded w-1/2"></div>
                  <div className="h-40 bg-indigo-200/50 rounded-xl w-full"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {entry.aiReflection && (
                    <p className="text-sm md:text-base text-indigo-900 italic leading-relaxed">
                      "{entry.aiReflection}"
                    </p>
                  )}
                  {entry.aiImage && (
                    <div className="relative group overflow-hidden rounded-xl shadow-inner border border-indigo-200/50">
                      <img 
                        src={entry.aiImage} 
                        alt="AI Generated Vision" 
                        className="w-full h-auto object-cover cursor-zoom-in hover:scale-105 transition-transform duration-700"
                        onClick={() => setActiveImage(entry.aiImage!)}
                      />
                      <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold">
                        AI VISION
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Overlay */}
      {activeImage && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveImage(null)}
        >
          <button className="absolute top-6 right-6 p-4 text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={28} />
          </button>
          <img 
            src={activeImage} 
            alt="Enlarged moment" 
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default TimelineEntry;
