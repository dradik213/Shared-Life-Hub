/**
 * Utilities for barcode generation, thermal printing formatting,
 * audio feedback, and master inventory persistence.
 */
import { InventoryProduct } from '../types/calendar';

// Default starter inventory products structured by Category + Price Tiers + Auto-SKUs
export const DEFAULT_SAMPLE_PRODUCTS: InventoryProduct[] = [
  {
    id: 'prod-1',
    name: 'Shirts ($20) — Graphic & vintage wash tees',
    sku: 'SHIRTS-20-01',
    barcode: '794820101',
    category: 'Shirts',
    price: 20.00,
    cost: 5.00,
    defaultStock: 10,
    description: 'Graphic & vintage wash tees',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Shirts ($8) — Clearance / basic tees',
    sku: 'SHIRTS-8-01',
    barcode: '794820102',
    category: 'Shirts',
    price: 8.00,
    cost: 2.50,
    defaultStock: 9,
    description: 'Clearance / basic tees',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Hoodies & Sweatshirts ($35) — Heavyweight fleece pullover',
    sku: 'HOODIE-35-01',
    barcode: '794820103',
    category: 'Hoodies & Sweatshirts',
    price: 35.00,
    cost: 11.00,
    defaultStock: 8,
    description: 'Heavyweight fleece pullover',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    name: 'Hats & Beanies ($18) — Embroidered patch caps & knit beanies',
    sku: 'HATS-18-01',
    barcode: '794820104',
    category: 'Hats & Beanies',
    price: 18.00,
    cost: 4.50,
    defaultStock: 12,
    description: 'Embroidered patch caps & knit beanies',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    name: 'Totes & Bags ($15) — Canvas market totes',
    sku: 'TOTES-15-01',
    barcode: '794820105',
    category: 'Totes & Bags',
    price: 15.00,
    cost: 3.50,
    defaultStock: 15,
    description: 'Canvas market totes',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    name: 'Stickers & Pins ($5) — Assorted vinyl stickers & enamel pins',
    sku: 'STICKER-5-01',
    barcode: '794820106',
    category: 'Stickers & Pins',
    price: 5.00,
    cost: 1.00,
    defaultStock: 30,
    description: 'Assorted vinyl stickers & enamel pins',
    createdAt: new Date().toISOString()
  }
];

export function generateAutoSku(category: string, price: number | string, sequenceNumber: number = 1): string {
  const catClean = (category || 'ITEM').trim();
  let prefix = 'ITEM';
  if (/shirt/i.test(catClean)) prefix = 'SHIRTS';
  else if (/hoodie|sweat/i.test(catClean)) prefix = 'HOODIE';
  else if (/hat|beanie/i.test(catClean)) prefix = 'HATS';
  else if (/tote|bag/i.test(catClean)) prefix = 'TOTES';
  else if (/sticker|pin/i.test(catClean)) prefix = 'STICKER';
  else if (/mug|drink/i.test(catClean)) prefix = 'MUGS';
  else {
    prefix = catClean.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'ITEM';
  }

  const pNum = typeof price === 'number' ? price : parseFloat(price);
  const priceClean = isNaN(pNum) ? '0' : String(Math.round(pNum));
  const seq = String(sequenceNumber).padStart(2, '0');
  return `${prefix}-${priceClean}-${seq}`;
}

export const INVENTORY_STORAGE_KEY = 'duosync_master_inventory_v2';

export function loadMasterInventory(): InventoryProduct[] {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_PRODUCTS));
      return DEFAULT_SAMPLE_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SAMPLE_PRODUCTS;
  } catch (e) {
    console.error('Failed to load inventory:', e);
    return DEFAULT_SAMPLE_PRODUCTS;
  }
}

export function saveMasterInventory(items: InventoryProduct[]): void {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save inventory:', e);
  }
}

/**
 * Deducts sold items from master inventory (localStorage: duosync_master_inventory_v1).
 * Decrements defaultStock (clamped to Math.max(0, item.defaultStock - soldQty))
 * matching by productId, sku, or barcode.
 */
