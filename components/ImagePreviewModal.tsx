import React, { useEffect } from 'react';
import { ARABIC_LABELS } from '../constants';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    src: string;
    onDownload: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, src, onDownload }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
                onClick={e => e.stopPropagation()}
            >
                {/* Actions Bar */}
                <div className="absolute top-4 right-4 flex gap-3 z-10">
                    <button
                        onClick={onDownload}
                        className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                        title={ARABIC_LABELS.download}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Image Container */}
                <div className="w-full h-full flex items-center justify-center">
                    <img
                        src={src}
                        alt="Preview"
                        className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
                    />
                </div>
            </div>
        </div>
    );
};

export default ImagePreviewModal;
