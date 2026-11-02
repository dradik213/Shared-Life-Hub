import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Barcode as BarcodeIcon, 
  Camera, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  Search, 
  Sparkles, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { CalendarEvent, InventoryProduct, MarketPackoutItem, MarketSaleRecord } from '../types/calendar';
import { 
  loadMasterInventory, 
  saveMasterInventory,
  deductSalesFromMasterInventory,
  generateSimpleQrSvg, 
  playScannerBeep 
} from '../utils/barcodeUtils';

interface PointOfSaleRegisterModalProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onCompleteSale: (
    eventId: string, 
    sale: MarketSaleRecord, 
    updatedActualRevenue: number, 
    updatedInventory?: MarketPackoutItem[]
  ) => void;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  barcode: string;
  quantity: number;
  category?: string;
}

export const PointOfSaleRegisterModal: React.FC<PointOfSaleRegisterModalProps> = ({
  event,
  isOpen,
  onClose,
  onCompleteSale
}) => {
  const [masterInventory, setMasterInventory] = useState<InventoryProduct[]>(() => loadMasterInventory());
  
  // Available items in booth: from packout or master catalog (memoized to prevent infinite render loops)
  const boothItems = useMemo(() => {
    return (event?.marketDetails?.inventory && event.marketDetails.inventory.length > 0)
      ? event.marketDetails.inventory
      : masterInventory.map((p) => ({
          productId: p.id,
          name: p.name,
          barcode: p.barcode,
          price: p.price,
          category: p.category,
          quantityPacked: p.defaultStock,
          quantitySold: 0
        }));
  }, [event?.marketDetails?.inventory, masterInventory]);

  const [activeInventory, setActiveInventory] = useState<MarketPackoutItem[]>(boothItems);

  useEffect(() => {
    setActiveInventory(boothItems);
  }, [boothItems]);

  if (!isOpen) return null;

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Barcode input & camera
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanToast, setScanToast] = useState<string | null>(null);

  // Checkout flow state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'venmo'>('card');
  
  // Cash details
  const [cashTendered, setCashTendered] = useState<string>('');
  
  // Card details
  const [isCardScannerActive, setIsCardScannerActive] = useState(false);
  const [cardStatus, setCardStatus] = useState<'idle' | 'scanning' | 'processing' | 'approved'>('idle');
  const [tipPercent, setTipPercent] = useState<number>(0);

  // Venmo details
  const [venmoHandle, setVenmoHandle] = useState<string>('OurCrafts-Market');

  // Completed sale receipt
  const [completedSale, setCompletedSale] = useState<MarketSaleRecord | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Keep scanner focused
  useEffect(() => {
    if (!isCheckoutOpen && !completedSale) {
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isCheckoutOpen, completedSale]);

  // Handle camera stream for POS barcode scanning or card scanning
  useEffect(() => {
    const needCamera = isCameraActive || isCardScannerActive;
    if (needCamera) {
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
          console.warn('Camera unavailable:', err);
          setIsCameraActive(false);
          setIsCardScannerActive(false);
        });
    } else {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
    }

    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [isCameraActive, isCardScannerActive]);

  // Extract categories
  const categories = ['All', ...Array.from(new Set(activeInventory.map((i) => i.category).filter(Boolean)))];

  const filteredItems = activeInventory.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add item to cart by object
  const handleAddToCart = (item: { productId: string; name: string; price: number; barcode: string }) => {
    playScannerBeep(true);
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.productId);
      if (existing) {
        return prev.map((c) =>
          c.productId === item.productId ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
    setScanToast(`Added "${item.name}"`);
    setTimeout(() => setScanToast(null), 2000);
  };

  // Process barcode scan
  const handleScanBarcode = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    const matched = activeInventory.find((i) => i.barcode === clean);
    if (matched) {
      handleAddToCart(matched);
      setBarcodeInput('');
    } else {
      // Also check master catalog
      const masterMatch = masterInventory.find((p) => p.barcode === clean);
      if (masterMatch) {
        handleAddToCart({
          productId: masterMatch.id,
          name: masterMatch.name,
          price: masterMatch.price,
          barcode: masterMatch.barcode
        });
        setBarcodeInput('');
      } else {
        playScannerBeep(false);
        setScanToast(`Barcode "${clean}" not recognized in inventory.`);
        setTimeout(() => setScanToast(null), 2500);
      }
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScanBarcode(barcodeInput);
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setDiscountPercent(0);
  };

  // Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const activeDiscount = discountPercent > 0
    ? (cartSubtotal * (discountPercent / 100))
    : discountAmount;
  const discountedSubtotal = Math.max(0, cartSubtotal - activeDiscount);
  const taxRate = 0.085; // 8.5% default sales tax
  const taxAmount = discountedSubtotal * taxRate;
  const tipAmount = (discountedSubtotal + taxAmount) * (tipPercent / 100);
  const cartTotal = discountedSubtotal + taxAmount + tipAmount;

  const currentRevenue = event.marketDetails?.actualRevenue || 0;
  const targetRevenue = event.marketDetails?.targetRevenue || 0;
  const boothFee = event.marketDetails?.boothFee || 0;

  // Open checkout drawer
  const handleStartCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckoutOpen(true);
    setPaymentMethod('card');
    setCashTendered(Math.ceil(cartTotal).toString());
    setCardStatus('idle');
  };

  // Execute payment completion
  const handleFinalizeSale = (method: 'cash' | 'card' | 'venmo') => {
    const saleId = `sale-${Date.now()}`;
    const tendered = method === 'cash' ? parseFloat(cashTendered) || cartTotal : undefined;
    const change = tendered ? Math.max(0, tendered - cartTotal) : undefined;

    const saleRecord: MarketSaleRecord = {
      id: saleId,
      timestamp: new Date().toISOString(),
      items: cart.map((c) => {
        const prod = masterInventory.find((p) => p.id === c.productId || p.barcode === c.barcode);
        return {
          productId: c.productId,
          name: c.name,
          category: c.category || prod?.category || '',
          sku: prod?.sku || '',
          quantity: c.quantity,
          unitPrice: c.price
        };
      }),
      subtotal: discountedSubtotal,
      tax: taxAmount,
      total: cartTotal,
      paymentMethod: method,
      cashTendered: tendered,
      changeDue: change
    };

    // Update packed inventory sold counts
    const updatedInventory = activeInventory.map((item) => {
      const soldItem = cart.find((c) => c.productId === item.productId);
      if (soldItem) {
        return {
          ...item,
          quantitySold: (item.quantitySold || 0) + soldItem.quantity
        };
      }
      return item;
    });

    setActiveInventory(updatedInventory);

    // Deduct sold units from Master Inventory (localStorage: duosync_master_inventory_v1)
    const updatedMaster = deductSalesFromMasterInventory(
      cart.map((c) => ({
        productId: c.productId,
        sku: masterInventory.find((p) => p.id === c.productId || p.barcode === c.barcode)?.sku,
        barcode: c.barcode,
        quantity: c.quantity
      }))
    );
    setMasterInventory(updatedMaster);

    const newRevenue = currentRevenue + cartTotal;

    playScannerBeep(true);
    setCompletedSale(saleRecord);
    setIsCheckoutOpen(false);
    onCompleteSale(event.id, saleRecord, newRevenue, updatedInventory);
  };

  const handleNewSale = () => {
    setCart([]);
    setCompletedSale(null);
    setTipPercent(0);
    setCardStatus('idle');
  };

  const handleSimulateCardScan = () => {
    setCardStatus('scanning');
    setTimeout(() => {
      setCardStatus('processing');
      setTimeout(() => {
        setCardStatus('approved');
        setTimeout(() => {
          handleFinalizeSale('card');
        }, 600);
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-[#1a1d22] rounded-2xl border border-[#e4ded5] dark:border-[#353943] w-full max-w-6xl h-[94vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* TOP BAR / REGISTER HEADER */}
        <div className="px-4 py-3 border-b border-[#e4ded5] dark:border-[#353943] flex items-center justify-between shrink-0 bg-stone-50 dark:bg-[#202329]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Market Point of Sale Register
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                  Live Register
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 cursor-pointer rounded-lg hover:bg-stone-200 dark:hover:bg-[#2d3139]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN REGISTER BODY: Split into 2-column catalog & active cart */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT COLUMN: SCANNER & CATALOG GRID (60%) */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-[#e4ded5] dark:border-[#353943] p-4 overflow-hidden space-y-3">
            
            {/* Quick Barcode Scanner Strip */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase font-mono flex items-center gap-1.5">
                  <BarcodeIcon className="w-3.5 h-3.5" />
                  <span>Barcode Scanner Register</span>
                </span>
                
                <button
                  type="button"
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border cursor-pointer ${
                    isCameraActive
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-[#1a1d22] text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>{isCameraActive ? 'Hide Camera' : 'Camera Barcode Scanner'}</span>
                </button>
              </div>

              {/* Camera Scanner Viewfinder */}
              {isCameraActive && (
                <div className="relative w-full max-w-xs mx-auto h-36 bg-black rounded-lg overflow-hidden border-2 border-amber-500">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <div className="absolute inset-0 border border-dashed border-white/60 m-3 rounded flex items-center justify-center pointer-events-none">
                    <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                  </div>
                </div>
              )}

              {/* Barcode input for scanner wedge */}
              <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="flex-1 text-xs font-mono px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                >
                  + Add Item
                </button>
              </form>

              {scanToast && (
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{scanToast}</span>
                </div>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-[50%] scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-[#252830] text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Quick-Tap Grid with Category, Price Badge, SKU, Description */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-1">
              {filteredItems.map((item) => {
                const remaining = Math.max(0, item.quantityPacked - (item.quantitySold || 0));
                const prod = masterInventory.find((p) => p.id === item.productId || p.barcode === item.barcode);
                const sku = prod?.sku;
                const desc = prod?.description;

                return (
                  <button
                    key={item.productId}
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className="p-3 bg-stone-50 dark:bg-[#202329] hover:bg-amber-50/60 dark:hover:bg-amber-950/20 border border-[#e4ded5] dark:border-[#353943] hover:border-amber-400 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer group shadow-2xs"
                  >
                    <div>
                      {/* Category & SKU Header */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase tracking-wider font-semibold truncate">
                          {item.category}
                        </span>
                        {sku && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 shrink-0 font-medium">
                            {sku}
                          </span>
                        )}
                      </div>

                      {/* Large $Price Badge */}
                      <div className="my-1">
                        <span className="inline-block text-sm sm:text-base font-black text-amber-950 dark:text-amber-200 bg-amber-200/90 dark:bg-amber-900/60 px-2 py-0.5 rounded-md font-mono shadow-2xs">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 mt-1 group-hover:text-amber-800 dark:group-hover:text-amber-300">
                        {item.name}
                      </h4>

                      {desc && (
                        <p className="text-[10px] text-stone-400 font-sans italic line-clamp-1 mt-0.5">
                          {desc}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-200/60 dark:border-stone-800 text-[11px] font-mono">
                      <span className="text-stone-500">
                        {remaining} left
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:underline">
                        + Add to Cart
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: CURRENT CART & CHECKOUT (40%) */}
          <div className="w-full lg:w-[420px] bg-white dark:bg-[#1f2228] flex flex-col justify-between p-4 overflow-hidden">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-[#e4ded5] dark:border-[#353943] pb-2.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-mono">
                  Current Sale
                </span>
                <span className="text-xs font-bold px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-[#282c35] text-stone-800 dark:text-stone-200">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[11px] text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-2.5 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                  <BarcodeIcon className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs font-medium">Cart is empty.</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Scan a product barcode or tap an item on the left to add it.
                  </p>
                </div>
              ) : (
                cart.map((c) => (
                  <div
                    key={c.productId}
                    className="p-2.5 rounded-lg border border-stone-200/90 dark:border-stone-700/80 bg-stone-50/60 dark:bg-[#1a1d22] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        ${c.price.toFixed(2)} ea
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-md overflow-hidden bg-white dark:bg-[#252830]">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(c.productId, -1)}
                          className="px-1.5 py-0.5 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#323640] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold">
                          {c.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(c.productId, 1)}
                          className="px-1.5 py-0.5 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#323640] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-16 text-right text-xs font-bold text-stone-900 dark:text-stone-100 font-mono tabular-nums">
                        ${(c.price * c.quantity).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(c.productId)}
                        className="text-stone-300 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Calculations & Big Checkout Button */}
            <div className="border-t border-[#e4ded5] dark:border-[#353943] pt-3 shrink-0 space-y-2">
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <span>Discount</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountPercent(0);
                          setDiscountAmount((prev) => (prev === 5 ? 0 : 5));
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                          discountAmount === 5 && discountPercent === 0
                            ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 font-bold'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        -$5
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountAmount(0);
                          setDiscountPercent((prev) => (prev === 10 ? 0 : 10));
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                          discountPercent === 10
                            ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 font-bold'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        10%
                      </button>
                    </div>
                  </div>
                  {activeDiscount > 0 ? (
                    <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                      -${activeDiscount.toFixed(2)}
                    </span>
                  ) : (
                    <span className="font-mono tabular-nums text-stone-400">$0.00</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-stone-500">
                  <span>Sales Tax (8.5%)</span>
                  <span className="font-mono tabular-nums">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-stone-200 dark:border-stone-800 text-sm font-bold text-stone-900 dark:text-stone-100">
                  <span>Total Amount</span>
                  <span className="text-lg font-mono tabular-nums text-purple-700 dark:text-purple-400">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleStartCheckout}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Charge ${cartTotal.toFixed(2)}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CHECKOUT MODAL OVERLAY (Cash, Card, Venmo) */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1a1d22] rounded-2xl border border-[#e4ded5] dark:border-[#353943] max-w-lg w-full p-5 shadow-2xl space-y-4">
              
              {/* Checkout Header */}
              <div className="flex items-center justify-between border-b border-[#e4ded5] dark:border-[#353943] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Payment Method
                  </h3>
                  <p className="text-xs text-stone-500">
                    Total Due: <span className="font-mono font-bold text-purple-700 dark:text-purple-400 text-sm">${cartTotal.toFixed(2)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 3 Payment Tabs: Card, Cash, Venmo */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 dark:bg-[#252830] rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Card / Reader</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('venmo')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === 'venmo'
                      ? 'bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Venmo QR</span>
                </button>
              </div>

              {/* CARD PAYMENT WORKFLOW */}
              {paymentMethod === 'card' && (
                <div className="space-y-3.5 text-center py-2">
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#202329] space-y-3">
                    <CreditCard className="w-10 h-10 text-purple-600 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        Square / Stripe Mobile Terminal
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Tap contactless card, insert chip, or scan with camera card reader.
                      </p>
                    </div>

                    {/* Camera Card Scanner View */}
                    {isCardScannerActive && (
                      <div className="relative w-full h-36 bg-black rounded-lg overflow-hidden border-2 border-purple-500 my-2">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                        <div className="absolute inset-0 border-2 border-white/80 m-4 rounded pointer-events-none flex items-center justify-center">
                          <span className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded">
                            Align Card Within Frame
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tip Presets */}
                    <div className="pt-1">
                      <span className="text-[10px] text-stone-500 font-mono block mb-1">Add Tip</span>
                      <div className="flex items-center justify-center gap-2">
                        {[0, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setTipPercent(pct)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                              tipPercent === pct
                                ? 'bg-purple-600 text-white'
                                : 'bg-stone-200 dark:bg-[#282c35] text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {pct === 0 ? 'No Tip' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scanner action */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCardScannerActive(!isCardScannerActive)}
                        className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isCardScannerActive ? 'Close Card Scanner' : 'Open Card Scanner'}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={cardStatus !== 'idle'}
                    onClick={handleSimulateCardScan}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    {cardStatus === 'idle' && `Process Card (${(cartTotal).toFixed(2)})`}
                    {cardStatus === 'scanning' && 'Scanning Card Details...'}
                    {cardStatus === 'processing' && 'Authorizing via Stripe / Square...'}
                    {cardStatus === 'approved' && '✓ Payment Approved!'}
                  </button>
                </div>
              )}

              {/* CASH PAYMENT WORKFLOW */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 py-1">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Cash Tendered
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-full text-lg font-mono font-bold px-3 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  {/* Preset Bills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: `Exact ($${cartTotal.toFixed(2)})`, val: cartTotal },
                      { label: '$10', val: 10 },
                      { label: '$20', val: 20 },
                      { label: '$50', val: 50 },
                      { label: '$100', val: 100 }
                    ].map((bill) => (
                      <button
                        key={bill.label}
                        type="button"
                        onClick={() => setCashTendered(bill.val.toFixed(2))}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-[#252830] hover:bg-stone-200 dark:hover:bg-[#323640] text-stone-800 dark:text-stone-200 text-xs font-mono font-semibold cursor-pointer"
                      >
                        {bill.label}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculator Display */}
                  {parseFloat(cashTendered) >= cartTotal && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                      <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 block">
                        Change Due to Customer
                      </span>
                      <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        ${(parseFloat(cashTendered) - cartTotal).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={parseFloat(cashTendered) < cartTotal}
                    onClick={() => handleFinalizeSale('cash')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Complete Cash Sale
                  </button>
                </div>
              )}

              {/* VENMO QR CODE WORKFLOW */}
              {paymentMethod === 'venmo' && (
                <div className="space-y-3 text-center py-1">
                  <div className="p-3 bg-stone-50 dark:bg-[#202329] rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                      Venmo QR Payment
                    </span>
                    
                    {/* Rendered SVG QR code */}
                    <div 
                      dangerouslySetInnerHTML={{
                        __html: generateSimpleQrSvg(
                          `venmo://paycharge?txn=pay&recipients=${venmoHandle}&amount=${cartTotal.toFixed(2)}&note=Market+Items`,
                          160
                        )
                      }}
                      className="p-2 bg-white rounded-lg shadow-xs"
                    />

                    <div className="text-xs font-mono text-stone-700 dark:text-stone-300">
                      <span>Recipient: </span>
                      <span className="font-bold">@{venmoHandle}</span>
                    </div>

                    <a
                      href={`venmo://paycharge?txn=pay&recipients=${venmoHandle}&amount=${cartTotal.toFixed(2)}&note=Market+Items`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open Venmo Deep Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFinalizeSale('venmo')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Venmo Payment Received (${cartTotal.toFixed(2)})</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* SALE COMPLETED / RECEIPT VIEW */}
        {completedSale && (
          <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1a1d22] rounded-2xl border border-[#e4ded5] dark:border-[#353943] max-w-md w-full p-6 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Sale Complete!
                </h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  Receipt #{completedSale.id.slice(-6).toUpperCase()} · Paid via {completedSale.paymentMethod.toUpperCase()}
                </p>
              </div>

              {/* Receipt slip box */}
              <div className="bg-stone-50 dark:bg-[#202329] p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-left space-y-1.5 text-xs font-mono">
                <div className="border-b border-stone-200 dark:border-stone-700 pb-1 flex justify-between font-bold">
                  <span>Item</span>
                  <span>Amount</span>
                </div>
                {completedSale.items.map((i) => (
                  <div key={i.productId} className="flex justify-between text-stone-700 dark:text-stone-300 text-[11px]">
                    <span className="truncate max-w-[200px]">{i.quantity}x {i.name}</span>
                    <span>${(i.quantity * i.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-stone-200 dark:border-stone-700 pt-1 flex justify-between font-bold text-stone-900 dark:text-stone-100 text-sm">
                  <span>Total Paid</span>
                  <span>${completedSale.total.toFixed(2)}</span>
                </div>
                {completedSale.changeDue !== undefined && completedSale.changeDue > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold text-xs">
                    <span>Change Given</span>
                    <span>${completedSale.changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-lg bg-stone-100 dark:bg-[#282c35] text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleNewSale}
                  className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 cursor-pointer"
                >
                  Next Customer / New Sale
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