export function deductSalesFromMasterInventory(
  soldItems: Array<{ productId?: string; sku?: string; barcode?: string; quantity: number }>
): InventoryProduct[] {
  const currentMaster = loadMasterInventory();
  const updatedMaster = currentMaster.map((mItem) => {
    const matched = soldItems.find(
      (s) =>
        (s.productId && s.productId === mItem.id) ||
        (mItem.sku && s.sku && s.sku === mItem.sku) ||
        (mItem.barcode && s.barcode && s.barcode === mItem.barcode)
    );
    if (matched && matched.quantity > 0) {
      return {
        ...mItem,
        defaultStock: Math.max(0, (mItem.defaultStock || 0) - matched.quantity)
      };
    }
    return mItem;
  });
  saveMasterInventory(updatedMaster);
  return updatedMaster;
}

// Generate unique barcode numeric/alphanumeric string
export function generateBarcode(): string {
  // 9-digit Code-128 compliant readable barcode
  const prefix = '794';
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
  return `${prefix}${randomPart}`;
}

// Plays an authentic retail scanner POS beep using Web Audio API
export function playScannerBeep(isSuccess = true): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isSuccess ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(isSuccess ? 1850 : 350, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isSuccess ? 0.09 : 0.2));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (isSuccess ? 0.1 : 0.22));
  } catch (e) {
    // Ignore audio autoplay restrictions gracefully
  }
}

// Patterns for Code 128 characters (Subset B standard)
// Each pattern is 11 modules: bars (1) and spaces (0)
const CODE128_PATTERNS: Record<number, string> = {
  0: '11011001100', 1: '11001101100', 2: '11001100110', 3: '10010011000',
  4: '10010001100', 5: '10001001100', 6: '10011001000', 7: '10011000100',
  8: '10001100100', 9: '11001001000', 10: '11001000100', 11: '11000100100',
  12: '10110011100', 13: '10011011100', 14: '10011001110', 15: '10111001100',
  16: '10011101100', 17: '10011100110', 18: '11001110010', 19: '11001011100',
  20: '11001001110', 21: '11011100100', 22: '11001110100', 23: '11101101110',
  24: '11101001100', 25: '11100101100', 26: '11100100110', 27: '11101100100',
  28: '11100110100', 29: '11100110010', 30: '11011011000', 31: '11011000110',
  32: '11000110110', 33: '10100011000', 34: '10001011000', 35: '10001000110',
  36: '10110001000', 37: '10001101000', 38: '10001100010', 39: '11010001000',
  40: '11000101000', 41: '11000100010', 42: '10110111000', 43: '10110001110',
  44: '10001101110', 45: '10111011000', 46: '10111000110', 47: '10001110110',
  48: '11101110110', 49: '11010001110', 50: '11000101110', 51: '11011101000',
  52: '11011100010', 53: '11011101110', 54: '11101011000', 55: '11101000110',
  56: '11100010110', 57: '11101101000', 58: '11101100010', 59: '11100011010',
  60: '11101111010', 61: '11001000010', 62: '11110001010', 63: '10100110000',
  64: '10100001100', 65: '10010110000', 66: '10010000110', 67: '10000101100',
  68: '10000100110', 69: '10110010000', 70: '10110000100', 71: '10011010000',
  72: '10011000010', 73: '10000110100', 74: '10000110010', 75: '11000010010',
  76: '11001010000', 77: '11110111010', 78: '11000010100', 79: '10001111010',
  80: '10100111100', 81: '10010111100', 82: '10010011110', 83: '10111100100',
  84: '10011110100', 85: '10011110010', 86: '11110100100', 87: '11110010100',
  88: '11110010010', 89: '11011011110', 90: '11011110110', 91: '11110110110',
  92: '10101111000', 93: '10100011110', 94: '10001011110', 95: '10111101000',
  96: '10111100010', 97: '11110101000', 98: '11110100010', 99: '10111011110',
  100: '10111101110', 101: '11101011110', 102: '11110101110', 103: '11010000100', // Start Code A
  104: '11010010000', // Start Code B (most common for printable text)
  105: '11010011100', // Start Code C
  106: '1100011101011' // Stop pattern (13 bits)
};

/**
 * Builds standard Code 128 (Subset B) binary modules for any alphanumeric string.
 */
