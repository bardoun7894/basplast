import React, { useState, useRef, useEffect } from 'react';
import { ARABIC_LABELS, MOCK_COLORS } from '../constants';
import { ThermosLength, ThermosShape, HeadHandleDecoration, DesignRequest, GeneratedItem } from '../types';
import Button from './Button';
import ImageCard from './ImageCard';
import { uploadImage, createGenerationTask, enhancePrompt } from '../services/kieService';

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
  const [decoration, setDecoration] = useState<HeadHandleDecoration | ''>('');
  const [color, setColor] = useState<string>('');
  const [model, setModel] = useState<string>('seedream/4.5-edit');
  const [count, setCount] = useState(1);

  const [activeRefBase64, setActiveRefBase64] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // State for Results
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterModel, setFilterModel] = useState<string>('ALL');

  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setStatusMessage('جاري تحسين الوصف بواسطة DeepSeek...');
    setError(null);
    try {
      const enhanced = await enhancePrompt(prompt, { color, shape, length, decoration });
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
    // Validate: image is REQUIRED now
    if (!activeRefBase64) {
      setError("⚠️ صورة مرجعية مطلوبة. جميع النماذج تعمل بنظام صورة إلى صورة.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setStatusMessage('جاري رفع الصورة...');

    try {
      // Upload image first
      const res = await fetch(`data:image/jpeg;base64,${activeRefBase64}`);
      const blob = await res.blob();
      const file = new File([blob], "input.jpg", { type: "image/jpeg" });
      const uploadedUrl = await uploadImage(file);

      setStatusMessage('جاري التوليد...');

      // Use prompt as-is (no auto-enhance - user must click enhance button)
      const finalPrompt = prompt || 'تصميم ترمس فاخر';

      const result = await createGenerationTask(
        finalPrompt,
        {
          length: length || '',
          shape: shape || '',
          decoration: decoration || '',
          color,
          model: model === 'MULTI' ? undefined : model,
          refImage: uploadedUrl
        },
        {
          count: count,
          mode: model === 'MULTI' ? 'multi-model' : 'single'
        }
      );

      // Create GeneratedItems
      const newItems: GeneratedItem[] = result.images.map(imgUrl => ({
        id: Math.random().toString(36).substr(2, 9),
        url: imgUrl,
        batchId: result.id,
        model: model === 'MULTI' ? 'Multi-Model' : (model || 'Auto'),
        timestamp: Date.now(),
        prompt: prompt || 'تصميم ترمس فاخر'
      }));

      // Append new items
      setGeneratedItems(prev => [...newItems, ...prev]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء التوليد.");
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const b64 = await fileToBase64(e.target.files[0]);
      setActiveRefBase64(b64);
      setError(null);
    }
  };

  const handleUseAsReference = async (src: string) => {
    // If it's a URL, fetch and convert to base64 (use proxy for CORS)
    if (src.startsWith('http')) {
      try {
        setStatusMessage('جاري تحميل الصورة...');
        const { fetchRemoteImage } = await import('../services/kieService');
        const blob = await fetchRemoteImage(src);
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          setActiveRefBase64(base64Data);
          setStatusMessage('');
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to load image:", err);
        setError("تعذر تحميل الصورة. حاول مرة أخرى.");
        setStatusMessage('');
      }
    } else {
      const b64 = src.split(',')[1];
      setActiveRefBase64(b64);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hydrate from reuse/ad action
  useEffect(() => {
    const stored = sessionStorage.getItem('reuseItem');
    if (stored) {
      try {
        const item = JSON.parse(stored);
        setPrompt(item.prompt);
        setModel(item.model || '');

        // If it's an ad generation, switch to Nano Pro and prepend context
        if (item.type === 'ad_generation') {
          setModel('nano-banana-pro');
          const adContext = `Commercial Advertisement, premium scene with traditional elements. Brand: Bas Atelier (Elegant Serif Italic). Product: ${item.prompt}. Integration: Logo engraved or premium typography.`;
          setPrompt(adContext);
        }

        // Handle image reuse
        if (item.refImage) {
          if (item.refImage.startsWith('http')) {
            import('../services/kieService').then(({ fetchRemoteImage }) => {
              fetchRemoteImage(item.refImage)
                .then(blob => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    const base64Data = result.split(',')[1];
                    setActiveRefBase64(base64Data);
                  };
                  reader.readAsDataURL(blob);
                })
                .catch(e => console.error("Failed to fetch remote image for reuse", e));
            });
          } else {
            // If already base64 (unlikely from API but possible)
            setActiveRefBase64(item.refImage);
          }
        }

        sessionStorage.removeItem('reuseItem');
      } catch (e) {
        console.error("Failed to parse reuse item", e);
      }
    }
  }, []);

  const clearReference = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveRefBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteItem = (id: string) => {
    setGeneratedItems(prev => prev.filter(item => item.id !== id));
  };

  const truncatePrompt = (txt: string, len: number = 30) => {
    if (txt.length <= len) return txt;
    return txt.substring(0, len) + '...';
  };

  const filteredItems = generatedItems.filter(item => {
    if (filterModel === 'ALL') return true;
    return item.model === filterModel;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Premium Header/Prompt Area */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-basplast-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl group-hover:bg-basplast-100 transition-colors" />

        <div className="relative z-10 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{ARABIC_LABELS.appSubtitle}</h1>
              <p className="text-gray-500 mt-2">جميع النماذج تعمل بنظام <strong>صورة إلى صورة</strong></p>
            </div>

          </div>

          {/* Upload Ref - REQUIRED */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 mr-2">
              📸 {ARABIC_LABELS.uploadLabel} <span className="text-red-500">*</span>
            </label>
            <div
              className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${activeRefBase64 ? 'border-basplast-500 bg-basplast-50' : 'border-gray-300 hover:border-basplast-300 bg-gray-50/50'}`}
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
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-bold text-gray-500 mt-2 block">اختر صورة مرجعية للتصميم</span>
                  <span className="text-xs text-gray-400">PNG, JPG, WEBP</span>
                </div>
              )}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-gray-700 mr-2">{ARABIC_LABELS.promptLabel}</label>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleEnhance}
                  disabled={isEnhancing || !prompt.trim()}
                  className="text-sm font-bold text-basplast-600 hover:text-basplast-700 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {isEnhancing ? 'جاري التحسين...' : ARABIC_LABELS.enhanceBtn}
                </button>
                <span className="text-xs text-orange-500">⚠️ التحسين سيغير شكل المنتج بالكامل</span>
              </div>
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

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Count */}
            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-gray-400 uppercase mr-2">عدد الصور</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-bold px-4 transition-colors"
              >
                {[1, 2, 4].map(n => (
                  <option key={n} value={n}>{n} صور</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-gray-400 uppercase mr-2">{ARABIC_LABELS.modelLabel}</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-bold px-4 transition-colors"
              >
                {Object.entries(ARABIC_LABELS.models).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Length */}
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

            {/* Shape */}
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

            {/* Decoration - Head & Handle */}
            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-gray-400 uppercase mr-2">{ARABIC_LABELS.decorationLabel}</label>
              <select
                value={decoration}
                onChange={(e) => setDecoration(e.target.value as HeadHandleDecoration)}
                className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-bold px-4 transition-colors"
              >
                <option value="">تلقائي</option>
                {Object.values(HeadHandleDecoration).map((d) => (
                  <option key={d} value={d}>{ARABIC_LABELS.decorations[d]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-2 text-right">
            <label className="text-xs font-bold text-gray-400 uppercase mr-2">{ARABIC_LABELS.colorLabel}</label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-3">
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

              <div className="h-8 w-px bg-gray-200 mx-2" />

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">لون مخصص:</label>
                <div className="relative group">
                  <input
                    type="color"
                    value={color.startsWith('#') ? color : '#000000'}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-full border-2 border-transparent cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <div className={`absolute inset-0 rounded-full pointer-events-none border-2 ${color.startsWith('#') ? 'border-basplast-500 scale-110' : 'border-gray-200'}`} />
                </div>
              </div>

              {color && (
                <span className="text-xs font-bold text-basplast-600 bg-basplast-50 px-2 py-1 rounded-md">
                  المختار: {color}
                </span>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex flex-col justify-end">
            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={!activeRefBase64}
              className="w-full h-16 text-xl rounded-2xl shadow-lg shadow-basplast-500/20 bg-gradient-to-r from-basplast-700 to-basplast-500 hover:from-basplast-800 hover:to-basplast-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!activeRefBase64 ? '⚠️ قم برفع صورة أولاً' : (isGenerating ? 'جاري التوليد...' : ARABIC_LABELS.generateBtn)}
            </Button>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{ARABIC_LABELS.resultsTitle}</h2>
            {generatedItems.length > 0 && <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{generatedItems.length}</span>}
          </div>

          {/* Toolbar */}
          {generatedItems.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Model Filter */}
              <select
                value={filterModel}
                onChange={e => setFilterModel(e.target.value)}
                className="h-10 rounded-xl border-gray-200 bg-gray-50 text-sm font-medium px-3 focus:ring-0 focus:border-basplast-300"
              >
                <option value="ALL">الكل</option>
                {Object.entries(ARABIC_LABELS.models).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-basplast-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow text-basplast-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>

              {/* Clear All */}
              <button
                onClick={() => setGeneratedItems([])}
                className="text-red-400 hover:text-red-600 text-sm font-medium hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
              >
                مسح الكل
              </button>
            </div>
          )}
        </div>

        {filteredItems.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" : "flex flex-col gap-4"}>
            {filteredItems.map((item, idx) => (
              <ImageCard
                key={item.id}
                src={item.url}
                index={idx}
                onUseAsReference={handleUseAsReference}
                onDelete={() => handleDeleteItem(item.id)}
                viewMode={viewMode}
                details={{
                  model: ARABIC_LABELS.models[item.model as keyof typeof ARABIC_LABELS.models] || item.model,
                  prompt: item.prompt,
                  date: new Date(item.timestamp).toLocaleTimeString()
                }}
              />
            ))}
          </div>
        ) : (
          <div className="h-96 rounded-3xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 bg-white/50">
            <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-xl font-bold">{isGenerating ? 'الفن يتطلب وقتاً...' : 'ارفع صورة واضغط توليد'}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default GeneratorView;