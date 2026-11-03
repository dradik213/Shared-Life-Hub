import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  Edit3, 
  Barcode as BarcodeIcon, 
  RefreshCw, 
  Check, 
  X, 
  DollarSign, 
  Tag, 
  Layers, 
  ArrowLeft,
  Sparkles,
  Download,
  RotateCcw,
  Minus
} from 'lucide-react';
import { InventoryProduct } from '../types/calendar';
import { 
  loadMasterInventory, 
  saveMasterInventory, 
  generateBarcode, 
  generateBarcodeSvg, 
  playScannerBeep,
  generateAutoSku,
  DEFAULT_SAMPLE_PRODUCTS
} from '../utils/barcodeUtils';

interface InventoryManagerProps {
  onClose?: () => void;
}

const INITIAL_CATEGORIES = [
  'Shirts',
  'Hoodies & Sweatshirts',
  'Hats & Beanies',
  'Totes & Bags',
  'Stickers & Pins',
  'Mugs & Drinkware'
];

const CATEGORIES_STORAGE_KEY = 'duosync_inventory_categories';

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onClose }) => {
  const [products, setProducts] = useState<InventoryProduct[]>(() => loadMasterInventory());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Categories management
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fromProducts = products.map((p) => p.category).filter(Boolean);
          return Array.from(new Set([...INITIAL_CATEGORIES, ...fromProducts, ...parsed]));
        }
      }
    } catch (e) {}
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...INITIAL_CATEGORIES, ...fromProducts]));
  });

  // Save categories on change
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {}
  }, [categories]);

  // Product add/edit modal state
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);

  // Form fields
  const [formCategory, setFormCategory] = useState('Shirts');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formPrice, setFormPrice] = useState<string>('20.00');
  const [formStock, setFormStock] = useState<string>('10');
  const [formSku, setFormSku] = useState('');
  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(false);
  const [formBarcode, setFormBarcode] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Mobile Label Printing Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printProduct, setPrintProduct] = useState<InventoryProduct | null>(null);
  const [labelCopies, setLabelCopies] = useState<number>(4);
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'receipt'>('standard');

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Category inline rename state
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Auto-generate SKU when category or price changes (unless manually edited)
  // Collision-proof: parses trailing sequence numbers -(\d+)$ from existing SKUs in the category and uses maxSeq + 1
  const computeNextSku = (cat: string, priceStr: string) => {
    const existingInCat = products.filter((p) => p.category.toLowerCase() === cat.trim().toLowerCase());
    let maxSeq = 0;
    for (const p of existingInCat) {
      if (p.sku) {
        const match = p.sku.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }
    const nextSeq = maxSeq + 1;
    return generateAutoSku(cat, priceStr, nextSeq);
  };

  const handleRenameCategory = (oldCat: string, newCatRaw: string) => {
    const newCat = newCatRaw.trim();
    if (!newCat || newCat === oldCat) {
      setRenamingCategory(null);
      return;
    }
    // Update categories
    const updatedCategories = categories.map((c) => (c === oldCat ? newCat : c));
    if (!updatedCategories.includes(newCat)) {
      updatedCategories.push(newCat);
    }
    setCategories(updatedCategories);
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
    } catch (e) {}

    // Update all products in products and localStorage
    const updatedProducts = products.map((p) => {
      if (p.category === oldCat) {
        return {
          ...p,
          category: newCat,
          name: p.name.startsWith(oldCat) ? p.name.replace(oldCat, newCat) : p.name
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    saveMasterInventory(updatedProducts);
    setRenamingCategory(null);
    showStatus(`Renamed "${oldCat}" to "${newCat}" across all products`);
  };

  const handleOpenAdd = (preselectedCategory?: string) => {
    const targetCat = preselectedCategory || (categories[0] || 'Shirts');
    const targetPrice = '20.00';
    const nextSku = computeNextSku(targetCat, targetPrice);
    const newBarcode = generateBarcode();

    setEditingProduct(null);
    setFormCategory(targetCat);
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    setFormPrice(targetPrice);
    setFormStock('10');
    setFormSku(nextSku);
    setIsSkuManuallyEdited(false);
    setFormBarcode(newBarcode);
    setFormDescription('');
    setIsEditingModalOpen(true);
  };

  const handleOpenEdit = (p: InventoryProduct) => {
    setEditingProduct(p);
    setFormCategory(p.category);
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    setFormPrice(p.price.toFixed(2));
    setFormStock(String(p.defaultStock));
    setFormSku(p.sku);
    setIsSkuManuallyEdited(true); // Don't auto-overwrite existing SKU on edit
    setFormBarcode(p.barcode);
    setFormDescription(p.description || '');
    setIsEditingModalOpen(true);
  };

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__NEW__') {
      setIsCreatingNewCategory(true);
      setNewCategoryName('');
    } else {
      setIsCreatingNewCategory(false);
      setFormCategory(val);
      if (!isSkuManuallyEdited && !editingProduct) {
        setFormSku(computeNextSku(val, formPrice));
      }
    }
  };

  const handleAddNewCategoryConfirm = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      setCategories(updated);
    }
    setFormCategory(trimmed);
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    if (!isSkuManuallyEdited && !editingProduct) {
      setFormSku(computeNextSku(trimmed, formPrice));
    }
  };

  const handlePriceChange = (val: string) => {
    setFormPrice(val);
    if (!isSkuManuallyEdited && !editingProduct) {
      setFormSku(computeNextSku(formCategory, val));
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCategory = formCategory.trim();
    if (isCreatingNewCategory && newCategoryName.trim()) {
      finalCategory = newCategoryName.trim();
      if (!categories.includes(finalCategory)) {
        setCategories((prev) => [...prev, finalCategory]);
      }
    }
    if (!finalCategory) finalCategory = 'General';

    const priceNum = parseFloat(formPrice) || 0;
    const stockNum = parseInt(formStock, 10) || 0;
    const finalBarcode = formBarcode.trim() || generateBarcode();
    const finalSku = formSku.trim() || generateAutoSku(finalCategory, priceNum);
    const finalDesc = formDescription.trim();

    // Auto-generate item name from Category, Price, and optional description
    const formattedPrice = priceNum % 1 === 0 ? priceNum.toFixed(0) : priceNum.toFixed(2);
    const generatedName = finalDesc 
      ? `${finalCategory} ($${formattedPrice}) — ${finalDesc}`
      : `${finalCategory} ($${formattedPrice})`;

    let updated: InventoryProduct[];
    if (editingProduct) {
      updated = products.map((item) =>
        item.id === editingProduct.id
          ? {
              ...item,
              name: generatedName,
              sku: finalSku,
              barcode: finalBarcode,
              category: finalCategory,
              price: priceNum,
              defaultStock: stockNum,
              description: finalDesc
            }
          : item
      );
      showStatus(`Updated "${generatedName}".`);
    } else {
      const newItem: InventoryProduct = {
        id: `prod-${Date.now()}`,
        name: generatedName,
        sku: finalSku,
        barcode: finalBarcode,
        category: finalCategory,
        price: priceNum,
        defaultStock: stockNum,
        description: finalDesc,
        createdAt: new Date().toISOString()
      };
      updated = [newItem, ...products];
      showStatus(`Added "${generatedName}".`);
    }

    setProducts(updated);
    saveMasterInventory(updated);
    setIsEditingModalOpen(false);
    playScannerBeep(true);
  };

  // Inline Two-Click Delete (no window.confirm)
  const handleDeleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveMasterInventory(updated);
    setConfirmDeleteId(null);
    showStatus(`Deleted "${prod?.name || 'item'}" from inventory.`);
  };

  // Inline Quantity Stepper
  const handleAdjustQuantity = (id: string, delta: number) => {
    const updated = products.map((p) => {
      if (p.id !== id) return p;
      const nextStock = Math.max(0, (p.defaultStock || 0) + delta);
      return { ...p, defaultStock: nextStock };
    });
    setProducts(updated);
    saveMasterInventory(updated);
  };



  const handleOpenPrintDialog = (p: InventoryProduct) => {
    setPrintProduct(p);
    setLabelCopies(4);
    setIsPrintModalOpen(true);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  // Total inventory stats
  const totalStockCount = products.reduce((acc, p) => acc + (p.defaultStock || 0), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.price * (p.defaultStock || 0)), 0);

  // Group products by Category
  const groupedProducts = React.useMemo(() => {
    const map = new Map<string, InventoryProduct[]>();

    // Filter by search query
    const filtered = products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
      const matchesCat = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
      return matchesSearch && matchesCat;
    });

    for (const p of filtered) {
      const cat = p.category || 'Uncategorized';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(p);
    }

    // Sort tiers inside each category by price descending
    for (const [cat, items] of map.entries()) {
      items.sort((a, b) => b.price - a.price);
    }

    return map;
  }, [products, searchQuery, selectedCategoryFilter]);

  const allAvailableCategories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e4ded5] dark:border-[#353943] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              <Package className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Inventory & Price Tiers
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Temporary Status Toast Banner */}
      {statusMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-medium">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-xs hover:opacity-70 cursor-pointer">×</button>
        </div>
      )}

      {/* Compact Summary & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="text-xs text-stone-600 dark:text-stone-400 font-medium">
          <span className="font-semibold text-stone-900 dark:text-stone-100">{products.length} SKUs</span>
          <span className="mx-1.5 text-stone-400">·</span>
          <span>{totalStockCount} in stock</span>
          <span className="mx-1.5 text-stone-400">·</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">${totalRetailValuation.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative min-w-[180px] max-w-xs flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>
          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Item</span>
          </button>
        </div>
      </div>

      {/* Grouped Category + Price Tiers View */}
      {groupedProducts.size === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#e4ded5] dark:border-[#353943] rounded-xl p-6">
          <Package className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">No inventory products found.</p>
          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 cursor-pointer"
          >
            Create Your First Product
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(groupedProducts.entries()).map(([categoryName, items]) => {
            const categoryQuantity = items.reduce((sum, item) => sum + (item.defaultStock || 0), 0);
            const categoryValue = items.reduce((sum, item) => sum + (item.price * (item.defaultStock || 0)), 0);

            return (
              <div 
                key={categoryName}
                className="bg-white dark:bg-[#1f2228] rounded-xl border border-[#e4ded5] dark:border-[#353943] shadow-2xs overflow-hidden"
              >
                {/* Category Header Strip */}
                <div className="px-4 py-3 bg-stone-50/90 dark:bg-[#252830] border-b border-[#e4ded5] dark:border-[#353943] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    {renamingCategory === categoryName ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRenameCategory(categoryName, renameInput);
                        }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          autoFocus
                          className="px-2 py-0.5 text-xs font-semibold rounded border border-amber-400 dark:border-amber-500 bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100 focus:outline-hidden"
                        />
                        <button
                          type="submit"
                          className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingCategory(null)}
                          className="px-1.5 py-0.5 text-[11px] rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {categoryName}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingCategory(categoryName);
                            setRenameInput(categoryName);
                          }}
                          title={`Rename ${categoryName}`}
                          className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 px-1.5 py-0.5 rounded hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Rename</span>
                        </button>
                      </div>
                    )}
                    <span className="text-stone-400">·</span>
                    <span className="text-xs text-stone-600 dark:text-stone-400">
                      <strong>{categoryQuantity}</strong> items in inventory
                    </span>
                    <span className="text-stone-400">·</span>
                    <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ${categoryValue.toFixed(2)} total value
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAdd(categoryName)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#353943] hover:bg-stone-100 dark:hover:bg-[#282c35] text-stone-800 dark:text-stone-200 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Plus className="w-3 h-3 text-amber-600" />
                    <span>+ Add {categoryName} Tier</span>
                  </button>
                </div>

                {/* Price Tier Rows inside Category */}
                <div className="divide-y divide-[#f0ece5] dark:divide-[#2a2e36]">
                  {items.map((product) => {
                    const isDeleting = confirmDeleteId === product.id;
                    const tierTotal = product.price * (product.defaultStock || 0);

                    return (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-stone-50/60 dark:hover:bg-[#22252c] transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        {/* Left: Bold $Price + optional description + subtle muted SKU */}
                        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.description && (
                            <span className="text-xs text-stone-600 dark:text-stone-300 truncate max-w-xs">
                              {product.description}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
                            {product.sku}
                          </span>
                        </div>

                        {/* Right: Quantity Stepper, Edit, and Inline Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Quantity Stepper */}
                          <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden bg-white dark:bg-[#1a1d22]">
                            <button
                              type="button"
                              onClick={() => handleAdjustQuantity(product.id, -1)}
                              className="px-2 py-1 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#282c35] cursor-pointer"
                              title="Decrease stock"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-9 text-center text-xs font-mono font-bold text-stone-900 dark:text-stone-100">
                              {product.defaultStock}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustQuantity(product.id, 1)}
                              className="px-2 py-1 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#282c35] cursor-pointer"
                              title="Increase stock"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Edit Item */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-[#282c35] transition-colors cursor-pointer"
                            title="Edit Tier / SKU / Price"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Inline Two-Click Delete */}
                          {isDeleting ? (
                            <div className="flex items-center gap-1 animate-in fade-in duration-150">
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-1 text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL: Category + Price + Auto-SKU + Quantity */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1a1d22] rounded-2xl border border-[#e4ded5] dark:border-[#353943] max-w-lg w-full p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-[#e4ded5] dark:border-[#353943] pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BarcodeIcon className="w-4 h-4 text-amber-600" />
                <span>{editingProduct ? 'Edit Inventory Item' : 'New Category & Price Tier Item'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              {/* FIELD 1 (Top/Primary): Category Dropdown + inline Create Category */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Category *
                </label>
                <select
                  value={isCreatingNewCategory ? '__NEW__' : formCategory}
                  onChange={handleCategorySelectChange}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100 font-medium"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__NEW__">+ Create New Category...</option>
                </select>

                {/* Inline New Category Creation Input */}
                {isCreatingNewCategory && (
                  <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                    <input
                      type="text"
                      placeholder=""
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewCategoryConfirm();
                        }
                      }}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategoryConfirm}
                      disabled={!newCategoryName.trim()}
                      className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCategory(false)}
                      className="px-2 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* FIELD 2: Price ($) and Quantity in Inventory (2-column grid) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Price ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder=""
                      value={formPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Quantity in Inventory *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder=""
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100 font-mono font-bold"
                  />
                </div>
              </div>

              {/* FIELD 3: SKU (Auto-Generated from Category + Price, Editable) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-stone-700 dark:text-stone-300">
                    SKU * (Auto-Generated, Editable)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = computeNextSku(formCategory, formPrice);
                      setFormSku(next);
                      setIsSkuManuallyEdited(false);
                    }}
                    className="text-[11px] text-amber-700 dark:text-amber-400 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate Auto SKU</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formSku}
                  onChange={(e) => {
                    setFormSku(e.target.value);
                    setIsSkuManuallyEdited(true);
                  }}
                  placeholder=""
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100 font-mono font-semibold tracking-wider"
                />
              </div>

              {/* FIELD 4: Description / Notes (Optional) */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Item name will automatically be formatted as <strong>{formCategory} (${Number(formPrice || 0).toFixed(0)}) {formDescription.trim() ? `— ${formDescription.trim()}` : ''}</strong>
                </p>
              </div>

              {/* Barcode Number & Regenerate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-stone-700 dark:text-stone-300">
                    Barcode (Code 128 / UPC)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormBarcode(generateBarcode())}
                    className="text-[11px] text-amber-700 dark:text-amber-400 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Unique Barcode</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formBarcode}
                  onChange={(e) => setFormBarcode(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100 font-mono tracking-wider"
                />
              </div>

              {/* Live Barcode Preview Box */}
              {formBarcode && (
                <div className="p-3 bg-white rounded-lg border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-400 font-mono block mb-1">Code 128 Label Preview</span>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generateBarcodeSvg(formBarcode, { height: 38, barWidth: 1.4 }).svgContent
                    }}
                    className="flex justify-center"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e4ded5] dark:border-[#353943]">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white cursor-pointer shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE THERMAL LABEL PRINT MODAL */}
      {isPrintModalOpen && printProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1a1d22] rounded-2xl border border-[#e4ded5] dark:border-[#353943] max-w-lg w-full p-5 shadow-xl space-y-4 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-[#e4ded5] dark:border-[#353943] pb-3">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span>Print Barcode Labels</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Formatted for Bluetooth / USB mobile label printers (Munbyn, Phomemo, Rollo).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print Settings */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Label Template
                </label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                >
                  <option value="standard">2" × 1" (50×25mm) Standard Thermal</option>
                  <option value="compact">2.25" × 1.25" Jewelry / Small</option>
                  <option value="receipt">Continuous 80mm Roll</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Copies to Print
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={labelCopies}
                  onChange={(e) => setLabelCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>
            </div>

            {/* Print Preview Container */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 font-mono uppercase tracking-wider block">
                Thermal Roll Preview ({labelCopies} copies)
              </span>

              <div 
                ref={printAreaRef}
                className="bg-stone-100 dark:bg-[#22252c] p-3 rounded-xl border border-stone-200 dark:border-stone-700 max-h-64 overflow-y-auto flex flex-col items-center gap-3"
              >
                {Array.from({ length: Math.min(labelCopies, 12) }).map((_, idx) => {
                  const barcodeSvg = generateBarcodeSvg(printProduct.barcode, {
                    height: 38,
                    barWidth: 1.4,
                    showText: true
                  });

                  return (
                    <div
                      key={idx}
                      className="bg-white text-black p-2 rounded border border-stone-300 shadow-2xs w-64 flex flex-col items-center justify-between"
                      style={{ minHeight: '96px' }}
                    >
                      <div className="w-full flex items-center justify-between text-[11px] font-bold border-b border-stone-200 pb-0.5 mb-1 px-1">
                        <span className="truncate max-w-[160px]">{printProduct.name}</span>
                        <span className="font-mono tabular-nums">${printProduct.price.toFixed(2)}</span>
                      </div>

                      <div 
                        dangerouslySetInnerHTML={{ __html: barcodeSvg.svgContent }}
                        className="w-full flex justify-center py-0.5"
                      />

                      <div className="w-full flex justify-between text-[9px] text-stone-600 font-mono px-1">
                        <span>{printProduct.sku}</span>
                        <span>{printProduct.category}</span>
                      </div>
                    </div>
                  );
                })}
                {labelCopies > 12 && (
                  <p className="text-[11px] text-stone-400 italic">
                    +{labelCopies - 12} more labels will print to the printer...
                  </p>
                )}
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e4ded5] dark:border-[#353943]">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Send to Mobile Printer ({labelCopies})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