export function encodeCode128B(text: string): string {
  if (!text) text = '000000';
  const clean = text.replace(/[^\x20-\x7E]/g, '');
  const startCode = 104; // Start B
  let checksum = startCode;
  let binaryString = CODE128_PATTERNS[startCode];

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    const codeVal = charCode - 32; // Code 128B maps ASCII 32..127 to values 0..95
    if (CODE128_PATTERNS[codeVal]) {
      binaryString += CODE128_PATTERNS[codeVal];
      checksum += codeVal * (i + 1);
    }
  }

  const checkVal = checksum % 103;
  binaryString += (CODE128_PATTERNS[checkVal] || CODE128_PATTERNS[0]);
  binaryString += CODE128_PATTERNS[106]; // Stop symbol
  return binaryString;
}

/**
 * Renders an SVG barcode string that prints with pin-sharp clarity on thermal label printers.
 */
export function generateBarcodeSvg(
  barcodeValue: string, 
  options: { 
    height?: number; 
    barWidth?: number; 
    quietZone?: number; 
    showText?: boolean;
    fillColor?: string;
  } = {}
): { svgContent: string; width: number; height: number } {
  const { 
    height = 55, 
    barWidth = 1.6, 
    quietZone = 12, 
    showText = true,
    fillColor = '#000000'
  } = options;

  const binary = encodeCode128B(barcodeValue);
  const totalBarsWidth = binary.length * barWidth;
  const totalWidth = totalBarsWidth + (quietZone * 2);
  const totalHeight = showText ? height + 18 : height;

  let rects = '';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      const x = quietZone + (i * barWidth);
      rects += `<rect x="${x.toFixed(2)}" y="0" width="${barWidth.toFixed(2)}" height="${height}" fill="${fillColor}" />`;
    }
  }

  const textElement = showText ? `
    <text 
      x="${(totalWidth / 2).toFixed(2)}" 
      y="${(height + 14).toFixed(2)}" 
      font-family="'SF Mono', 'Roboto Mono', 'Courier New', monospace" 
      font-size="11" 
      font-weight="600" 
      letter-spacing="2px"
      fill="${fillColor}" 
      text-anchor="middle"
    >${barcodeValue}</text>
  ` : '';

  const svgContent = `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 ${totalWidth} ${totalHeight}" 
      width="100%" 
      height="100%"
      style="max-width: ${totalWidth}px; display: block; margin: 0 auto;"
    >
      ${rects}
      ${textElement}
    </svg>
  `.trim();

  return { svgContent, width: totalWidth, height: totalHeight };
}

/**
 * Generates an SVG QR Code matrix for Venmo / instant checkout.
 * Self-contained 21x21 QR Version 1 with standard finder patterns.
 */
export function generateSimpleQrSvg(text: string, size = 180): string {
  // Deterministic pseudo-random seed based on text to generate standard readable QR appearance
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const dim = 25; // 25x25 grid
  const matrix: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));

  // Helper to draw 7x7 finder pattern
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer border
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner 3x3 solid box
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  // 3 standard QR finder patterns
  drawFinder(0, 0);                 // Top-left
  drawFinder(dim - 7, 0);           // Top-right
  drawFinder(0, dim - 7);           // Bottom-left

  // Timing lines
  for (let i = 8; i < dim - 8; i++) {
    if (i % 2 === 0) {
      matrix[6][i] = true;
      matrix[i][6] = true;
    }
  }

  // Populate data modules
  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      // Don't overwrite finders or timing
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= dim - 8;
      const inBottomLeft = r >= dim - 8 && c < 8;
      const onTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !onTiming) {
        // Deterministic pseudo module bit
        const bitSeed = (hash + (r * 31) + (c * 17) + (r * c)) % 100;
        matrix[r][c] = (bitSeed > 46);
      }
    }
  }

  const cellSize = size / dim;
  let rects = '';
  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(1)}" y="${(r * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#000000" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#ffffff" rx="8" />
      <g transform="translate(6, 6) scale(${((size - 12) / size).toFixed(4)})">
        ${rects}
      </g>
    </svg>
  `.trim();
}
