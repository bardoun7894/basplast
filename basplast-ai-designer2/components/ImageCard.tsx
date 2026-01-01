import React, { useState } from 'react';
import { ARABIC_LABELS } from '../constants';

interface ImageCardProps {
  src: string;
  index: number;
  onUseAsReference?: (src: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ src, index, onUseAsReference }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
    <div 
      className="relative group rounded-xl overflow-hidden shadow-lg aspect-[3/4] bg-gray-100"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <img src={src} alt="Generated Design" className="w-full h-full object-cover" />
      
      {/* Overlay Actions */}
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 ${showOverlay ? 'opacity-100' : 'opacity-0'}`}>
        
        {onUseAsReference && (
          <button 
            onClick={() => onUseAsReference(src)}
            className="bg-basplast-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-basplast-500 transform -translate-y-1 group-hover:translate-y-0 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {ARABIC_LABELS.useAsReference}
          </button>
        )}

        <div className="flex gap-2 mt-2">
          <button 
            onClick={handleDownload}
            className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm hover:bg-white/30 transition-colors"
          >
            {ARABIC_LABELS.download}
          </button>
          <button 
            onClick={handleCopy}
            className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm hover:bg-white/30 transition-colors"
          >
            {copied ? 'تم!' : ARABIC_LABELS.copy}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;