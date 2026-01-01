import React from 'react';
import { ARABIC_LABELS } from '../constants';
import { DesignRequest } from '../types';

interface HistoryViewProps {
  history: DesignRequest[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ history }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{ARABIC_LABELS.historyTitle}</h2>
      
      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500">{ARABIC_LABELS.noHistory}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.slice().reverse().map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{ARABIC_LABELS.dateLabel}</span>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(item.timestamp).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {/* Visual indicator of prompt content */}
                <div className="text-sm text-gray-500 truncate max-w-md hidden sm:block">
                  {item.prompt}
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-4 gap-4">
                  {item.generatedImages.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group">
                      <img src={img} alt={`History ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.attributes.shape && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {ARABIC_LABELS.shapes[item.attributes.shape as keyof typeof ARABIC_LABELS.shapes]}
                    </span>
                  )}
                  {item.attributes.length && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                      {ARABIC_LABELS.lengths[item.attributes.length as keyof typeof ARABIC_LABELS.lengths]}
                    </span>
                  )}
                  {item.attributes.color && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">
                      {item.attributes.color}
                    </span>
                  )}
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