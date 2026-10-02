// Operational values below are derived from the organiser-provided General Data files.
// Exact outlet GPS coordinates are NOT present in outlets.csv. Coordinates used by the
// current Driver navigation demo are therefore isolated demo-only values.
const colomboPlanningReference = {
  roadClass: 'urban',
  freeFlowKmh: 30,
  depotToDistrictKm: 12,
  depotToDistrictFreeflowMin: 24,
  interStopKm: 4,
  interStopFreeflowMin: 8,
};

const demoOutletCoordinates = {
  OUT015: { latitude: 6.9344, longitude: 79.8428, source: 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA' },
  OUT019: { latitude: 6.9258, longitude: 79.8524, source: 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA' },
  OUT018: { latitude: 6.9187, longitude: 79.8554, source: 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA' },
  OUT016: { latitude: 6.9069, longitude: 79.8626, source: 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA' },
  OUT021: { latitude: 6.8998, longitude: 79.8532, source: 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA' },
  OUT024: { latitude: 6.8914, longitude: 79.8676, source: 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA' },
  OUT027: { latitude: 6.8829, longitude: 79.8798, source: 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA' },
  OUT030: { latitude: 6.8746, longitude: 79.8883, source: 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA' },
};

function buildInitialState() {
  return {
    user: {
      userId: 'USR-DRV-001',
      email: 'driver@nexora.test',
      username: 'driver',
      password: 'Nexora@123',
      role: 'DRIVER',
      name: 'Ruwan Fernando',
    },
    vehicle: {
      vehicleId: 'VEH015',
      type: 'Truck',
      temp: 'Ambient',
      depot: 'Peliyagoda',
    },

    // Today's trips. The labels shown to the Driver are NOT hard-coded in the UI.
    // They are derived in the API from shared operational states:
    // Dispatcher publishes a plan -> PLANNED
    // Loader marks the vehicle ready -> VEHICLE_READY
    // Driver starts work -> IN_PROGRESS
    trips: [
      {
        tripId: 'TRIP001',
        tripNumber: 1,
        brand: 'Style',
        district: 'Colombo',
        vehicleId: 'VEH015',
        timeLabel: '9:05 AM – 12:09 PM',
        dispatcherPlanStatus: 'PUBLISHED',
        loaderStatus: 'VEHICLE_READY',
        driverExecutionStatus: 'IN_PROGRESS',
        completedAt: null,
        stops: [
          {
            stopId: 'STOP001', position: 1, outletId: 'OUT015', orderId: 'ORD0009683', district: 'Colombo',
            windowOpen: '9:00 AM', windowClose: '11:00 AM', plannedArrival: '9:45 AM', arrivalTime: '9:45 AM',
            tempRequirement: 'Ambient', expectedUnits: 18, loadedUnits: 18, deliveredQuantity: 18,
            unloadingPoint: 'Rear Loading Dock', vehicleAccess: 'Normal access', mallWindow: null,
            mapsUrl: 'https://www.google.com/maps/search/?api=1&query=6.9344%2C79.8428',
            destination: demoOutletCoordinates.OUT015, planningReference: colomboPlanningReference, etaMinutes: 0, distanceKm: 0,
            status: 'completed', completed: true, outcome: 'DELIVERED_FULL',
            pod: { receiverName: 'Amal Silva', deliveryNote: 'Received in good condition.', photoName: 'pod-stop1.jpg' }, exception: null,
          },
          {
            stopId: 'STOP002', position: 2, outletId: 'OUT019', orderId: 'ORD0009684', district: 'Colombo',
            windowOpen: '9:00 AM', windowClose: '5:00 PM', plannedArrival: '10:20 AM', arrivalTime: '10:20 AM',
            tempRequirement: 'Ambient', expectedUnits: 16, loadedUnits: 16, deliveredQuantity: 16,
            unloadingPoint: 'Street Access', vehicleAccess: 'Normal access', mallWindow: null,
            mapsUrl: 'https://www.google.com/maps/search/?api=1&query=6.9258%2C79.8524',
            destination: demoOutletCoordinates.OUT019, planningReference: colomboPlanningReference, etaMinutes: 0, distanceKm: 0,
            status: 'completed', completed: true, outcome: 'DELIVERED_FULL',
            pod: { receiverName: 'Kamal Perera', deliveryNote: 'Received in good condition.', photoName: 'pod-stop2.jpg' }, exception: null,
          },
          {
            stopId: 'STOP003', position: 3, outletId: 'OUT018', orderId: 'ORD0009685', district: 'Colombo',
            windowOpen: '10:30 AM', windowClose: '12:30 PM', plannedArrival: '11:00 AM', arrivalTime: null,
            tempRequirement: 'Ambient', expectedUnits: 23, loadedUnits: 23, deliveredQuantity: null,
            unloadingPoint: 'Shared Mall Loading Bay', vehicleAccess: 'Mall Dock', mallWindow: '10:30 AM–12:30 PM',
            mapsUrl: 'https://www.google.com/maps/search/?api=1&query=6.9187%2C79.8554',
            destination: demoOutletCoordinates.OUT018, planningReference: colomboPlanningReference, etaMinutes: 22, distanceKm: 12,
            status: 'next', completed: false, outcome: null, pod: null, exception: null,
          },
          {
            stopId: 'STOP004', position: 4, outletId: 'OUT016', orderId: 'ORD0009686', district: 'Colombo',
            windowOpen: '8:00 AM', windowClose: '11:00 AM', plannedArrival: '11:40 AM', arrivalTime: null,
            tempRequirement: 'Ambient', expectedUnits: 14, loadedUnits: 14, deliveredQuantity: null,
            unloadingPoint: 'Rear Loading Dock', vehicleAccess: 'Normal access', mallWindow: null,
            mapsUrl: 'https://www.google.com/maps/search/?api=1&query=6.9069%2C79.8626',
            destination: demoOutletCoordinates.OUT016, planningReference: colomboPlanningReference, etaMinutes: 18, distanceKm: 8,
            status: 'pending', completed: false, outcome: null, pod: null, exception: null,
          },
        ],
      },
      {
        tripId: 'TRIP002',
        tripNumber: 2,
        brand: 'Style',
        district: 'Colombo',
        vehicleId: 'VEH015',
        timeLabel: 'Starts at 1:00 PM',
        dispatcherPlanStatus: 'PUBLISHED',
        loaderStatus: 'VEHICLE_READY',
        driverExecutionStatus: 'NOT_STARTED',
        completedAt: null,
        stops: [
          { stopId:'T2STOP001', position:1, outletId:'OUT021', orderId:'ORD0009690', district:'Colombo', windowOpen:'1:00 PM', windowClose:'3:00 PM', plannedArrival:'1:20 PM', arrivalTime:null, tempRequirement:'Ambient', expectedUnits:11, loadedUnits:11, deliveredQuantity:null, unloadingPoint:'Street Access', vehicleAccess:'Normal access', mallWindow:null, mapsUrl:'https://www.google.com/maps/search/?api=1&query=Colombo%2C%20Sri%20Lanka', destination:demoOutletCoordinates.OUT021, planningReference:colomboPlanningReference, etaMinutes:25, distanceKm:13, status:'pending', completed:false, outcome:null, pod:null, exception:null },
          { stopId:'T2STOP002', position:2, outletId:'OUT024', orderId:'ORD0009691', district:'Colombo', windowOpen:'1:30 PM', windowClose:'4:00 PM', plannedArrival:'2:10 PM', arrivalTime:null, tempRequirement:'Ambient', expectedUnits:19, loadedUnits:19, deliveredQuantity:null, unloadingPoint:'Mall Loading Bay', vehicleAccess:'Mall Dock', mallWindow:'1:30 PM–4:00 PM', mapsUrl:'https://www.google.com/maps/search/?api=1&query=Colombo%2C%20Sri%20Lanka', destination:demoOutletCoordinates.OUT024, planningReference:colomboPlanningReference, etaMinutes:30, distanceKm:16, status:'pending', completed:false, outcome:null, pod:null, exception:null },
          { stopId:'T2STOP003', position:3, outletId:'OUT027', orderId:'ORD0009692', district:'Colombo', windowOpen:'2:00 PM', windowClose:'5:00 PM', plannedArrival:'3:00 PM', arrivalTime:null, tempRequirement:'Ambient', expectedUnits:13, loadedUnits:13, deliveredQuantity:null, unloadingPoint:'Rear Loading Dock', vehicleAccess:'Normal access', mallWindow:null, mapsUrl:'https://www.google.com/maps/search/?api=1&query=Colombo%2C%20Sri%20Lanka', destination:demoOutletCoordinates.OUT027, planningReference:colomboPlanningReference, etaMinutes:35, distanceKm:17, status:'pending', completed:false, outcome:null, pod:null, exception:null },
          { stopId:'T2STOP004', position:4, outletId:'OUT030', orderId:'ORD0009693', district:'Colombo', windowOpen:'3:00 PM', windowClose:'6:00 PM', plannedArrival:'3:50 PM', arrivalTime:null, tempRequirement:'Ambient', expectedUnits:17, loadedUnits:17, deliveredQuantity:null, unloadingPoint:'Street Access', vehicleAccess:'Normal access', mallWindow:null, mapsUrl:'https://www.google.com/maps/search/?api=1&query=Colombo%2C%20Sri%20Lanka', destination:demoOutletCoordinates.OUT030, planningReference:colomboPlanningReference, etaMinutes:40, distanceKm:20, status:'pending', completed:false, outcome:null, pod:null, exception:null },
        ],
      },
    ],

    // Previous completed trip used by the bottom History button.
    historyTrips: [
      {
        tripId: 'TRIP000',
        tripNumber: 2,
        brand: 'Style',
        district: 'Colombo',
        vehicleId: 'VEH015',
        timeLabel: '8:10 AM – 11:48 AM',
        dispatcherPlanStatus: 'PUBLISHED',
        loaderStatus: 'VEHICLE_READY',
        driverExecutionStatus: 'COMPLETED',
        completedAt: '27 Sep 2026, 11:48 AM',
        isHistory: true,
        stops: [
          { stopId:'HSTOP001', position:1, outletId:'OUT008', orderId:'HORD001', district:'Colombo', windowOpen:'8:00 AM', windowClose:'10:00 AM', plannedArrival:'8:30 AM', arrivalTime:'8:27 AM', tempRequirement:'Ambient', expectedUnits:16, loadedUnits:16, deliveredQuantity:16, unloadingPoint:'Rear Loading Dock', vehicleAccess:'Normal access', mallWindow:null, mapsUrl:'https://www.google.com/maps/search/?api=1&query=Colombo%2C%20Sri%20Lanka', etaMinutes:0, distanceKm:0, status:'completed', completed:true, outcome:'DELIVERED_FULL', pod:{ receiverName:'S. Fernando', deliveryNote:'Received.', photoName:'history-1.jpg' }, exception:null },
          { stopId:'HSTOP002', position:2, outletId:'OUT011', orderId:'HORD002', district:'Colombo', windowOpen:'9:00 AM', windowClose:'11:00 AM', plannedArrival:'9:25 AM', arrivalTime:'9:31 AM', tempRequirement:'Ambient', expectedUnits:21, loadedUnits:21, deliveredQuantity:18, unloadingPoint:'Street Access', vehicleAccess:'Normal access', mallWindow:null, mapsUrl:'https://www.google.com/maps/search/?api=1&query=Colombo%2C%20Sri%20Lanka', etaMinutes:0, distanceKm:0, status:'completed', completed:true, outcome:'PARTIAL_DELIVERY', pod:{ receiverName:'N. Jayasinghe', deliveryNote:'18 units received.', photoName:'history-2.jpg' }, exception:{ outcome:'PARTIAL_DELIVERY', reason:'Quantity shortfall', notes:'3 units unavailable.', deliveredQuantity:18, photoName:null } },
          { stopId:'HSTOP003', position:3, outletId:'OUT014', orderId:'HORD003', district:'Colombo', windowOpen:'9:30 AM', windowClose:'12:00 PM', plannedArrival:'10:20 AM', arrivalTime:'10:15 AM', tempRequirement:'Ambient', expectedUnits:12, loadedUnits:12, deliveredQuantity:12, unloadingPoint:'Mall Loading Bay', vehicleAccess:'Mall Dock', mallWindow:'9:30 AM–12:00 PM', mapsUrl:'https://www.google.com/maps/search/?api=1&query=Colombo%2C%20Sri%20Lanka', etaMinutes:0, distanceKm:0, status:'completed', completed:true, outcome:'DELIVERED_FULL', pod:{ receiverName:'R. Silva', deliveryNote:'Received.', photoName:'history-3.jpg' }, exception:null },
          { stopId:'HSTOP004', position:4, outletId:'OUT017', orderId:'HORD004', district:'Colombo', windowOpen:'10:00 AM', windowClose:'1:00 PM', plannedArrival:'11:10 AM', arrivalTime:'11:06 AM', tempRequirement:'Ambient', expectedUnits:10, loadedUnits:10, deliveredQuantity:10, unloadingPoint:'Rear Loading Dock', vehicleAccess:'Normal access', mallWindow:null, mapsUrl:'https://www.google.com/maps/search/?api=1&query=Colombo%2C%20Sri%20Lanka', etaMinutes:0, distanceKm:0, status:'completed', completed:true, outcome:'DELIVERED_FULL', pod:{ receiverName:'D. Perera', deliveryNote:'Received.', photoName:'history-4.jpg' }, exception:null },
        ],
      },
    ],

    sync: {
      pendingCount: 0,
      lastSuccessfulSync: '11:18 AM',
      // null during the normal online scenario. The future offline/recovery
      // flow can set this object after queued records synchronize.
      recoveryNotification: null,
    },
  };
}

export let state = buildInitialState();
export function resetState() {
  state = buildInitialState();
  return state;
}
