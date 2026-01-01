import React, { useState, useRef } from 'react';
import { ARABIC_LABELS, MOCK_COLORS } from '../constants';
import { ThermosLength, ThermosShape, DesignRequest } from '../types';
import Button from './Button';
import ImageCard from './ImageCard';
import { createKieTask, pollKieTask, enhancePrompt } from '../services/kieService';

// Utility for file to base64 (since we removed geminiService)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

interface GeneratorViewProps {
  onGenerateComplete: (req: DesignRequest) => void;
}

const GeneratorView: React.FC<GeneratorViewProps> = ({ onGenerateComplete }) => {
  const [prompt, setPrompt] = useState('');
  const [length, setLength] = useState<ThermosLength | ''>('');
  const [shape, setShape] = useState<ThermosShape | ''>('');
  const [color, setColor] = useState<string>('');

  const [activeRefBase64, setActiveRefBase64] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;

    setIsEnhancing(true);
    setStatusMessage('جاري تحليل الطلب وتحسينه...');
    setError(null);
    try {
      const enhanced = await enhancePrompt(prompt, { length: length || '', shape: shape || '' });
      setPrompt(enhanced);
    } catch (err) {
      console.error(err);
      setError("تعذر تحسين النص حالياً.");
    } finally {
      setIsEnhancing(false);
      setStatusMessage('');
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !activeRefBase64) {
      setError("الرجاء إدخال وصف للتصميم أو رفع صورة مرجعية");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setStatusMessage('بدء المهمة في KIE.ai...');

    try {
      // 1. Create Task
      const taskId = await createKieTask(
        prompt,
        { length: length || '', shape: shape || '', color },
        activeRefBase64 || undefined
      );

      setStatusMessage('جاري توليد التصاميم (KIE.ai)... يرجى الانتظار');

      // 2. Poll Task
      const images = await pollKieTask(taskId);

      setGeneratedImages(images);

      // Save to history
      const newRequest: DesignRequest = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        prompt,
        attributes: { length, shape, color },
        referenceImage: activeRefBase64 || undefined,
        generatedImages: images
      };
      onGenerateComplete(newRequest);

    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ أثناء التوليد. يرجى التأكد من مفتاح KIE API.");
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const b64 = await fileToBase64(e.target.files[0]);
      setActiveRefBase64(b64);
    }
  };

  const handleUseAsReference = (src: string) => {
    const b64 = src.split(',')[1];
    setActiveRefBase64(b64);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearReference = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveRefBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Premium Header/Prompt Area */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-basplast-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl group-hover:bg-basplast-100 transition-colors" />

        <div className="relative z-10 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{ARABIC_LABELS.appSubtitle}</h1>
              <p className="text-gray-500 mt-2">صمم منتجك الفاخر باستخدام تقنيات KIE.ai المتطورة</p>
            </div>
            <div className="flex items-center gap-2 bg-basplast-50 px-4 py-2 rounded-2xl border border-basplast-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-basplast-700 uppercase tracking-widest">KIE.ai High Precision</span>
            </div>
          </div>

          {/* Large Prompt Window */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-gray-700 mr-2">{ARABIC_LABELS.promptLabel}</label>
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || !prompt.trim()}
                className="text-sm font-bold text-basplast-600 hover:text-basplast-700 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
              >
                {isEnhancing ? 'جاري التحسين...' : 'تحسين الوصف بلمسة إبداعية ✨'}
              </button>
            </div>
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={ARABIC_LABELS.promptPlaceholder}
                className="w-full text-xl sm:text-2xl font-medium rounded-2xl border-2 border-gray-100 focus:border-basplast-400 focus:ring-4 focus:ring-basplast-100 min-h-[160px] p-6 text-right transition-all bg-gray-50/30 hover:bg-white resize-none"
              />
              <div className="absolute bottom-4 left-6 text-xs text-gray-400 font-mono">
                {prompt.length} CHARS
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Upload Ref */}
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-3 mr-2">مرجع بصري</label>
              <div
                className={`h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${activeRefBase64 ? 'border-basplast-500 bg-basplast-50' : 'border-gray-200 hover:border-basplast-300 bg-gray-50/50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                {activeRefBase64 ? (
                  <div className="relative w-full h-full p-2">
                    <img src={`data:image/jpeg;base64,${activeRefBase64}`} className="w-full h-full object-contain rounded-xl" />
                    <button onClick={clearReference} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-xs font-bold text-gray-400 mt-2 block">رفع صورة</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attributes Group */}
            <div className="md:col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <label className="text-xs font-bold text-gray-400 uppercase mr-2">{ARABIC_LABELS.shapeLabel}</label>
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value as ThermosShape)}
                  className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-bold px-4 transition-colors"
                >
                  <option value="">تلقائي</option>
                  {Object.values(ThermosShape).map((s) => (
                    <option key={s} value={s}>{ARABIC_LABELS.shapes[s]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 text-right">
                <label className="text-xs font-bold text-gray-400 uppercase mr-2">{ARABIC_LABELS.lengthLabel}</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as ThermosLength)}
                  className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-bold px-4 transition-colors"
                >
                  <option value="">تلقائي</option>
                  {Object.values(ThermosLength).map((l) => (
                    <option key={l} value={l}>{ARABIC_LABELS.lengths[l]}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 space-y-2 text-right">
                <label className="text-xs font-bold text-gray-400 uppercase mr-2">{ARABIC_LABELS.colorLabel}</label>
                <div className="flex flex-wrap gap-3">
                  {MOCK_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.name)}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${color === c.name ? 'border-basplast-500 scale-125 shadow-lg' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex flex-col justify-end">
              <Button
                onClick={handleGenerate}
                isLoading={isGenerating}
                className="w-full h-16 text-xl rounded-2xl shadow-lg shadow-basplast-500/20 bg-gradient-to-r from-basplast-700 to-basplast-500 hover:from-basplast-800 hover:to-basplast-600 transition-all active:scale-95"
              >
                {isGenerating ? 'جاري التوليد...' : ARABIC_LABELS.generateBtn}
              </Button>
            </div>
          </div>

          {statusMessage && (
            <div className="bg-basplast-50 border border-basplast-100 p-4 rounded-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-basplast-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-basplast-700">{statusMessage}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">{ARABIC_LABELS.resultsTitle}</h2>
          {generatedImages.length > 0 && <span className="text-sm text-gray-400">{generatedImages.length} صور مولدة</span>}
        </div>

        {generatedImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {generatedImages.map((src, idx) => (
              <ImageCard
                key={idx}
                src={src}
                index={idx}
                onUseAsReference={handleUseAsReference}
              />
            ))}
          </div>
        ) : (
          <div className="h-96 rounded-3xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 bg-white/50">
            <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-xl font-bold">{isGenerating ? 'الفن يتطلب وقتاً...' : 'أدخل وصفك الإبداعي للأطلالة الأولى'}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default GeneratorView;