export type EventCategory = 
  | 'market'        // Market Pop-Up (Short: Markets)
  | 'dinner_date'   // Dinner & Dates (Short: Dates)
  | 'maintenance'   // Housework & Repairs (Short: Repairs)
  | 'pets'          // Pets & Pet Care (Short: Pets)
  | 'grocery_errand'// Grocery & Errands (Short: Groceries)
  | 'other'         // Other Shared Plans (Short: Other)
  | 'packing';      // Kept for backward compatibility

export type StayLocation = 'her_home' | 'his_home' | 'our_home' | 'travel';

export interface EventTask {
  id: string;
  title: string;
  completed: boolean; // slider switch on/off
  assignedTo?: 'both' | 'him' | 'her';
}

export interface CalendarEvent {
  id: string;
  title: string;
  category: EventCategory;
  emoji?: string; // Customizable event emoji
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  locationName?: string;
  address?: string;
  assignedTo: 'both' | 'him' | 'her';
  description?: string;
  overnightLocation?: StayLocation;
  tasks: EventTask[]; // Specific event checklist tasks
  notes?: string;
  marketDetails?: {
    venueName?: string;
    boothFee?: number;
    boothNumber?: string;
    targetRevenue?: number;
    actualRevenue?: number;
    inventory?: MarketPackoutItem[];
    sales?: MarketSaleRecord[];
  };
  photoCount?: number;
  photos?: string[];
}

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  cost?: number;
  defaultStock: number;
  description?: string;
  createdAt: string;
}

export interface MarketPackoutItem {
  productId: string;
  name: string;
  barcode: string;
  price: number;
  category: string;
  quantityPacked: number;
  quantitySold: number;
}

export interface MarketSaleRecord {
  id: string;
  timestamp: string;
  items: Array<{
    productId: string;
    name: string;
    category?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'venmo';
  cashTendered?: number;
  changeDue?: number;
  customerNote?: string;
}

export type CalendarViewMode = 'month' | 'week' | 'agenda' | 'reflection' | 'admin';

export type EventSortOption = 'time' | 'category' | 'partner' | 'tasks';
export type SortDirection = 'none' | 'asc' | 'desc';

export interface PlanTemplate {
  id: string;
  name: string;
  emoji: string;
  category: EventCategory;
  defaultTitle: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultLocationName?: string;
  assignedTo: 'both' | 'him' | 'her';
  defaultTasks: string[];
  defaultNotes?: string;
  order?: number;
  marketDetails?: {
    boothFee?: number;
    targetRevenue?: number;
    boothNumber?: string;
  };
  createdBy?: string;
  createdAt?: string;
}

export interface DayStayInfo {
  date: string; // YYYY-MM-DD
  stayAt: StayLocation;
  label: string;
  notes?: string;
}
