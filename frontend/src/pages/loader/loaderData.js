export const loaderDepots = {
  peliyagoda: {
    label: 'Peliyagoda DC',
    dock: 'Dock 05',
    notice: 'Dock 03 is reserved for refrigerated loads until 05:15.',
    trips: [
      { id: 'PEL-042', vehicle: 'WP-RF-042', type: 'Refrigerated truck', trip: 1, route: 'Colombo Central', stops: 3, status: 'LOADING', progress: 68, loaded: '2,380', capacity: '3,500 kg', depart: '04:25', note: '42 min', priority: true },
      { id: 'PEL-018', vehicle: 'WP-DB-018', type: 'Dry-box truck', trip: 1, route: 'Negombo', stops: 4, status: 'ISSUE', progress: 81, loaded: '3,240', capacity: '4,000 kg', depart: '04:50', note: 'Awaiting dispatcher' },
      { id: 'PEL-033', vehicle: 'WP-RV-033', type: 'Refrigerated van', trip: 2, route: 'Wattala', stops: 2, status: 'READY', progress: 100, loaded: '910', capacity: '1,200 kg', depart: '05:05', note: 'Driver assigned' },
      { id: 'PEL-027', vehicle: 'WP-DB-027', type: 'Dry-box truck', trip: 1, route: 'Gampaha', stops: 3, status: 'WAITING', progress: 0, loaded: '0', capacity: '4,500 kg', depart: '05:20', note: 'Dock 02' },
      { id: 'PEL-011', vehicle: 'WP-DB-011', type: 'Dry-box truck', trip: 2, route: 'Kalutara', stops: 3, status: 'READY', progress: 100, loaded: '3,790', capacity: '4,500 kg', depart: '05:40', note: 'Driver assigned' },
    ],
  },
  kandy: {
    label: 'Kandy Hub',
    dock: 'Dock 02',
    notice: 'Use Dock 02 for hill-country refrigerated runs.',
    trips: [
      { id: 'KDY-008', vehicle: 'WP-RV-008', type: 'Refrigerated van', trip: 1, route: 'Peradeniya · Gelioya', stops: 3, status: 'LOADING', progress: 44, loaded: '520', capacity: '1,200 kg', depart: '05:10', note: '55 min', priority: true },
      { id: 'KDY-021', vehicle: 'WP-DB-021', type: 'Dry-box truck', trip: 1, route: 'Matale', stops: 3, status: 'WAITING', progress: 0, loaded: '0', capacity: '4,000 kg', depart: '05:45', note: 'Dock 04' },
      { id: 'KDY-004', vehicle: 'WP-DB-004', type: 'Dry-box truck', trip: 2, route: 'Nuwara Eliya', stops: 2, status: 'READY', progress: 100, loaded: '2,820', capacity: '4,000 kg', depart: '06:00', note: 'Driver assigned' },
    ],
  },
};

export const loaderStops = {
  'PEL-042': [
    { number: 1, name: 'Fresh Union Place', window: '04:45–05:30', zone: 'Rear door', items: [
      { id: 'milk', name: 'Fresh milk 1L', meta: 'Cold chain · CR-MILK-01', qty: 25, unit: 'crates' },
      { id: 'frozen', name: 'Frozen food mixed', meta: 'Frozen · FR-MIX-04', qty: 18, unit: 'boxes' },
      { id: 'yogurt', name: 'Yogurt cups', meta: 'Cold chain · CR-YOG-12', qty: 12, unit: 'trays' },
    ]},
    { number: 2, name: 'Fresh Bambalapitiya', window: '05:20–06:15', zone: 'Middle bay', items: [
      { id: 'vegetables', name: 'Mixed vegetables', meta: 'Fresh produce · PR-VEG-08', qty: 30, unit: 'crates' },
      { id: 'drygoods', name: 'Dry groceries', meta: 'Ambient · AM-DRY-21', qty: 45, unit: 'boxes' },
    ]},
    { number: 3, name: 'Tech Wellawatte', window: '06:10–07:00', zone: 'Cab end', items: [
      { id: 'televisions', name: '43-inch LED television', meta: 'Fragile · High value', qty: 6, unit: 'cartons' },
    ]},
  ],
  'KDY-008': [
    { number: 1, name: 'Fresh Peradeniya', window: '05:30–06:15', zone: 'Rear door', items: [
      { id: 'k-milk', name: 'Fresh milk 1L', meta: 'Cold chain · CR-MILK-01', qty: 14, unit: 'crates' },
      { id: 'k-frozen', name: 'Frozen food mixed', meta: 'Frozen · FR-MIX-04', qty: 9, unit: 'boxes' },
    ]},
    { number: 2, name: 'Fresh Gelioya', window: '06:10–07:00', zone: 'Middle bay', items: [
      { id: 'k-yogurt', name: 'Yogurt cups', meta: 'Cold chain · CR-YOG-12', qty: 8, unit: 'trays' },
      { id: 'k-produce', name: 'Mixed vegetables', meta: 'Fresh produce · PR-VEG-08', qty: 18, unit: 'crates' },
    ]},
    { number: 3, name: 'Style Gampola', window: '07:00–08:00', zone: 'Cab end', items: [
      { id: 'k-garments', name: 'Hanging garments', meta: 'Keep upright · ST-HNG-02', qty: 22, unit: 'pieces' },
    ]},
  ],
};
