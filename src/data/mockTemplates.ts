import { PlanTemplate } from '../types/calendar';

export const INITIAL_TEMPLATES: PlanTemplate[] = [
  {
    id: 'tmpl-market',
    name: 'Pop-Up Market',
    emoji: '🎪',
    category: 'market',
    defaultTitle: 'Artisan Pop-Up Market Booth',
    defaultStartTime: '08:00',
    defaultEndTime: '16:00',
    defaultLocationName: 'Market Plaza Pavilion',
    assignedTo: 'her',
    defaultTasks: [
      'Load 10x10 canopy into car trunk',
      'Pack 4 heavy weight bags',
      'Charge Square terminal to 100%',
      'Prepare cash float ($100 in $5s and $1s)',
      'Assemble wooden tier display risers',
      'Hang branded banner and set QR sign'
    ],
    defaultNotes: '• Setup begins 1.5 hrs before public opening\n• Peak foot traffic 11am - 2pm',
    marketDetails: {
      boothFee: 120,
      targetRevenue: 850,
      boothNumber: 'B-14'
    }
  },
  {
    id: 'tmpl-date',
    name: 'Dinner Date',
    emoji: '🍽️',
    category: 'dinner_date',
    defaultTitle: 'Evening Dinner & Drinks',
    defaultStartTime: '18:30',
    defaultEndTime: '21:00',
    defaultLocationName: 'Favorite Bistro',
    assignedTo: 'both',
    defaultTasks: [
      'Confirm restaurant reservation',
      'Coordinate outfit & departure time',
      'Check parking or rideshare'
    ],
    defaultNotes: '• Celebrating a great week together'
  },
  {
    id: 'tmpl-repair',
    name: 'Home Repair',
    emoji: '🔨',
    category: 'maintenance',
    defaultTitle: 'Home Maintenance & Repairs',
    defaultStartTime: '10:30',
    defaultEndTime: '13:00',
    defaultLocationName: 'Apartment',
    assignedTo: 'him',
    defaultTasks: [
      'Pack Milwaukee drill & bit case from workshop',
      'Pick up replacement hardware from local store',
      'Inspect plumbing valve or mounting anchors',
      'Test and cleanup workspace'
    ],
    defaultNotes: '• Check stud spacing before drilling\n• Turn off shutoff valve if plumbing'
  },
  {
    id: 'tmpl-pets',
    name: 'Pet Care',
    emoji: '🐾',
    category: 'pets',
    defaultTitle: 'Pet Care, Walks & Vet Checkup',
    defaultStartTime: '08:30',
    defaultEndTime: '09:30',
    defaultLocationName: 'Neighborhood & Vet Clinic',
    assignedTo: 'both',
    defaultTasks: [
      'Morning walk and outdoor exercise',
      'Fresh water refill and morning feeding',
      'Administer daily vitamins / medication',
      'Brush coat & grooming check',
      'Restock pet food, treats & waste bags'
    ],
    defaultNotes: '• Vet emergency clinic contact saved in notes\n• Check medication refill schedule'
  },
  {
    id: 'tmpl-grocery',
    name: 'Groceries',
    emoji: '🛒',
    category: 'grocery_errand',
    defaultTitle: 'Weekly Market Prep Grocery Run',
    defaultStartTime: '10:00',
    defaultEndTime: '11:30',
    defaultLocationName: 'Trader Joe\'s / Local Co-Op',
    assignedTo: 'both',
    defaultTasks: [
      'Unsweetened almond milk (2 cartons)',
      'Cold brew batch beans',
      'Fresh produce & organic greens',
      'Sourdough loaf & eggs',
      'Snacks for pop-up shifts'
    ],
    defaultNotes: '• Bring reusable insulated cold bags'
  },
  {
    id: 'tmpl-other',
    name: 'Shared Outing',
    emoji: '☕',
    category: 'other',
    defaultTitle: 'Morning Coffee Walk & Planning',
    defaultStartTime: '09:00',
    defaultEndTime: '10:30',
    defaultLocationName: 'Neighborhood Cafe',
    assignedTo: 'both',
    defaultTasks: [
      'Review upcoming weekly calendar',
      'Sync pop-up supply inventory needs'
    ],
    defaultNotes: '• Relax and enjoy morning coffee together'
  }
];
