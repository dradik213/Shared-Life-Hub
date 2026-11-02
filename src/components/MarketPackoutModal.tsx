import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Barcode as BarcodeIcon, 
  Camera, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  PackageCheck, 
  Sparkles, 
  AlertCircle,
  Search,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { CalendarEvent, InventoryProduct, MarketPackoutItem } from '../types/calendar';
import { 
  loadMasterInventory, 
  playScannerBeep 
} from '../utils/barcodeUtils';

interface MarketPackoutModalProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onSavePackout: (eventId: string, updatedInventory: MarketPackoutItem[]) => void;
}

export const MarketPackoutModal: React.FC<MarketPackoutModalProps> = ({
  event,
  isOpen,
  onClose,
  onSavePackout
}) => {
  const [masterInventory] = useState<InventoryProduct[]>(() => loadMasterInventory());
  const [packoutItems, setPackoutItems] = useState<MarketPackoutItem[]>(() => {
    if (event.marketDetails?.inventory && event.marketDetails.inventory.length > 0) {
      return [...event.marketDetails.inventory];
    }
    // Default to bringing a standard packout of master inventory items
    return masterInventory.slice(0, 4).map((p) => ({
      productId: p.id,
      name: p.name,
      barcode: p.barcode,
      price: p.price,
      category: p.category,
      quantityPacked: Math.min(15, p.defaultStock),
      quantitySold: 0
    }));
  });

  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Focus barcode input upon opening
  useEffect(() => {
    const timer = setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Camera stream handler
  useEffect(() => {
    if (isCameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          cameraStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable:', err);
          setScanMessage({ text: 'Camera unavailable. Use barcode scanner input below.', isError: true });
          setIsCameraActive(false);
        });
    } else {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    }

    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [isCameraActive]);

  // Handle scanned barcode (from keyboard barcode reader or manual entry)
  const processBarcodeScan = (scannedCode: string) => {
    const clean = scannedCode.trim();
    if (!clean) return;

    // Look for matching product in master catalog or existing packout
    const product = masterInventory.find((p) => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase());

    if (product) {
      playScannerBeep(true);
      setPackoutItems((prev) => {
        const existingIdx = prev.findIndex((item) => item.productId === product.id || item.barcode === clean);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantityPacked: updated[existingIdx].quantityPacked + 1
          };
          setScanMessage({
            text: `Scanned "${product.name}" (+1 packed · Total: ${updated[existingIdx].quantityPacked})`
          });
          return updated;
        } else {
          const newItem: MarketPackoutItem = {
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            category: product.category,
            quantityPacked: 1,
            quantitySold: 0
          };
          setScanMessage({ text: `Added "${product.name}" (1 packed)` });
          return [newItem, ...prev];
        }
      });
      setBarcodeInput('');
    } else {
      playScannerBeep(false);
      setScanMessage({
        text: `Barcode "${clean}" not found in catalog. Create it in Heart > Inventory first.`,
        isError: true
      });
    }

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcodeScan(barcodeInput);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setPackoutItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = Math.max(0, item.quantityPacked + delta);
            return { ...item, quantityPacked: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantityPacked > 0)
    );
  };

  const handleSetExactQuantity = (productId: string, qty: number) => {
    setPackoutItems((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, quantityPacked: Math.max(0, qty) } : item))
        .filter((item) => item.quantityPacked > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setPackoutItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleAddFromCatalog = (product: InventoryProduct, quantity = 5) => {
    playScannerBeep(true);
    setPackoutItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantityPacked: item.quantityPacked + quantity }
            : item
        );
      } else {
        return [
          {
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            category: product.category,
            quantityPacked: quantity,
            quantitySold: 0
          },
          ...prev
        ];
      }
    });
  };

  const handleSave = () => {
    onSavePackout(event.id, packoutItems);
    onClose();
  };

  // Metrics
  const totalUnitsPacked = packoutItems.reduce((acc, i) => acc + i.quantityPacked, 0);
  const totalRetailValue = packoutItems.reduce((acc, i) => acc + (i.quantityPacked * i.price), 0);
  const boothFee = event.marketDetails?.boothFee || 0;
  const targetRevenue = event.marketDetails?.targetRevenue || 0;

  // Filter catalog items to show suggestions
  const catalogSuggestions = masterInventory.filter((p) => {
    const alreadyPacked = packoutItems.some((item) => item.productId === p.id);
    const matchesSearch = 
      p.name.toLowerCase().includes(searchCatalogQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchCatalogQuery.toLowerCase()) ||
      p.barcode.includes(searchCatalogQuery);
    return !alreadyPacked && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-[#1a1d22] rounded-2xl border border-[#e4ded5] dark:border-[#353943] max-w-4xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e4ded5] dark:border-[#353943] pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <BarcodeIcon className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Market Packout: Log Inventory
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-3 gap-3 py-3 border-b border-[#e4ded5] dark:border-[#353943] shrink-0 bg-stone-50 dark:bg-[#202329] -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div>
            <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider block">Units Packed</span>
            <span className="text-lg font-bold text-stone-900 dark:text-stone-100 tabular-nums">
              {totalUnitsPacked} pcs
            </span>
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider block">Total Retail Value</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              ${totalRetailValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider block">Target Coverage</span>
            <span className="text-lg font-bold text-stone-800 dark:text-stone-200 tabular-nums">
              {targetRevenue > 0 ? `${Math.round((totalRetailValue / targetRevenue) * 100)}%` : 'Active'}
            </span>
          </div>
        </div>

        {/* Main Content Area: Left = Barcode Scanner & Camera, Right = Packed Inventory List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          
          {/* BARCODE SCANNER SECTION */}
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase font-mono flex items-center gap-1.5">
                <BarcodeIcon className="w-3.5 h-3.5" />
                <span>Scan Barcodes to Pack Items</span>
              </span>

              <button
                type="button"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                  isCameraActive
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white dark:bg-[#1a1d22] text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>{isCameraActive ? 'Turn Off Camera' : 'Open Camera Scanner'}</span>
              </button>
            </div>

            {/* Camera Viewfinder */}
            {isCameraActive && (
              <div className="relative w-full max-w-sm mx-auto h-44 bg-black rounded-lg overflow-hidden border-2 border-amber-400">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-2 border-dashed border-amber-400/80 m-4 rounded pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                </div>
                <span className="absolute bottom-1 left-2 text-[10px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded">
                  Aim camera at product barcode
                </span>
              </div>
            )}

            {/* Keyboard Wedge / Barcode Input Form */}
            <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                + Scan & Pack
              </button>
            </form>

            {/* Quick Demo Barcode Buttons to test instantly */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-stone-500 font-mono">Quick test scan:</span>
              {masterInventory.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => processBarcodeScan(p.barcode)}
                  className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#202329] border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-500 font-mono cursor-pointer"
                  title={`Barcode: ${p.barcode}`}
                >
                  ⚡ {p.name.split(' ')[0]} ({p.barcode})
                </button>
              ))}
            </div>

            {/* Scan Feedback Banner */}
            {scanMessage && (
              <div
                className={`p-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                  scanMessage.isError
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                }`}
              >
                <span>{scanMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setScanMessage(null)}
                  className="text-xs hover:opacity-70 cursor-pointer ml-2"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* PACKOUT LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 font-mono uppercase tracking-wider">
                Packed Items for this Event ({packoutItems.length})
              </span>
              <span className="text-[11px] text-stone-500">
                Adjust quantities being transported to the booth
              </span>
            </div>

            {packoutItems.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[#e4ded5] dark:border-[#353943] rounded-xl p-4">
                <p className="text-xs text-stone-500">
                  No items packed yet. Scan a barcode above or pick from the catalog below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {packoutItems.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3 bg-stone-50 dark:bg-[#202329] rounded-xl border border-[#e4ded5] dark:border-[#353943] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          ${item.price.toFixed(2)} ea
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono mt-0.5">
                        <span>Barcode: {item.barcode}</span>
                        <span>·</span>
                        <span>{item.category}</span>
                      </div>
                    </div>

                    {/* Quantity Adjustment Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden bg-white dark:bg-[#1a1d22]">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, -1)}
                          className="px-2 py-1 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#282c35] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.quantityPacked}
                          onChange={(e) => handleSetExactQuantity(item.productId, parseInt(e.target.value, 10) || 0)}
                          className="w-12 text-center text-xs font-mono font-bold bg-transparent border-0 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, 1)}
                          className="px-2 py-1 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#282c35] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono tabular-nums">
                          ${(item.quantityPacked * item.price).toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Remove from packout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QUICK ADD CATALOG ACCORDION - GROUPED BY CATEGORY & PRICE TIER */}
          {catalogSuggestions.length > 0 && (
            <div className="pt-3 border-t border-[#e4ded5] dark:border-[#353943] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 font-mono uppercase tracking-wider block">
                  Quick Pack from Master Inventory
                </span>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchCatalogQuery}
                    onChange={(e) => setSearchCatalogQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Category-Grouped Inventory Cards */}
              <div className="space-y-3">
                {Array.from(
                  catalogSuggestions.reduce((map, p) => {
                    const cat = p.category || 'General';
                    if (!map.has(cat)) map.set(cat, []);
                    map.get(cat)!.push(p);
                    return map;
                  }, new Map<string, InventoryProduct[]>()).entries()
                ).map(([catName, catItems]) => (
                  <div key={catName} className="rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] overflow-hidden">
                    <div className="px-3 py-1.5 bg-stone-50 dark:bg-[#202329] border-b border-[#e4ded5] dark:border-[#353943] flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>{catName}</span>
                      </span>
                      <span className="text-[11px] font-mono text-stone-500">
                        {catItems.length} price {catItems.length === 1 ? 'tier' : 'tiers'} available
                      </span>
                    </div>

                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                      {catItems.map((catItem) => (
                        <div
                          key={catItem.id}
                          className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50/50 dark:hover:bg-[#202329]/50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                {catItem.category} — ${catItem.price.toFixed(2)}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                                {catItem.sku}
                              </span>
                              <span className="text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400">
                                In Inventory: {catItem.defaultStock}
                              </span>
                            </div>
                            {catItem.description && (
                              <p className="text-[10px] text-stone-500 font-sans italic truncate mt-0.5">
                                {catItem.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAddFromCatalog(catItem, Math.min(5, catItem.defaultStock || 5))}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-stone-100 dark:bg-[#252830] hover:bg-stone-200 dark:hover:bg-[#323640] text-stone-700 dark:text-stone-300 cursor-pointer transition-colors"
                            >
                              + Pack {Math.min(5, catItem.defaultStock || 5)}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddFromCatalog(catItem, 1)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 cursor-pointer shadow-2xs transition-colors"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#e4ded5] dark:border-[#353943] flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500">
            <span>{totalUnitsPacked} units</span> · <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">${totalRetailValue.toFixed(2)} packed</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Market Packout</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
