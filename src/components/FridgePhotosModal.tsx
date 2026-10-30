import React, { useState, useEffect } from 'react';
import { X, Plus, Camera } from 'lucide-react';
import { EventCategory } from '../types/calendar';
import { CATEGORY_CONFIG } from '../utils/calendarUtils';

interface FridgePhoto {
  id: string;
  url: string;
  caption: string;
  category: EventCategory;
  date: string;
  rotation: string;
}

const DEFAULT_FRIDGE_PHOTOS: FridgePhoto[] = [];

interface FridgePhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
}

export const FridgePhotosModal: React.FC<FridgePhotosModalProps> = ({
  isOpen,
  onClose,
  dateStr,
}) => {
  const [photos, setPhotos] = useState<FridgePhoto[]>(() => {
    try {
      const saved = localStorage.getItem('hub_fridge_photos');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_FRIDGE_PHOTOS;
  });
  const [caption, setCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('market');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('hub_fridge_photos', JSON.stringify(photos));
    } catch (e) {}
  }, [photos]);

  if (!isOpen) return null;

  const categoryKeys: EventCategory[] = ['market', 'dinner_date', 'maintenance', 'pets', 'grocery_errand', 'other'];

  const samplePhotoUrls: Record<EventCategory, string> = {
    market: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    dinner_date: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80',
    maintenance: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80',
    pets: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
    packing: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
    grocery_errand: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
    other: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80',
  };

  const handleAddPhoto = () => {
    const meta = CATEGORY_CONFIG[selectedCategory];
    const newP: FridgePhoto = {
      id: `p-${Date.now()}`,
      url: samplePhotoUrls[selectedCategory],
      caption: caption || `${meta.shortLabel} Snapshot`,
      category: selectedCategory,
      date: dateStr,
      rotation: Math.random() > 0.5 ? 'rotate-2' : '-rotate-2'
    };
    setPhotos([newP, ...photos]);
    setCaption('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#2d3139] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors">
        
        {/* Header styled like kitchen fridge notice board */}
        <div className="px-5 py-3.5 border-b border-[#e4ded5] dark:border-[#2d3139] bg-[#f5f1e8] dark:bg-[#202329] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-xs flex items-center justify-center text-white text-[9px] font-bold">
              •
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Fridge Door & Mementos
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Booth display setups, date night polaroids, and repair receipts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-[#292d36] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-2.5 bg-white dark:bg-[#1f2228] border-b border-[#e4ded5] dark:border-[#2d3139] flex items-center justify-between">
          <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">
            {photos.length} photos pinned to couple memory board
          </span>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pin Photo</span>
          </button>
        </div>

        {/* Pin Photo Drawer with categories matching the main screen */}
        {showAddForm && (
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 text-xs space-y-2.5">
            <span className="font-semibold text-stone-800 dark:text-stone-200 block">
              Choose category (matching main screen) & caption:
            </span>

            {/* Category selection buttons matching the 6 main selectors */}
            <div className="flex flex-wrap gap-1.5">
              {categoryKeys.map((catKey) => {
                const meta = CATEGORY_CONFIG[catKey];
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(catKey)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900'
                        : 'bg-white dark:bg-[#252830] text-stone-700 dark:text-stone-300 border-[#e4ded5] dark:border-[#353943]'
                    }`}
                  >
                    <span>{meta.emoji} {meta.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="Caption (e.g. Saturday booth setup with new jewelry racks)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-stone-600 dark:text-stone-400 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-3 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Pin Photo
              </button>
            </div>
          </div>
        )}

        {/* Fridge Surface Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#2d3139_1px,transparent_1px)] [background-size:16px_16px]">
          {photos.length === 0 ? (
            <div className="py-14 text-center text-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-[#252830] border border-[#e4ded5] dark:border-[#353943] flex items-center justify-center mx-auto text-stone-400">
                <Camera className="w-6 h-6" />
              </div>
              <p className="font-serif font-bold text-stone-800 dark:text-stone-200 text-sm">
                No photos pinned to the fridge yet
              </p>
              <p className="text-stone-400 text-xs max-w-xs mx-auto">
                Click "+ Pin New Photo" above to pin your favorite booth setups, dinner spots, and project memories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {photos.map((item) => {
              const meta = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-[#252830] p-2.5 pb-4 shadow-md rounded-sm border border-stone-200 dark:border-[#353943] transform ${item.rotation} hover:rotate-0 transition-transform duration-200 group relative`}
                >
                  {/* Simulated Fridge Magnet on top */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-xs border border-white dark:border-[#252830]" />

                  <div className="aspect-4/3 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden mb-2">
                    <img
                      src={item.url}
                      alt={item.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs font-medium text-stone-800 dark:text-stone-200 leading-snug font-serif">
                    {item.caption}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 font-mono">
                    <span>{item.date}</span>
                    <span className="font-sans font-medium text-stone-600 dark:text-stone-300">
                      {meta.emoji} {meta.shortLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 dark:bg-[#202329] border-t border-[#e4ded5] dark:border-[#2d3139] text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 border border-stone-300 dark:border-[#353943] rounded-lg bg-white dark:bg-[#252830] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
