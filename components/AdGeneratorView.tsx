import React, { useState, useEffect } from 'react';
import { ARABIC_LABELS } from '../constants';
import Button from './Button';
import { createGenerationTask } from '../services/kieService';
import { DesignRequest } from '../types';

interface AdGeneratorViewProps {
    onGenerateComplete: (req: DesignRequest) => void;
    onBack: () => void;
}

const AdGeneratorView: React.FC<AdGeneratorViewProps> = ({ onGenerateComplete, onBack }) => {
    const [productName, setProductName] = useState('');
    const [productSlug, setProductSlug] = useState('');
    const [designCode, setDesignCode] = useState('');
    const [customInstructions, setCustomInstructions] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('RANDOM');
    const [activeRefBase64, setActiveRefBase64] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Luxury Arabic-inspired product names (4-8 chars, Latin letters)
    const LUXURY_NAMES = ['Misk', 'Rawda', 'Najma', 'Sultan', 'Noora', 'Ghala', 'Lulu', 'Sama', 'Kanz', 'Reem', 'Dana', 'Layla', 'Farah', 'Zara', 'Amal', 'Nada', 'Hala', 'Maya', 'Sara', 'Yara'];

    // Generate new product identity (name, slug, design code)
    const generateProductIdentity = () => {
        const name = LUXURY_NAMES[Math.floor(Math.random() * LUXURY_NAMES.length)];
        const digits = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
        const slug = `${name.toLowerCase()}-${digits}`;
        const code = `BP-${name.substring(0, 4).toUpperCase()}-${digits}`;
        setProductName(name);
        setProductSlug(slug);
        setDesignCode(code);
    };

    useEffect(() => {
        // Auto-generate product identity on mount
        generateProductIdentity();

        const stored = sessionStorage.getItem('reuseItem');
        if (stored) {
            try {
                const item = JSON.parse(stored);
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
                        setActiveRefBase64(item.refImage);
                    }
                }
                sessionStorage.removeItem('reuseItem');
            } catch (e) {
                console.error("Failed to parse reuse item", e);
            }
        }
    }, []);

    const handleGenerate = async () => {
        if (!activeRefBase64) {
            setError("صورة المنتج مطلوبة");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Upload image first (re-using service logic roughly, but we need url)
            // For Ad Studio, we might assume image is already uploaded or we re-upload.
            // Let's use the standard service flow.

            // Convert base64 to File for upload (we need a utility for this really, or duplicate logic)
            const res = await fetch(`data:image/jpeg;base64,${activeRefBase64}`);
            const blob = await res.blob();
            const file = new File([blob], "input.jpg", { type: "image/jpeg" });

            // We need to import uploadImage but I didn't import it yet. 
            // I will fix imports in the next step or assume kieService has it.
            // ... well I need to fetch the URL first. 

            // Actually, let's look at GeneratorView. It imports uploadImage.
            // Let's assume we import uploadImage from services.

            const { uploadImage } = await import('../services/kieService');
            const uploadedUrl = await uploadImage(file);

            // Theme Logic
            let themePrompt = "";
            const THEMES: Record<string, string> = {
                'RAMADAN': "Ramadan night atmosphere, lanterns, crescent moon, warm lighting, dates plate",
                'SAUDI_DESERT': "Golden Saudi desert dunes background, sunset lighting, traditional tent vibes",
                'SAUDI_NATURE': "Saudi Arabia southern mountains nature, green terrace farming, misty atmosphere",
                'LUXURY_INDOOR': "Luxury Saudi Majlis interior, marble table, golden accessories, expensive furniture",
                'COFFEE_TABLE': "Traditional Saudi coffee setting, finjal cups, dates, authentic hospitality vibe",
                'MODERN_MINIMAL': "Clean minimal studio background, soft shadows, pastel colors, high-end product photography"
            };

            let currentThemeKey = selectedTheme;
            if (currentThemeKey === 'RANDOM') {
                const keys = Object.keys(THEMES);
                currentThemeKey = keys[Math.floor(Math.random() * keys.length)];
            }
            themePrompt = THEMES[currentThemeKey];

            // Context for Commercial Ad with explicit logo instructions
            // Context for Commercial Ad with explicit logo instructions
            const rawPrompt = `Commercial Advertisement, ${themePrompt}. ${productName}. ${customInstructions}`;

            // Enhance with DeepSeek (Ad Mode)
            const { enhancePrompt } = await import('../services/kieService');
            // We pass the raw prompt to be "professionalized"
            // The system prompt handles the lighting/atmosphere expansion.
            let enhancedDescription = rawPrompt;
            try {
                enhancedDescription = await enhancePrompt(rawPrompt, {}, 'ad');
            } catch (e) {
                console.warn("Prompt enhancement failed, using raw prompt", e);
            }

            const adContext = `${enhancedDescription}
BRADING: The brand is "Bas Atelier". Use an elegant serif italic font.
INTEGRATION: The branding and product name should be seamlessly integrated into the design (engraved on the product or as a premium typographic element).
QUALITY: High-quality 3D render, photorealistic lighting, 8k resolution, cinematic atmosphere.`;

            const result = await createGenerationTask(
                adContext,
                {
                    refImage: uploadedUrl,
                    model: 'nano-banana-pro',
                    // Special flag for backend to inject logo
                    isAdMode: "true"
                },
                {
                    count: 1,
                    mode: 'single'
                }
            );

            if (result.images && result.images.length > 0) {
                setGeneratedImage(result.images[0]);
            }

        } catch (err: any) {
            setError(err.message || "فشل إنشاء الإعلان");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEnhanceText = async (currentText: string, field: 'name' | 'instructions') => {
        if (!currentText) return;
        setIsGenerating(true); // Re-use generating state or add local loose loading state
        try {
            const { enhancePrompt } = await import('../services/kieService');
            // Use 'product' type for improvement, or a new 'enhance_snippet' type if we supported it
            // For now 'product' is enough to generic enhance
            const improvedText = await enhancePrompt(currentText, {}, 'product');

            if (field === 'name') setProductName(improvedText.replace(/"/g, '')); // Remove quotes if any
            if (field === 'instructions') setCustomInstructions(improvedText);
        } catch (e) {
            console.error("Enhancement failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">

            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                العودة
            </button>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-purple-600 to-indigo-600" />

                <div className="p-8 sm:p-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">استوديو الإعلانات التجارية</h1>
                            <p className="text-gray-500 mt-2">حوّل صورة منتجك إلى إعلان احترافي بنقرة واحدة</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center text-2xl">
                            📢
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Left: Input */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">المنتج المختار</label>
                                {activeRefBase64 ? (
                                    <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-100 aspect-square group">
                                        <img src={`data:image/jpeg;base64,${activeRefBase64}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white font-bold">صورة المنتج</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full aspect-square bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-400">
                                        لا توجد صورة
                                    </div>
                                )}
                            </div>


                            {/* Theme Selector */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">المناسبة / الخلفية</label>
                                <select
                                    value={selectedTheme}
                                    onChange={(e) => setSelectedTheme(e.target.value)}
                                    className="w-full h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all px-4"
                                >
                                    <option value="RANDOM">🎲 اختيار عشوائي (تلقائي)</option>
                                    <option value="RAMADAN">🌙 ليالي رمضان (Ramadan Nights)</option>
                                    <option value="SAUDI_DESERT">🐪 صحراء المملكة (Saudi Desert)</option>
                                    <option value="SAUDI_NATURE">🌴 طبيعة جنوبية (Southern Nature)</option>
                                    <option value="LUXURY_INDOOR">🏛️ مجلس فاخر (Luxury Majlis)</option>
                                    <option value="COFFEE_TABLE">☕ جلسة قهوة (Coffee Setting)</option>
                                    <option value="MODERN_MINIMAL">✨ مودرن مينيمال (Modern Studio)</option>
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-700">اسم المنتج / سطر إعلاني</label>
                                    <button
                                        onClick={() => generateProductIdentity()}
                                        disabled={isGenerating}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50"
                                    >
                                        ✨ توليد اسم جديد
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="اتركه فارغاً للتوليد التلقائي"
                                    className="w-full h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all px-4 font-bold text-lg"
                                />
                                {productSlug && designCode && (
                                    <div className="flex gap-4 mt-2 text-xs">
                                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-mono">{productSlug}</span>
                                        <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-mono">{designCode}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-700">تعليمات إضافية / نص مخصص</label>
                                    <button
                                        onClick={() => handleEnhanceText(customInstructions, 'instructions')}
                                        disabled={!customInstructions || isGenerating}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50"
                                    >
                                        ✨ تحسين النص
                                    </button>
                                </div>
                                <textarea
                                    value={customInstructions}
                                    onChange={(e) => setCustomInstructions(e.target.value)}
                                    placeholder="أضف تفاصيل إضافية للتصميم (مثلاً: أضف عبارة رمضان كريم، اجعل الخلفية أكثر سطوعاً...)"
                                    className="w-full h-24 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all px-4 py-3 resize-none"
                                />
                            </div>

                            <Button
                                onClick={handleGenerate}
                                isLoading={isGenerating}
                                disabled={!activeRefBase64}
                                className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20"
                            >
                                {isGenerating ? 'جاري التصميم...' : 'إنشاء الإعلان الآن ✨'}
                            </Button>

                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>

                        {/* Right: Output Preview */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col h-full">
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">المعاينة الحية</h3>
                            <div className="flex-1 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-white overflow-hidden relative group">
                                {generatedImage ? (
                                    <>
                                        <img src={generatedImage} className="w-full h-full object-contain" />
                                        {/* Download Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <a
                                                href={generatedImage}
                                                download={`bas-atelier-ad-${Date.now()}.png`}
                                                className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-lg"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                تحميل الصورة
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-gray-300">
                                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p>ستظهر النتيجة هنا</p>
                                    </div>
                                )}

                                {/* PLACEHOLDERS REMOVED - User requested clean preview without overlay placeholders */}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdGeneratorView;
