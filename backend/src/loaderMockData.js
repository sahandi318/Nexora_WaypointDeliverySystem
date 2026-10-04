function buildLoaderState() {
  return {
    depots: {
      peliyagoda: {
        key: "peliyagoda",
        label: "Peliyagoda DC",
        dock: "Dock 05",

        notice:
          "Dock 03 is reserved for refrigerated loads until 05:15",

        trips: [
          {
            id: "PEL-042",

            vehicle: "WP-RF-042",
            vehicleType:
              "Refrigerated truck",

            tripNumber: 1,

            route:
              "Colombo Central",

            status: "LOADING",

            priority: true,

            depart: "04:25",

            loadedWeight: 2380,
            capacityWeight: 3500,

            driver: {
              id: "DRV-017",
              name:
                "Ruwan Fernando",
            },

            loaderStatus:
              "LOADING",

            dispatcherPlanStatus:
              "PUBLISHED",

            handoverCompleted:
              false,

            verification: {
              count: true,
              secure: true,
              temperature: false,
              docs: true,
            },

            stops: [
              {
                id: "STOP-PEL-001",

                number: 1,

                name:
                  "Fresh Union Place",

                window:
                  "04:45–05:30",

                zone:
                  "Rear door",

                items: [
                  {
                    id: "milk",

                    name:
                      "Fresh milk 1L",

                    meta:
                      "Cold chain · CR-MILK-01",

                    quantity: 25,

                    unit:
                      "crates",

                    loaded: false,
                  },

                  {
                    id: "frozen",

                    name:
                      "Frozen food mixed",

                    meta:
                      "Frozen · FR-MIX-04",

                    quantity: 18,

                    unit:
                      "boxes",

                    loaded: true,
                  },

                  {
                    id: "yogurt",

                    name:
                      "Yogurt cups",

                    meta:
                      "Cold chain · CR-YOG-12",

                    quantity: 12,

                    unit:
                      "trays",

                    loaded: true,
                  },
                ],
              },

              {
                id: "STOP-PEL-002",

                number: 2,

                name:
                  "Fresh Bambalapitiya",

                window:
                  "05:20–06:15",

                zone:
                  "Middle bay",

                items: [
                  {
                    id: "vegetables",

                    name:
                      "Mixed vegetables",

                    meta:
                      "Fresh produce · PR-VEG-08",

                    quantity: 30,

                    unit:
                      "crates",

                    loaded: true,
                  },

                  {
                    id: "drygoods",

                    name:
                      "Dry groceries",

                    meta:
                      "Ambient · AM-DRY-21",

                    quantity: 45,

                    unit:
                      "boxes",

                    loaded: false,
                  },
                ],
              },

              {
                id: "STOP-PEL-003",

                number: 3,

                name:
                  "Tech Wellawatte",

                window:
                  "06:10–07:00",

                zone:
                  "Cab end",

                items: [
                  {
                    id: "televisions",

                    name:
                      "43-inch LED television",

                    meta:
                      "Fragile · High value",

                    quantity: 6,

                    unit:
                      "cartons",

                    loaded: false,
                  },
                ],
              },
            ],
          },

          {
            id: "PEL-018",

            vehicle:
              "WP-DB-018",

            vehicleType:
              "Dry-box truck",

            tripNumber: 1,

            route:
              "Negombo",

            status:
              "ISSUE",

            priority: false,

            depart:
              "04:50",

            loadedWeight:
              3240,

            capacityWeight:
              4000,

            driver: {
              id: "DRV-021",
              name:
                "Nimal Silva",
            },

            loaderStatus:
              "BLOCKED",

            dispatcherPlanStatus:
              "PUBLISHED",

            handoverCompleted:
              false,

            verification: {
              count: false,
              secure: false,
              temperature: false,
              docs: false,
            },

            stops: [],
          },

          {
            id: "PEL-033",

            vehicle:
              "WP-RV-033",

            vehicleType:
              "Refrigerated van",

            tripNumber: 2,

            route:
              "Wattala",

            status:
              "READY",

            priority: false,

            depart:
              "05:05",

            loadedWeight:
              910,

            capacityWeight:
              1200,

            driver: {
              id: "DRV-022",
              name:
                "Kasun Perera",
            },

            loaderStatus:
              "VEHICLE_READY",

            dispatcherPlanStatus:
              "PUBLISHED",

            handoverCompleted:
              false,

            verification: {
              count: true,
              secure: true,
              temperature: true,
              docs: true,
            },

            stops: [],
          },

          {
            id: "PEL-027",

            vehicle:
              "WP-DB-027",

            vehicleType:
              "Dry-box truck",

            tripNumber: 1,

            route:
              "Gampaha",

            status:
              "WAITING",

            priority: false,

            depart:
              "05:20",

            loadedWeight:
              0,

            capacityWeight:
              4500,

            driver: null,

            loaderStatus:
              "NOT_STARTED",

            dispatcherPlanStatus:
              "PUBLISHED",

            handoverCompleted:
              false,

            verification: {
              count: false,
              secure: false,
              temperature: false,
              docs: false,
            },

            stops: [],
          },
        ],
      },

      kandy: {
        key:
          "kandy",

        label:
          "Kandy Hub",

        dock:
          "Dock 02",

        notice:
          "Use Dock 02 for hill-country refrigerated runs",

        trips: [
          {
            id:
              "KDY-008",

            vehicle:
              "WP-RV-008",

            vehicleType:
              "Refrigerated van",

            tripNumber:
              1,

            route:
              "Peradeniya · Gelioya",

            status:
              "LOADING",

            priority:
              true,

            depart:
              "05:10",

            loadedWeight:
              520,

            capacityWeight:
              1200,

            driver: {
              id:
                "DRV-030",

              name:
                "Ishara Silva",
            },

            loaderStatus:
              "LOADING",

            dispatcherPlanStatus:
              "PUBLISHED",

            handoverCompleted:
              false,

            verification: {
              count: false,
              secure: false,
              temperature: false,
              docs: false,
            },

            stops: [
              {
                id:
                  "STOP-KDY-001",

                number:
                  1,

                name:
                  "Fresh Peradeniya",

                window:
                  "05:30–06:15",

                zone:
                  "Rear door",

                items: [
                  {
                    id:
                      "k-milk",

                    name:
                      "Fresh milk 1L",

                    meta:
                      "Cold chain",

                    quantity:
                      14,

                    unit:
                      "crates",

                    loaded:
                      false,
                  },

                  {
                    id:
                      "k-frozen",

                    name:
                      "Frozen food mixed",

                    meta:
                      "Frozen",

                    quantity:
                      9,

                    unit:
                      "boxes",

                    loaded:
                      false,
                  },
                ],
              },
            ],
          },
        ],
      },
    },

    issues: [],

    nextIssueId: 1,
  };
}

export let loaderState = buildLoaderState();

export function resetLoaderState() {
  loaderState = buildLoaderState();

  return loaderState;
}