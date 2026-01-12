import React, { useEffect, useState } from 'react';
import { ARABIC_LABELS } from '../constants';
import { DesignRequest } from '../types';
import { fetchHistory, enhancePrompt } from '../services/kieService';

interface HistoryViewProps {
  history: DesignRequest[];
  onReuse?: (item: any) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history: localHistory, onReuse }) => {
  const [apiHistory, setApiHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'ads'>('products');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory();
      setApiHistory(data);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceForItem = async (item: any) => {
    setEnhancing(item.id);
    try {
      const enhanced = await enhancePrompt(item.prompt || 'تصميم ترمس فاخر');
      alert(`الوصف المحسّن:\n\n${enhanced}`);
    } catch (e) {
      console.error("Enhance failed:", e);
    } finally {
      setEnhancing(null);
    }
  };

  // Updated to accept specific image
  const handleReuseItem = (item: any, specificImage?: string) => {
    sessionStorage.setItem('reuseItem', JSON.stringify({
      prompt: item.prompt,
      refImage: specificImage || item.refImage,
      model: item.model
    }));
    window.location.href = '/';
  };

  // Updated to accept specific image
  const handleGenerateAd = (item: any, specificImage?: string) => {
    sessionStorage.setItem('reuseItem', JSON.stringify({
      prompt: item.prompt,
      refImage: specificImage || item.refImage,
      model: 'nano-banana-pro',
      type: 'ad_generation'
    }));
    // Navigate to Ad Studio route
    window.location.href = '/?view=ad-studio';
  };

  // Filter history based on active tab
  const displayedHistory = apiHistory.filter(item => {
    const isAd = item.model === 'nano-banana-pro' || item.prompt?.includes('Commercial Advertising');
    return activeTab === 'ads' ? isAd : !isAd;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{ARABIC_LABELS.historyTitle}</h2>
          <p className="text-sm text-gray-500 mt-1">تصفح أرشيف تصاميمك السابقة</p>
        </div>
        <button
          onClick={loadHistory}
          className="text-sm text-basplast-600 hover:underline flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          تحديث السجل
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'products'
              ? 'border-basplast-500 text-basplast-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
          تصاميم المنتجات (Product Designs)
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ads'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
          الإعلانات التجارية (Commercial Ads)
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-basplast-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayedHistory.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="w-16 h-16 mx-auto text-gray-300 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-gray-500 mt-4">لا توجد {activeTab === 'products' ? 'تصاميم منتجات' : 'إعلانات'} في السجل.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedHistory.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{ARABIC_LABELS.dateLabel}</span>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(item.createdAt).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-basplast-50 text-basplast-700 text-xs font-bold rounded-full">
                    {item.model || 'auto'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${item.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {item.status === 'success' ? '✓ نجح' : '✗ فشل'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex gap-4">
                  {/* Input Image */}
                  {item.refImage && (
                    <div className="w-32 flex-shrink-0 relative group">
                      <img src={item.refImage} className="w-full h-32 object-cover rounded-lg border-2 border-gray-200" alt="Input" />
                      <span className="text-xs text-gray-400 block text-center mt-1">المدخل</span>

                      {/* Overlay - ONLY show Ad Design button if currently in Products tab */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg">
                        <button onClick={() => handleReuseItem(item, item.refImage)} className="bg-white/20 hover:bg-white/40 text-white text-xs px-2 py-1 rounded">إعادة استخدام</button>
                        {activeTab === 'products' && (
                          <button onClick={() => handleGenerateAd(item, item.refImage)} className="bg-indigo-500/80 hover:bg-indigo-500 text-white text-xs px-2 py-1 rounded">تصميم إعلان</button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Output Images */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.prompt || 'بدون وصف'}</p>

                    {item.images && item.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {item.images.map((img: string, i: number) => (
                          <div key={i} className="relative group aspect-square">
                            <img
                              src={img}
                              className="w-full h-full object-cover rounded-lg border border-gray-100"
                              alt={`Output ${i + 1}`}
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg">
                              <button onClick={() => handleReuseItem(item, img)} className="bg-white/20 hover:bg-white/40 text-white text-xs px-2 py-1 rounded">إعادة استخدام</button>
                              {activeTab === 'products' && (
                                <button onClick={() => handleGenerateAd(item, img)} className="bg-indigo-500/80 hover:bg-indigo-500 text-white text-xs px-2 py-1 rounded">تصميم إعلان</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 justify-end flex-wrap">
                  <button
                    onClick={() => handleEnhanceForItem(item)}
                    disabled={enhancing === item.id}
                    className="px-4 py-2 text-sm font-bold text-basplast-600 bg-basplast-50 rounded-lg hover:bg-basplast-100 transition-colors disabled:opacity-50"
                  >
                    {enhancing === item.id ? 'جاري التحسين...' : '✨ تحسين الوصف'}
                  </button>

                  {activeTab === 'products' && (
                    <button
                      onClick={() => handleGenerateAd(item)}
                      className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                    >
                      📢 تصميم إعلان تجاري
                    </button>
                  )}

                  <button
                    onClick={() => handleReuseItem(item)}
                    className="px-4 py-2 text-sm font-bold text-white bg-basplast-600 rounded-lg hover:bg-basplast-700 transition-colors"
                  >
                    🔄 إعادة استخدام
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;