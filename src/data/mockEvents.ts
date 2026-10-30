import { CalendarEvent, DayStayInfo } from '../types/calendar';

export const MOCK_STAYS: Record<string, DayStayInfo> = {
  '2026-11-01': { date: '2026-11-01', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-02': { date: '2026-11-02', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-03': { date: '2026-11-03', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-04': { date: '2026-11-04', stayAt: 'her_home', label: "Katherine's House", notes: "Night at Katherine's. Cozy autumn evening with dogs." },
  '2026-11-05': { date: '2026-11-05', stayAt: 'her_home', label: "Katherine's House", notes: "Night at Katherine's. Midweek dinner & project planning." },
  '2026-11-06': { date: '2026-11-06', stayAt: 'her_home', label: "Katherine's House", notes: "Night at Katherine's. Pre-market inventory packing." },
  '2026-11-07': { date: '2026-11-07', stayAt: 'his_home', label: "Dustin's House", notes: "Post-market stay at Dustin's. Evening dog walk at Katherine's at 9:30 PM." },
  '2026-11-08': { date: '2026-11-08', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-09': { date: '2026-11-09', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-10': { date: '2026-11-10', stayAt: 'her_home', label: "Katherine's House", notes: "Night at Katherine's." },
  '2026-11-11': { date: '2026-11-11', stayAt: 'her_home', label: "Katherine's House", notes: "Night at Katherine's. Veterans Day relax evening." },
  '2026-11-12': { date: '2026-11-12', stayAt: 'her_home', label: "Katherine's House", notes: "Night at Katherine's. Dog cuddle night." },
  '2026-11-13': { date: '2026-11-13', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-14': { date: '2026-11-14', stayAt: 'his_home', label: "Dustin's House", notes: "Post-market night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-15': { date: '2026-11-15', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-16': { date: '2026-11-16', stayAt: 'her_home', label: "Katherine's House", notes: "Night at Katherine's. Week start." },
  '2026-11-17': { date: '2026-11-17', stayAt: 'her_home', label: "Katherine's House", notes: "Night at Katherine's." },
  '2026-11-18': { date: '2026-11-18', stayAt: 'her_home', label: "Katherine's House", notes: "Night at Katherine's." },
  '2026-11-19': { date: '2026-11-19', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-20': { date: '2026-11-20', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-21': { date: '2026-11-21', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-22': { date: '2026-11-22', stayAt: 'his_home', label: "Dustin's House", notes: "Night at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-23': { date: '2026-11-23', stayAt: 'his_home', label: "Dustin's House", notes: "Thanksgiving week base at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-24': { date: '2026-11-24', stayAt: 'his_home', label: "Dustin's House", notes: "Thanksgiving prep base at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-25': { date: '2026-11-25', stayAt: 'his_home', label: "Dustin's House", notes: "Night before Thanksgiving at Dustin's. Walk Katherine's dogs at 9:30 PM." },
  '2026-11-26': { date: '2026-11-26', stayAt: 'his_home', label: "Dustin's House", notes: "Thanksgiving Host House! Evening dog walk at Katherine's at 9:30 PM." },
  '2026-11-27': { date: '2026-11-27', stayAt: 'her_home', label: "Katherine's House", notes: "Black Friday evening unwind at Katherine's." },
  '2026-11-28': { date: '2026-11-28', stayAt: 'her_home', label: "Katherine's House", notes: "Small Business Saturday post-market relax at Katherine's." },
  '2026-11-29': { date: '2026-11-29', stayAt: 'her_home', label: "Katherine's House", notes: "Sunday cozy night at Katherine's." },
  '2026-11-30': { date: '2026-11-30', stayAt: 'her_home', label: "Katherine's House", notes: "End of November at Katherine's. Review monthly reflection." },
};

export const INITIAL_EVENTS: CalendarEvent[] = [
  // ==========================================
  // SUNDAY NOV 1
  // ==========================================
  {
    id: 'evt-nov-01-craft',
    title: 'Ceramic Glazing & Kiln Prep',
    category: 'other',
    emoji: '🎨',
    startDate: '2026-11-01',
    startTime: '14:00',
    endTime: '17:00',
    locationName: "Katherine's Home Studio",
    assignedTo: 'both',
    notes: 'Glaze November holiday mugs, ceramic dishes, and kiln batching for upcoming market.',
    tasks: [
      { id: 't-1-1', title: 'Wipe down bisque pottery', completed: true, assignedTo: 'both' },
      { id: 't-1-2', title: 'Apply speckle glaze layers', completed: false, assignedTo: 'her' },
      { id: 't-1-3', title: 'Load kiln shelves & set schedule', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-01-dinner',
    title: 'Sunday Roast & Veggies (Cook Together)',
    category: 'dinner_date',
    emoji: '🍽️',
    startDate: '2026-11-01',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Kick off November with a warm pot roast, roasted baby carrots, and rosemary potatoes.',
    tasks: [
      { id: 't-1-4', title: 'Chop carrots, celery & rosemary', completed: true, assignedTo: 'her' },
      { id: 't-1-5', title: 'Sear chuck roast & set slow cooker', completed: true, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-01-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-01',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight — stop at Katherine's first to walk dogs and give bedtime treats.",
    tasks: [
      { id: 't-1-6', title: 'Evening neighborhood walk (20 min)', completed: false, assignedTo: 'both' },
      { id: 't-1-7', title: 'Fill water bowls & secure backyard gate', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // MONDAY NOV 2
  // ==========================================
  {
    id: 'evt-nov-02-kath-work',
    title: "Katherine's Morning Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-02',
    startTime: '06:00',
    endTime: '12:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    notes: 'Early 6-hour shift. Katherine off at noon.',
    tasks: [{ id: 't-2-1', title: 'Client order intake & packaging', completed: true, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-02-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-02',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    notes: 'Standard 9-5 workday.',
    tasks: [{ id: 't-2-2', title: 'Sprint planning meeting', completed: true, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-02-dinner',
    title: 'Homemade Margherita Pizza Night',
    category: 'dinner_date',
    emoji: '🍕',
    startDate: '2026-11-02',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Making fresh thin crust pizza with basil, fresh mozzarella, and tomato drizzle.',
    tasks: [
      { id: 't-2-3', title: 'Stretch pizza dough on peel', completed: false, assignedTo: 'him' },
      { id: 't-2-4', title: 'Tear fresh mozzarella & basil', completed: false, assignedTo: 'her' }
    ]
  },
  {
    id: 'evt-nov-02-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-02',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-2-5', title: 'Nighttime walk and give dog biscuits', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // TUESDAY NOV 3
  // ==========================================
  {
    id: 'evt-nov-03-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-03',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-3-1', title: 'Design system code review', completed: true, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-03-kath-work',
    title: "Katherine's Afternoon Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-03',
    startTime: '12:00',
    endTime: '18:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-3-2', title: 'Inventory count & customer pickups', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-03-dinner',
    title: 'Taco Tuesday & Fresh Guacamole',
    category: 'dinner_date',
    emoji: '🌮',
    startDate: '2026-11-03',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Warm corn tortillas, seasoned carne asada, fresh pico de gallo, and chips.',
    tasks: [
      { id: 't-3-3', title: 'Mash avocados & season guacamole', completed: false, assignedTo: 'her' },
      { id: 't-3-4', title: 'Grill flank steak on cast iron skillet', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-03-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-03',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog loop before sleep.",
    tasks: [{ id: 't-3-5', title: 'Dog walk & lock up', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // WEDNESDAY NOV 4 (Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-04-kath-work',
    title: "Katherine's Morning Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-04',
    startTime: '06:00',
    endTime: '12:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-4-1', title: 'Morning retail prep', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-04-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-04',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-4-2', title: 'Midweek team sync', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-04-dinner',
    title: 'Autumn Butternut Squash Soup & Sourdough',
    category: 'dinner_date',
    emoji: '🥣',
    startDate: '2026-11-04',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: "Staying at Katherine's tonight! Creamy roasted squash soup with warm sourdough bread.",
    tasks: [
      { id: 't-4-3', title: 'Blend roasted squash with coconut milk & nutmeg', completed: false, assignedTo: 'her' },
      { id: 't-4-4', title: 'Toast sourdough slices with garlic butter', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // THURSDAY NOV 5 (Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-05-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-05',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-5-1', title: 'Client release deployment', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-05-kath-work',
    title: "Katherine's Afternoon Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-05',
    startTime: '12:00',
    endTime: '18:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-5-2', title: 'Packaging studio orders', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-05-dinner',
    title: 'Stir-Fry Rice Noodles & Crispy Tofu',
    category: 'dinner_date',
    emoji: '🍜',
    startDate: '2026-11-05',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Quick wok-tossed pad thai noodles with crushed peanuts, lime, and crisp bok choy.',
    tasks: [
      { id: 't-5-3', title: 'Press and cube extra firm tofu', completed: false, assignedTo: 'him' },
      { id: 't-5-4', title: 'Whisk tamarind soy stir-fry sauce', completed: false, assignedTo: 'her' }
    ]
  },

  // ==========================================
  // FRIDAY NOV 6 (Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-06-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-06',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-6-1', title: 'Wrap week tickets & pull requests', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-06-prep',
    title: 'Market Table Display & Signage Crafting',
    category: 'other',
    emoji: '✂️',
    startDate: '2026-11-06',
    startTime: '13:00',
    endTime: '16:00',
    locationName: "Katherine's Living Room",
    assignedTo: 'both',
    notes: 'Katherine is off today. Building mini wood risers and printing price tags for tomorrow.',
    tasks: [
      { id: 't-6-2', title: 'Cut kraft paper price signage', completed: false, assignedTo: 'her' },
      { id: 't-6-3', title: 'Test barcode scanner on printed tags', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-06-dinner',
    title: 'Friday Date Night Pasta & Red Wine',
    category: 'dinner_date',
    emoji: '🍝',
    startDate: '2026-11-06',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Homemade pappardelle with slow-simmered mushroom ragu and fresh parmesan.',
    tasks: [
      { id: 't-6-4', title: 'Boil fresh pappardelle', completed: false, assignedTo: 'him' },
      { id: 't-6-5', title: 'Toss arugula salad with shaved pecorino', completed: false, assignedTo: 'her' }
    ]
  },

  // ==========================================
  // SATURDAY NOV 7 (Market Day & Gutter Chore · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-07-market',
    title: 'Autumn Harvest Makers Market Pop-up',
    category: 'market',
    emoji: '🎪',
    startDate: '2026-11-07',
    startTime: '09:00',
    endTime: '15:00',
    locationName: 'Riverfront Commons Plaza',
    address: '200 Riverfront Way',
    assignedTo: 'both',
    notes: 'First weekend market of November! Great foot traffic expected. Point of sale register ready.',
    marketDetails: {
      venueName: 'Riverfront Commons Plaza',
      boothFee: 65,
      boothNumber: 'B-14',
      targetRevenue: 450,
      actualRevenue: 412,
      inventory: [
        { productId: 'prod-001', name: 'Handcrafted Ceramic Speckled Mug', barcode: '890123456701', price: 28.00, category: 'Crafts', quantityPacked: 12, quantitySold: 8 },
        { productId: 'prod-002', name: 'Autumn Spiced Soy Candle (8oz)', barcode: '890123456702', price: 20.00, category: 'Candles', quantityPacked: 15, quantitySold: 9 },
        { productId: 'prod-003', name: 'Laser-Cut Walnut Wood Coaster (Set of 4)', barcode: '890123456703', price: 24.00, category: 'Woodwork', quantityPacked: 8, quantitySold: 4 }
      ]
    },
    tasks: [
      { id: 't-7-1', title: 'Pack canopy tent, folding tables & inventory bins', completed: true, assignedTo: 'both' },
      { id: 't-7-2', title: 'Set up POS tablet & test barcode scanner', completed: true, assignedTo: 'him' },
      { id: 't-7-3', title: 'Arrange table display & floral accents', completed: true, assignedTo: 'her' }
    ]
  },
  {
    id: 'evt-nov-07-chore',
    title: 'Gutter Clearing & Fall Leaf Clean-up',
    category: 'maintenance',
    emoji: '🍂',
    startDate: '2026-11-07',
    startTime: '16:30',
    endTime: '18:00',
    locationName: "Dustin's House",
    assignedTo: 'both',
    notes: 'Homeowner maintenance: Clear roof valleys and gutters before November rainstorms.',
    tasks: [
      { id: 't-7-4', title: 'Ladder safety check & clear gutter downspouts', completed: false, assignedTo: 'him' },
      { id: 't-7-5', title: 'Rake driveway and mulch flower beds with leaves', completed: false, assignedTo: 'her' }
    ]
  },
  {
    id: 'evt-nov-07-dinner',
    title: 'Post-Market Grilled Burgers & Fries',
    category: 'dinner_date',
    emoji: '🍔',
    startDate: '2026-11-07',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen & Patio",
    assignedTo: 'both',
    notes: 'Celebrating a great market day with brioche smash burgers and crispy seasoned fries.',
    tasks: [
      { id: 't-7-6', title: 'Air fry potato wedges', completed: false, assignedTo: 'her' },
      { id: 't-7-7', title: 'Grill smash patties on cast iron griddle', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-07-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-07',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Evening drive to Katherine's to take dogs on their night loop.",
    tasks: [{ id: 't-7-8', title: 'Walk dogs, refresh water, give bedtime treats', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // SUNDAY NOV 8 (Solo Projects & Stew · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-08-kath-craft',
    title: "Katherine's Fiber Art & Macrame Weaving",
    category: 'other',
    emoji: '🧶',
    startDate: '2026-11-08',
    startTime: '13:00',
    endTime: '15:30',
    locationName: "Katherine's Home Studio",
    assignedTo: 'her',
    notes: 'Katherine weaving modern wall hangings for holiday craft orders.',
    tasks: [{ id: 't-8-1', title: 'Measure organic cotton rope & driftwood', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-08-dust-project',
    title: "Dustin's 3D Print Prototype Tuning & Soldering",
    category: 'other',
    emoji: '🛠️',
    startDate: '2026-11-08',
    startTime: '15:30',
    endTime: '17:30',
    locationName: "Dustin's Workshop Garage",
    assignedTo: 'him',
    notes: 'Dustin testing custom LED lamp housings and calibrating bed level.',
    tasks: [{ id: 't-8-2', title: 'Assemble circuit board and test dimmer switch', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-08-dinner',
    title: 'Slow-Cooked Beef Stew Dinner',
    category: 'dinner_date',
    emoji: '🍲',
    startDate: '2026-11-08',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Simmered all afternoon with root vegetables, red wine, and crusty bread.',
    tasks: [
      { id: 't-8-3', title: 'Slice warm country bread and butter', completed: false, assignedTo: 'her' },
      { id: 't-8-4', title: 'Ladle stew into warmed bowls & garnish with parsley', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-08-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-08',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-8-5', title: 'Evening dog loop & secure house', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // MONDAY NOV 9
  // ==========================================
  {
    id: 'evt-nov-09-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-09',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-9-1', title: 'Design system sync & PR reviews', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-09-kath-work',
    title: "Katherine's Afternoon Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-09',
    startTime: '12:00',
    endTime: '18:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-9-2', title: 'Fulfill online shop orders', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-09-dinner',
    title: 'Sheet Pan Honey Dijon Salmon & Asparagus',
    category: 'dinner_date',
    emoji: '🐟',
    startDate: '2026-11-09',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Healthy weeknight sheet pan bake with honey dijon glaze, fingerling potatoes, and asparagus.',
    tasks: [
      { id: 't-9-3', title: 'Trim asparagus & toss with olive oil and sea salt', completed: false, assignedTo: 'her' },
      { id: 't-9-4', title: 'Glaze wild salmon fillets and set oven to 400°F', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-09-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-09',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog stroll at Katherine's house.",
    tasks: [{ id: 't-9-5', title: 'Walk dogs & night treats', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // TUESDAY NOV 10 (Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-10-kath-work',
    title: "Katherine's Morning Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-10',
    startTime: '06:00',
    endTime: '12:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-10-1', title: 'Open studio shop & window display', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-10-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-10',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-10-2', title: 'Core architecture refactor', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-10-dinner',
    title: 'Birria Tacos & Lime Cilantro Slaw',
    category: 'dinner_date',
    emoji: '🌮',
    startDate: '2026-11-10',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Crispy pan-fried corn tortillas dipped in savory consommé with melted oaxaca cheese.',
    tasks: [
      { id: 't-10-3', title: 'Shred cabbage and toss lime cilantro dressing', completed: false, assignedTo: 'her' },
      { id: 't-10-4', title: 'Sear quesabirria tacos on flat top skillet', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // WEDNESDAY NOV 11 (Veterans Day · Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-11-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-11',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-11-1', title: 'Design review & code sprint', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-11-kath-work',
    title: "Katherine's Afternoon Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-11',
    startTime: '12:00',
    endTime: '18:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-11-2', title: 'Holiday stock delivery check', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-11-dinner',
    title: 'Chicken Parmigiana & Caesar Salad',
    category: 'dinner_date',
    emoji: '🍗',
    startDate: '2026-11-11',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Crispy breaded chicken cutlets baked with marinara, fresh mozzarella, and a side of pasta.',
    tasks: [
      { id: 't-11-3', title: 'Toss romaine salad with croutons & homemade dressing', completed: false, assignedTo: 'her' },
      { id: 't-11-4', title: 'Bread chicken cutlets with panko & herbs', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // THURSDAY NOV 12 (Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-12-kath-work',
    title: "Katherine's Morning Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-12',
    startTime: '06:00',
    endTime: '12:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-12-1', title: 'Studio opening & custom orders', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-12-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-12',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-12-2', title: 'User testing analysis', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-12-dinner',
    title: 'Thai Coconut Curry & Jasmine Rice',
    category: 'dinner_date',
    emoji: '🍛',
    startDate: '2026-11-12',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Red curry broth with bell peppers, bamboo shoots, basil, and fluffy steamed jasmine rice.',
    tasks: [
      { id: 't-12-3', title: 'Chop red bell peppers and tear Thai basil', completed: false, assignedTo: 'her' },
      { id: 't-12-4', title: 'Rinse and steam jasmine rice', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // FRIDAY NOV 13 (Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-13-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-13',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-13-1', title: 'Friday code wrap-up', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-13-kath-work',
    title: "Katherine's Afternoon Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-13',
    startTime: '12:00',
    endTime: '18:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-13-2', title: 'Stocking craft supplies', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-13-dinner',
    title: 'Homemade Dumpling Folding & Feast',
    category: 'dinner_date',
    emoji: '🥟',
    startDate: '2026-11-13',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Fun cooking project together: folding pork and scallion potstickers and pan-crisping them.',
    tasks: [
      { id: 't-13-3', title: 'Mix ground pork, ginger, sesame oil & scallions', completed: false, assignedTo: 'her' },
      { id: 't-13-4', title: 'Pleat dumpling wrappers & steam crisp', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-13-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-13',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Evening drive to Katherine's to walk dogs and lock up.",
    tasks: [{ id: 't-13-5', title: 'Walk dogs and give bedtime treats', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // SATURDAY NOV 14 (Market & Hose Winterizing · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-14-market',
    title: 'Downtown Artisans Alley Craft Fair',
    category: 'market',
    emoji: '🎪',
    startDate: '2026-11-14',
    startTime: '10:00',
    endTime: '16:00',
    locationName: 'Old Town Historic Square',
    address: '150 Historic Main St',
    assignedTo: 'both',
    notes: 'Busy downtown foot traffic. Packed extra candles and laser woodwork gift sets.',
    marketDetails: {
      venueName: 'Old Town Historic Square',
      boothFee: 80,
      boothNumber: 'Booth 22',
      targetRevenue: 600,
      actualRevenue: 580,
      inventory: [
        { productId: 'prod-001', name: 'Handcrafted Ceramic Speckled Mug', barcode: '890123456701', price: 28.00, category: 'Crafts', quantityPacked: 15, quantitySold: 11 },
        { productId: 'prod-002', name: 'Autumn Spiced Soy Candle (8oz)', barcode: '890123456702', price: 20.00, category: 'Candles', quantityPacked: 18, quantitySold: 14 },
        { productId: 'prod-004', name: 'Botanical Linen Tea Towel (Set of 2)', barcode: '890123456704', price: 22.00, category: 'Textiles', quantityPacked: 10, quantitySold: 6 }
      ]
    },
    tasks: [
      { id: 't-14-1', title: 'Arrive at 8:30 AM for canopy setup', completed: true, assignedTo: 'both' },
      { id: 't-14-2', title: 'Set up square reader and display lights', completed: true, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-14-chore',
    title: 'Lawn Aeration & Seasonal Hose Bib Winterizing',
    category: 'maintenance',
    emoji: '🔧',
    startDate: '2026-11-14',
    startTime: '17:00',
    endTime: '18:30',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: 'Shut off exterior water valves and install insulated foam faucet covers before frost.',
    tasks: [
      { id: 't-14-3', title: 'Disconnect garden hoses and drain lines', completed: false, assignedTo: 'him' },
      { id: 't-14-4', title: 'Install insulated outdoor spigot covers', completed: false, assignedTo: 'her' }
    ]
  },
  {
    id: 'evt-nov-14-dinner',
    title: 'Weekend Steak & Mashed Potatoes',
    category: 'dinner_date',
    emoji: '🥩',
    startDate: '2026-11-14',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Pan-seared ribeye with garlic herb butter, creamy mashed yukon gold potatoes, and green beans.',
    tasks: [
      { id: 't-14-5', title: 'Peel and mash potatoes with heavy cream & butter', completed: false, assignedTo: 'her' },
      { id: 't-14-6', title: 'Sear steaks to medium-rare on cast iron', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-14-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-14',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-14-7', title: 'Walk dogs & check back porch lights', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // SUNDAY NOV 15 (Furnace Maintenance · Candle Pouring · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-15-maintenance',
    title: 'Furnace Filter & Smoke Detector Battery Test',
    category: 'maintenance',
    emoji: '🔥',
    startDate: '2026-11-15',
    startTime: '10:00',
    endTime: '11:30',
    locationName: "Dustin's House",
    assignedTo: 'him',
    notes: 'Replace MERV-11 HVAC air filter and test all ceiling alarms for winter readiness.',
    tasks: [
      { id: 't-15-1', title: 'Replace 20x25x1 furnace air filter', completed: false, assignedTo: 'him' },
      { id: 't-15-2', title: 'Test battery on upstairs smoke & CO detectors', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-15-candles',
    title: 'Handmade Scented Soy Candle Pouring',
    category: 'other',
    emoji: '🕯️',
    startDate: '2026-11-15',
    startTime: '13:30',
    endTime: '16:30',
    locationName: "Dustin's Workshop Garage",
    assignedTo: 'both',
    notes: 'Pouring winter scents for Thanksgiving and Black Friday markets (Balsam Fir, Warm Vanilla, Spiced Clove).',
    tasks: [
      { id: 't-15-3', title: 'Melt soy wax flakes to 185°F', completed: false, assignedTo: 'him' },
      { id: 't-15-4', title: 'Center cotton wicks in amber glass jars', completed: false, assignedTo: 'her' },
      { id: 't-15-5', title: 'Blend fragrance oils and pour smoothly', completed: false, assignedTo: 'both' }
    ]
  },
  {
    id: 'evt-nov-15-dinner',
    title: 'Chili Night & Cast Iron Cornbread',
    category: 'dinner_date',
    emoji: '🫘',
    startDate: '2026-11-15',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Hearty three-bean chili with cheddar, sour cream, and hot golden honey cornbread.',
    tasks: [
      { id: 't-15-6', title: 'Bake honey cornbread in hot cast iron skillet', completed: false, assignedTo: 'her' },
      { id: 't-15-7', title: 'Simmer chili and grate sharp cheddar cheese', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-15-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-15',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-15-8', title: 'Nighttime walk and water bowls', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // MONDAY NOV 16 (Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-16-kath-work',
    title: "Katherine's Morning Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-16',
    startTime: '06:00',
    endTime: '12:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-16-1', title: 'Morning retail stocking', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-16-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-16',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-16-2', title: 'Weekly architecture sync', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-16-dinner',
    title: 'Creamy Tuscan Garlic Chicken',
    category: 'dinner_date',
    emoji: '🍗',
    startDate: '2026-11-16',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: "Staying at Katherine's tonight. Pan-seared chicken in garlic cream with sun-dried tomatoes and spinach.",
    tasks: [
      { id: 't-16-3', title: 'Sauté baby spinach and sun-dried tomatoes', completed: false, assignedTo: 'her' },
      { id: 't-16-4', title: 'Sear seasoned chicken breasts in olive oil', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // TUESDAY NOV 17 (Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-17-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-17',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-17-1', title: 'Code reviews & product grooming', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-17-kath-work',
    title: "Katherine's Afternoon Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-17',
    startTime: '12:00',
    endTime: '18:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-17-2', title: 'Custom calligraphy packaging', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-17-dinner',
    title: 'Baja Fish Tacos & Cilantro Lime Rice',
    category: 'dinner_date',
    emoji: '🌮',
    startDate: '2026-11-17',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Crispy cod fillets, shredded purple cabbage, spicy chipotle crema, and warm corn tortillas.',
    tasks: [
      { id: 't-17-3', title: 'Mix chipotle lime crema dressing', completed: false, assignedTo: 'her' },
      { id: 't-17-4', title: 'Pan crisp battered cod fillets', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // WEDNESDAY NOV 18 (Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-18-kath-work',
    title: "Katherine's Morning Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-18',
    startTime: '06:00',
    endTime: '12:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-18-1', title: 'Morning packaging workflow', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-18-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-18',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-18-2', title: 'Frontend performance testing', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-18-dinner',
    title: 'Spaghetti Bolognese with Garlic Bread',
    category: 'dinner_date',
    emoji: '🍝',
    startDate: '2026-11-18',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Classic rich meat sauce simmered with San Marzano tomatoes, oregano, and garlic baguette.',
    tasks: [
      { id: 't-18-3', title: 'Butter and toast baguette with minced garlic & parsley', completed: false, assignedTo: 'her' },
      { id: 't-18-4', title: 'Simmer ground beef and pork meat sauce', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // THURSDAY NOV 19 (Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-19-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-19',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-19-1', title: 'Production release checklist', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-19-kath-work',
    title: "Katherine's Afternoon Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-19',
    startTime: '12:00',
    endTime: '18:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-19-2', title: 'Holiday inventory intake', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-19-dinner',
    title: 'Teriyaki Chicken Bowls & Steamed Broccoli',
    category: 'dinner_date',
    emoji: '🍚',
    startDate: '2026-11-19',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Glazed grilled chicken thigh slices over brown rice with broccoli florets and sesame seeds.',
    tasks: [
      { id: 't-19-3', title: 'Steam broccoli florets until bright green', completed: false, assignedTo: 'her' },
      { id: 't-19-4', title: 'Simmer teriyaki sauce with ginger and brown sugar', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-19-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-19',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog loop at Katherine's house.",
    tasks: [{ id: 't-19-5', title: 'Walk dogs & fresh water', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // FRIDAY NOV 20 (Katherine Solo Project · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-20-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-20',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-20-1', title: 'Friday engineering retrospective', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-20-kath-craft',
    title: "Katherine's Jewelry Wire Wrapping & Tagging",
    category: 'other',
    emoji: '💍',
    startDate: '2026-11-20',
    startTime: '13:00',
    endTime: '16:00',
    locationName: "Katherine's Home Studio",
    assignedTo: 'her',
    notes: 'Katherine wrapping sea glass pendants and barcode tagging for the weekend fair.',
    tasks: [{ id: 't-20-2', title: 'Wire wrap 10 quartz pendants and attach display cards', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-20-dinner',
    title: 'Friday Flatbread & Charcuterie Board',
    category: 'dinner_date',
    emoji: '🧀',
    startDate: '2026-11-20',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Living Room",
    assignedTo: 'both',
    notes: 'Crispy fig and prosciutto flatbread with aged manchego, olives, and toasted walnuts.',
    tasks: [
      { id: 't-20-3', title: 'Slice cheeses and arrange board with grapes & figs', completed: false, assignedTo: 'her' },
      { id: 't-20-4', title: 'Bake flatbreads with balsamic reduction glaze', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-20-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-20',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-20-5', title: 'Evening dog loop & security check', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // SATURDAY NOV 21 (Storm Windows & Ornaments · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-21-chore',
    title: 'Storm Windows Check & Weatherstripping',
    category: 'maintenance',
    emoji: '🪟',
    startDate: '2026-11-21',
    startTime: '10:00',
    endTime: '11:30',
    locationName: "Dustin's House",
    assignedTo: 'both',
    notes: 'Inspect window seals, apply foam weatherstripping, and close crawlspace foundation vents.',
    tasks: [
      { id: 't-21-1', title: 'Seal window drafts in living room & north bedroom', completed: false, assignedTo: 'him' },
      { id: 't-21-2', title: 'Check thermal curtains and door draft stoppers', completed: false, assignedTo: 'her' }
    ]
  },
  {
    id: 'evt-nov-21-ornaments',
    title: 'Holiday Wooden Ornaments Laser & Painting',
    category: 'other',
    emoji: '🎄',
    startDate: '2026-11-21',
    startTime: '14:00',
    endTime: '17:00',
    locationName: "Dustin's Workshop Garage",
    assignedTo: 'both',
    notes: 'Joint craft project: laser cutting birch plywood snowflake ornaments and hand-painting metallic accents.',
    tasks: [
      { id: 't-21-3', title: 'Laser cut 40 birch ornament blanks', completed: false, assignedTo: 'him' },
      { id: 't-21-4', title: 'Hand-paint copper & gold highlights on wood', completed: false, assignedTo: 'her' },
      { id: 't-21-5', title: 'Thread twine hanging loops and barcode pack', completed: false, assignedTo: 'both' }
    ]
  },
  {
    id: 'evt-nov-21-dinner',
    title: 'Smoked Pulled Pork & Homemade Coleslaw',
    category: 'dinner_date',
    emoji: '🍖',
    startDate: '2026-11-21',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Slow-smoked pork shoulder with tangy Carolina barbecue sauce on toasted brioche.',
    tasks: [
      { id: 't-21-6', title: 'Toss shredded cabbage with apple cider vinaigrette', completed: false, assignedTo: 'her' },
      { id: 't-21-7', title: 'Shred tender smoked pork and warm barbecue sauce', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-21-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-21',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-21-8', title: 'Night walk & treats', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // SUNDAY NOV 22 (Market Pop-up · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-22-market',
    title: 'Holiday Preview Makers Market',
    category: 'market',
    emoji: '🎪',
    startDate: '2026-11-22',
    startTime: '11:00',
    endTime: '16:00',
    locationName: 'Pine Grove Community Hall',
    address: '45 Pine Grove Ave',
    assignedTo: 'both',
    notes: 'Pre-Thanksgiving holiday market! Selling candles, wooden ornaments, and ceramic bowls.',
    marketDetails: {
      venueName: 'Pine Grove Community Hall',
      boothFee: 75,
      boothNumber: 'Table 8',
      targetRevenue: 550,
      actualRevenue: 520,
      inventory: [
        { productId: 'prod-002', name: 'Autumn Spiced Soy Candle (8oz)', barcode: '890123456702', price: 20.00, category: 'Candles', quantityPacked: 20, quantitySold: 16 },
        { productId: 'prod-003', name: 'Laser-Cut Walnut Wood Coaster (Set of 4)', barcode: '890123456703', price: 24.00, category: 'Woodwork', quantityPacked: 12, quantitySold: 8 },
        { productId: 'prod-005', name: 'Handcrafted Wooden Ornament (Set of 3)', barcode: '890123456705', price: 18.00, category: 'Holiday', quantityPacked: 15, quantitySold: 11 }
      ]
    },
    tasks: [
      { id: 't-22-1', title: 'Load inventory and setup card reader by 10:15 AM', completed: true, assignedTo: 'both' },
      { id: 't-22-2', title: 'Track sales on POS register', completed: true, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-22-dinner',
    title: 'Cozy French Onion Soup Night',
    category: 'dinner_date',
    emoji: '🍲',
    startDate: '2026-11-22',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Slow-caramelized yellow onions in rich beef stock with broiled gruyère sourdough croutons.',
    tasks: [
      { id: 't-22-3', title: 'Slice onions and caramelize slowly in butter', completed: false, assignedTo: 'her' },
      { id: 't-22-4', title: 'Top bowls with toasted sourdough and broil gruyère', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-22-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-22',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-22-5', title: 'Dog walk & lock up', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // MONDAY NOV 23 (Thanksgiving Week Kickoff · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-23-kath-work',
    title: "Katherine's Morning Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-23',
    startTime: '06:00',
    endTime: '12:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-23-1', title: 'Pre-holiday customer shipments', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-23-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-23',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-23-2', title: 'Freeze deploys for holiday week', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-23-dinner',
    title: 'Turkey Pot Pie & Crisp Apple Salad',
    category: 'dinner_date',
    emoji: '🥧',
    startDate: '2026-11-23',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Flaky golden puff pastry over tender turkey, peas, carrots, and savory thyme gravy.',
    tasks: [
      { id: 't-23-3', title: 'Slice honeycrisp apples and toss salad', completed: false, assignedTo: 'her' },
      { id: 't-23-4', title: 'Egg wash puff pastry crust and bake at 400°F', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-23-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-23',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-23-5', title: 'Night walk & treats', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // TUESDAY NOV 24 (Thanksgiving Bulk Shopping · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-24-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-24',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-24-1', title: 'Final sprint wrap before Thanksgiving', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-24-kath-work',
    title: "Katherine's Afternoon Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-24',
    startTime: '12:00',
    endTime: '17:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    notes: 'Shorted 5-hr shift so we can hit the grocery stores before crowds peak.',
    tasks: [{ id: 't-24-2', title: 'Early clock out for holiday groceries', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-24-grocery',
    title: "Thanksgiving Bulk Grocery Run (Costco & Trader Joe's)",
    category: 'grocery_errand',
    emoji: '🛒',
    startDate: '2026-11-24',
    startTime: '17:30',
    endTime: '19:00',
    locationName: 'Costco & Local Produce Market',
    assignedTo: 'both',
    notes: 'Major grocery trip for Thursday Thanksgiving dinner! Turkey, fresh herbs, butter, cream, and pies.',
    tasks: [
      { id: 't-24-3', title: 'Pick up 16lb fresh pasture-raised turkey', completed: false, assignedTo: 'him' },
      { id: 't-24-4', title: 'Grab cranberries, sweet potatoes, green beans & celery', completed: false, assignedTo: 'her' },
      { id: 't-24-5', title: 'Pick up unsalted butter (4 packs), heavy cream, pecans', completed: false, assignedTo: 'both' }
    ]
  },
  {
    id: 'evt-nov-24-dinner',
    title: 'Quick Grilled Cheese & Tomato Bisque',
    category: 'dinner_date',
    emoji: '🧀',
    startDate: '2026-11-24',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Fast comfort meal after grocery shopping: sourdough cheddar melt with warm creamy tomato soup.',
    tasks: [
      { id: 't-24-6', title: 'Grill sourdough sandwiches with sharp cheddar & gruyère', completed: false, assignedTo: 'him' },
      { id: 't-24-7', title: 'Warm tomato soup and unpack Thanksgiving groceries', completed: false, assignedTo: 'her' }
    ]
  },
  {
    id: 'evt-nov-24-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-24',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-24-8', title: 'Dog walk & lock up', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // WEDNESDAY NOV 25 (Thanksgiving Pie Baking & Brine Prep · Stay at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-25-kath-work',
    title: "Katherine's Morning Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-25',
    startTime: '06:00',
    endTime: '12:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    notes: 'Last shift before 4-day holiday weekend!',
    tasks: [{ id: 't-25-1', title: 'Close studio for Thanksgiving break', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-25-dust-work',
    title: "Dustin's Work Day (Half Day)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-25',
    startTime: '09:00',
    endTime: '14:00',
    locationName: 'Remote',
    assignedTo: 'him',
    notes: 'Clocking out early at 2 PM to start Thanksgiving kitchen prep.',
    tasks: [{ id: 't-25-2', title: 'Set out of office notification', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-25-cleaning',
    title: 'Deep House Cleaning & Thanksgiving Table Setup',
    category: 'maintenance',
    emoji: '🧹',
    startDate: '2026-11-25',
    startTime: '15:30',
    endTime: '17:30',
    locationName: "Dustin's House",
    assignedTo: 'both',
    notes: 'Dustin hosting Thanksgiving dinner tomorrow! Cleaning living room, polishing dining table, ironing napkins.',
    tasks: [
      { id: 't-25-3', title: 'Vacuum rugs and mop hardwood dining floor', completed: false, assignedTo: 'him' },
      { id: 't-25-4', title: 'Iron linen napkins & arrange autumn centerpiece with mini pumpkins', completed: false, assignedTo: 'her' }
    ]
  },
  {
    id: 'evt-nov-25-dinner',
    title: 'Pre-Thanksgiving Pasta & Kitchen Pie Baking',
    category: 'dinner_date',
    emoji: '🥧',
    startDate: '2026-11-25',
    startTime: '19:00',
    endTime: '20:30',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'Light garlic pasta for dinner while baking spiced pumpkin pie and pecan pie together.',
    tasks: [
      { id: 't-25-5', title: 'Roll out buttery pie dough & blind bake crusts', completed: false, assignedTo: 'her' },
      { id: 't-25-6', title: 'Submerge turkey in herb citrus brine bath in cooler', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-25-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-25',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight. Bedtime dog walk at Katherine's house.",
    tasks: [{ id: 't-25-7', title: 'Evening walk & lock up', completed: false, assignedTo: 'both' }]
  },

  // ==========================================
  // THURSDAY NOV 26 (THANKSGIVING DAY · Host at Dustin's)
  // ==========================================
  {
    id: 'evt-nov-26-cooking',
    title: 'Thanksgiving Turkey Roasting & Side Dishes',
    category: 'dinner_date',
    emoji: '🦃',
    startDate: '2026-11-26',
    startTime: '08:30',
    endTime: '12:30',
    locationName: "Dustin's Kitchen",
    assignedTo: 'both',
    notes: 'The big cooking day! Herb butter rubbed turkey in the oven, cranberry orange relish, and savory stuffing.',
    tasks: [
      { id: 't-26-1', title: 'Pat turkey dry, rub herb garlic butter under skin, into oven at 9:00 AM', completed: false, assignedTo: 'him' },
      { id: 't-26-2', title: 'Simmer fresh cranberry sauce with orange zest and cinnamon', completed: false, assignedTo: 'her' },
      { id: 't-26-3', title: 'Bake sourdough herb stuffing and sweet potato casserole with toasted marshmallows', completed: false, assignedTo: 'both' }
    ]
  },
  {
    id: 'evt-nov-26-feast',
    title: 'Host Family Thanksgiving Dinner & Celebration',
    category: 'dinner_date',
    emoji: '🍁',
    startDate: '2026-11-26',
    startTime: '13:00',
    endTime: '18:00',
    locationName: "Dustin's House",
    assignedTo: 'both',
    notes: 'Hosting Thanksgiving! Families arrive, toast with spiced apple cider, feast, and enjoy pumpkin pie together.',
    tasks: [
      { id: 't-26-4', title: 'Welcome families & pour warm spiced cider', completed: false, assignedTo: 'both' },
      { id: 't-26-5', title: 'Carve roasted golden turkey & make rich giblet pan gravy', completed: false, assignedTo: 'him' },
      { id: 't-26-6', title: 'Serve homemade pies with freshly whipped vanilla cream', completed: false, assignedTo: 'her' }
    ]
  },
  {
    id: 'evt-nov-26-walk',
    title: 'Post-Feast Family Stroll & Coffee',
    category: 'other',
    emoji: '☕',
    startDate: '2026-11-26',
    startTime: '18:30',
    endTime: '19:30',
    locationName: 'Neighborhood Park Loop',
    assignedTo: 'both',
    notes: 'Digestive autumn walk around the park with family, then hot coffee and leftover pie.',
    tasks: [{ id: 't-26-7', title: 'Wrap and package leftover containers for family', completed: false, assignedTo: 'both' }]
  },
  {
    id: 'evt-nov-26-dogs',
    title: "Let Katherine's Dogs Out & Night Walk",
    category: 'pets',
    emoji: '🐾',
    startDate: '2026-11-26',
    startTime: '21:30',
    endTime: '22:00',
    locationName: "Katherine's House",
    assignedTo: 'both',
    notes: "Staying at Dustin's tonight after hosting. Drive over to Katherine's for the dogs' post-feast bedtime walk.",
    tasks: [
      { id: 't-26-8', title: 'Nighttime walk with the dogs', completed: false, assignedTo: 'both' },
      { id: 't-26-9', title: 'Give dogs special turkey treats & check bowls', completed: false, assignedTo: 'her' }
    ]
  },

  // ==========================================
  // FRIDAY NOV 27 (Black Friday Makers Expo · Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-27-market',
    title: 'Black Friday Handmade Gift Expo',
    category: 'market',
    emoji: '🎪',
    startDate: '2026-11-27',
    startTime: '10:00',
    endTime: '17:00',
    locationName: 'City Center Exhibition Pavilion',
    address: '500 Center St',
    assignedTo: 'both',
    notes: 'Major holiday kickoff market! Huge crowd shopping for handmade holiday gifts. POS register fully loaded.',
    marketDetails: {
      venueName: 'City Center Exhibition Pavilion',
      boothFee: 120,
      boothNumber: 'Booth A-04',
      targetRevenue: 950,
      actualRevenue: 915,
      inventory: [
        { productId: 'prod-001', name: 'Handcrafted Ceramic Speckled Mug', barcode: '890123456701', price: 28.00, category: 'Crafts', quantityPacked: 24, quantitySold: 19 },
        { productId: 'prod-002', name: 'Autumn Spiced Soy Candle (8oz)', barcode: '890123456702', price: 20.00, category: 'Candles', quantityPacked: 30, quantitySold: 25 },
        { productId: 'prod-005', name: 'Handcrafted Wooden Ornament (Set of 3)', barcode: '890123456705', price: 18.00, category: 'Holiday', quantityPacked: 25, quantitySold: 20 },
        { productId: 'prod-003', name: 'Laser-Cut Walnut Wood Coaster (Set of 4)', barcode: '890123456703', price: 24.00, category: 'Woodwork', quantityPacked: 15, quantitySold: 12 }
      ]
    },
    tasks: [
      { id: 't-27-1', title: 'Arrive at 8:45 AM for pavilion check-in', completed: true, assignedTo: 'both' },
      { id: 't-27-2', title: 'Restock candle displays and gift box ribbons', completed: true, assignedTo: 'her' },
      { id: 't-27-3', title: 'Barcode register checkout & receipt printer ready', completed: true, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-27-dinner',
    title: 'Thanksgiving Leftovers Gourmet Paninis',
    category: 'dinner_date',
    emoji: '🥪',
    startDate: '2026-11-27',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: "Staying at Katherine's tonight. Sourdough paninis with roasted turkey, cranberry sauce, melted brie, and stuffing.",
    tasks: [
      { id: 't-27-4', title: 'Assemble sourdough paninis with turkey, brie & cranberry', completed: false, assignedTo: 'her' },
      { id: 't-27-5', title: 'Press paninis on hot cast iron press until cheese melts', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // SATURDAY NOV 28 (Small Business Saturday Market · Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-28-market',
    title: 'Small Business Saturday Craft Market',
    category: 'market',
    emoji: '🎪',
    startDate: '2026-11-28',
    startTime: '09:30',
    endTime: '16:30',
    locationName: 'Town Green Pavilion',
    address: '100 Town Green',
    assignedTo: 'both',
    notes: 'Support local makers day! Selling out holiday ceramic sets and gift bundles.',
    marketDetails: {
      venueName: 'Town Green Pavilion',
      boothFee: 90,
      boothNumber: 'Spot 12',
      targetRevenue: 750,
      actualRevenue: 720,
      inventory: [
        { productId: 'prod-001', name: 'Handcrafted Ceramic Speckled Mug', barcode: '890123456701', price: 28.00, category: 'Crafts', quantityPacked: 18, quantitySold: 15 },
        { productId: 'prod-002', name: 'Autumn Spiced Soy Candle (8oz)', barcode: '890123456702', price: 20.00, category: 'Candles', quantityPacked: 22, quantitySold: 18 },
        { productId: 'prod-004', name: 'Botanical Linen Tea Towel (Set of 2)', barcode: '890123456704', price: 22.00, category: 'Textiles', quantityPacked: 12, quantitySold: 9 }
      ]
    },
    tasks: [
      { id: 't-28-1', title: 'Early setup & warm coffee at 8:30 AM', completed: true, assignedTo: 'both' },
      { id: 't-28-2', title: 'Run mobile register & wrap customer gift boxes', completed: true, assignedTo: 'both' }
    ]
  },
  {
    id: 'evt-nov-28-dinner',
    title: 'Wood-Fired Pizza Slices & Salad',
    category: 'dinner_date',
    emoji: '🍕',
    startDate: '2026-11-28',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Relaxing after two back-to-back markets! Crisp wood-fired pizza and fresh Italian chopped salad.',
    tasks: [
      { id: 't-28-3', title: 'Toss crisp Italian salad with pepperoncini and olives', completed: false, assignedTo: 'her' },
      { id: 't-28-4', title: 'Bake artisan pizza on preheated baking stone', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // SUNDAY NOV 29 (Winter Wreath Crafting · Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-29-wreath',
    title: 'Winter Evergreen Wreath Making Session',
    category: 'other',
    emoji: '🌿',
    startDate: '2026-11-29',
    startTime: '13:00',
    endTime: '16:00',
    locationName: "Katherine's Porch & Studio",
    assignedTo: 'both',
    notes: 'Crafting fresh noble fir and cedar holiday wreaths for both houses and family gifts.',
    tasks: [
      { id: 't-29-1', title: 'Bundle fresh cedar and fir sprigs with floral wire', completed: false, assignedTo: 'her' },
      { id: 't-29-2', title: 'Fasten pinecones, dried orange slices & velvet ribbons', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-29-dinner',
    title: "Sunday Shepherd's Pie & Spiced Apple Cider",
    category: 'dinner_date',
    emoji: '🥧',
    startDate: '2026-11-29',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Savory seasoned beef and veggies topped with piped golden-brown mashed potatoes.',
    tasks: [
      { id: 't-29-3', title: 'Pipe whipped potatoes over savory meat filling', completed: false, assignedTo: 'her' },
      { id: 't-29-4', title: 'Bake in oven at 375°F until bubbly and golden brown', completed: false, assignedTo: 'him' }
    ]
  },

  // ==========================================
  // MONDAY NOV 30 (Month-End Wrap · Stay at Katherine's)
  // ==========================================
  {
    id: 'evt-nov-30-dust-work',
    title: "Dustin's Work Day (Engineering & Design)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-30',
    startTime: '09:00',
    endTime: '17:00',
    locationName: 'Tech Office & Remote',
    assignedTo: 'him',
    tasks: [{ id: 't-30-1', title: 'Month-end engineering metrics review', completed: false, assignedTo: 'him' }]
  },
  {
    id: 'evt-nov-30-kath-work',
    title: "Katherine's Afternoon Shift (Studio)",
    category: 'other',
    emoji: '💼',
    startDate: '2026-11-30',
    startTime: '12:00',
    endTime: '18:00',
    locationName: 'Design Studio Downtown',
    assignedTo: 'her',
    tasks: [{ id: 't-30-2', title: 'December studio inventory planning', completed: false, assignedTo: 'her' }]
  },
  {
    id: 'evt-nov-30-dinner',
    title: 'End-of-Month Wild Mushroom Risotto',
    category: 'dinner_date',
    emoji: '🍚',
    startDate: '2026-11-30',
    startTime: '19:00',
    endTime: '20:00',
    locationName: "Katherine's Kitchen",
    assignedTo: 'both',
    notes: 'Creamy arborio rice with chanterelle mushrooms, white wine, parmesan, and fresh thyme.',
    tasks: [
      { id: 't-30-3', title: 'Sauté chanterelle and cremini mushrooms in butter', completed: false, assignedTo: 'her' },
      { id: 't-30-4', title: 'Stir warm vegetable broth into arborio rice gradually', completed: false, assignedTo: 'him' }
    ]
  },
  {
    id: 'evt-nov-30-reflection',
    title: 'November Monthly Schedule & Market Review',
    category: 'other',
    emoji: '✨',
    startDate: '2026-11-30',
    startTime: '20:30',
    endTime: '21:15',
    locationName: "Katherine's Living Room",
    assignedTo: 'both',
    notes: 'Review month stats in the Reflection Dashboard: markets revenue, dog walks, stays balance, and planning December!',
    tasks: [
      { id: 't-30-5', title: 'Tally total November market revenues & booth profit', completed: false, assignedTo: 'both' },
      { id: 't-30-6', title: 'Check night stays balance in Reflection view', completed: false, assignedTo: 'both' }
    ]
  }
];
