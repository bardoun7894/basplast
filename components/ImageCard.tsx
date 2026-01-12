import React, { useState } from 'react';
import { ARABIC_LABELS } from '../constants';
import ImagePreviewModal from './ImagePreviewModal';

interface ImageCardProps {
  src: string;
  index: number;
  onUseAsReference?: (src: string) => void;
  onDelete?: () => void;
  viewMode?: 'grid' | 'list';
  details?: {
    model: string;
    prompt: string;
    date: string;
  };
}

const ImageCard: React.FC<ImageCardProps> = ({ src, index, onUseAsReference, onDelete, viewMode = 'grid', details }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `basplast-design-${Date.now()}-${index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (viewMode === 'list' && details) {
    return (
      <>
        <div className="flex bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="w-48 h-48 relative group flex-shrink-0 cursor-pointer" onClick={() => setShowPreview(true)}>
            <img src={src} alt="Generated Design" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="bg-white/20 p-2 rounded-lg text-white hover:bg-white/30"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
              <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="bg-white/20 p-2 rounded-lg text-white hover:bg-white/30"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold bg-basplast-50 text-basplast-600 px-2 py-1 rounded-md">{details.model}</span>
                <button onClick={onDelete} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <p className="text-gray-600 text-right line-clamp-3 text-sm leading-relaxed">{details.prompt}</p>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-50 mt-4">
              {onUseAsReference && (
                <button
                  onClick={() => onUseAsReference(src)}
                  className="text-sm font-bold text-basplast-600 hover:text-basplast-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {ARABIC_LABELS.useAsReference}
                </button>
              )}
            </div>
          </div>
        </div>

        <ImagePreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          src={src}
          onDownload={handleDownload}
        />
      </>
    );
  }

  return (
    <>
      <div
        className="relative group rounded-xl overflow-hidden shadow-lg aspect-[3/4] bg-gray-100 cursor-pointer"
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
        onClick={() => setShowPreview(true)}
      >
        <img src={src} alt="Generated Design" className="w-full h-full object-cover" />

        {/* Overlay Actions */}
        <div className={`absolute inset-0 bg-black/60 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 ${showOverlay ? 'opacity-100' : 'opacity-0'}`}>

          {onUseAsReference && (
            <button
              onClick={(e) => { e.stopPropagation(); onUseAsReference(src); }}
              className="bg-basplast-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-basplast-500 transform -translate-y-1 group-hover:translate-y-0 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {ARABIC_LABELS.useAsReference}
            </button>
          )}

          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              title={ARABIC_LABELS.download}
              className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}
              title="حذف"
              className="bg-red-500/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      <ImagePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        src={src}
        onDownload={handleDownload}
      />
    </>
  );
};

export default ImageCard;