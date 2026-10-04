import api from "./api";


// ============================================================
// STORE MANAGER CONTEXT
// ============================================================

/**
 * Loads the authenticated Store Manager's trusted operational
 * context from the backend.
 *
 * The backend determines:
 *
 * - authenticated user
 * - role
 * - assigned outlet
 * - depot
 *
 * The browser never supplies or selects these values.
 */
export async function getStoreManagerContext({
  signal,
} = {}) {
  const response =
    await api.get(
      "/store-manager/context",
      {
        signal,
      }
    );


  const responseData =
    response.data;


  if (
    !responseData?.success ||
    !responseData?.data
  ) {
    throw new Error(
      "The server returned an invalid Store Manager context response."
    );
  }


  return responseData.data;
}


// ============================================================
// STORE MANAGER ORDERS
// ============================================================

/**
 * Loads orders for the authenticated Store Manager's assigned
 * outlet.
 *
 * SECURITY:
 * The frontend does not send an outlet ID. The backend applies
 * outlet isolation from the authenticated Store Manager context.
 */
export async function getStoreManagerOrders({
  signal,
} = {}) {
  const response =
    await api.get(
      "/store-manager/orders",
      {
        signal,
      }
    );


  const responseData =
    response.data;


  if (
    !responseData?.success ||
    !Array.isArray(
      responseData?.data?.orders
    )
  ) {
    throw new Error(
      "The server returned an invalid Store Manager orders response."
    );
  }


  return responseData.data.orders;
}

// ============================================================
// STORE MANAGER ORDER DETAILS
// ============================================================

/**
 * Loads one order by its order code.
 *
 * The backend still applies outlet isolation, so a Store Manager
 * cannot read an order that belongs to another outlet.
 */
export async function getStoreManagerOrder({
  orderCode,
  signal,
} = {}) {
  const normalizedOrderCode =
    String(
      orderCode || ""
    )
      .trim()
      .toUpperCase();


  if (!normalizedOrderCode) {
    throw new Error(
      "A valid order code is required."
    );
  }


  const response =
    await api.get(
      `/store-manager/orders/${encodeURIComponent(
        normalizedOrderCode
      )}`,
      {
        signal,
      }
    );


  const responseData =
    response.data;


  if (
    !responseData?.success ||
    !responseData?.data?.order
  ) {
    throw new Error(
      "The server returned an invalid Store Manager order response."
    );
  }


  return responseData.data.order;
}

// ============================================================
// STORE MANAGER PRODUCT CATALOG
// ============================================================

/**
 * Loads the active product catalog used by the Store Manager
 * ordering workflow.
 *
 * No outlet ID is sent from the browser.
 */
export async function getStoreManagerCatalog({
  orderType,
  search = "",
  category = "ALL",
  page = 1,
  pageSize = 20,
  signal,
} = {}) {
  const params = {
    page,
    pageSize,
  };

  if (orderType) {
    params.orderType =
      orderType;
  }

  const normalizedSearch =
    String(
      search || ""
    ).trim();

  if (normalizedSearch) {
    params.search =
      normalizedSearch;
  }

  if (
    category &&
    category !==
      "ALL"
  ) {
    params.category =
      category;
  }

  const response =
    await api.get(
      "/store-manager/catalog",
      {
        params,
        signal,
      }
    );

  const responseData =
    response.data;

  if (
    !responseData?.success ||
    !Array.isArray(
      responseData?.data?.products
    ) ||
    !responseData?.data?.pagination
  ) {
    throw new Error(
      "The server returned an invalid Store Manager catalog response."
    );
  }

  return responseData.data;
}


// ============================================================
// CREATE STORE MANAGER ORDER
// ============================================================

/**
 * Submits an order for the authenticated Store Manager.
 *
 * SECURITY:
 * - no outlet ID is accepted from the UI
 * - no role/user ID is sent
 * - the backend applies the authenticated Store Manager context
 * - the backend makes the final 4 PM cutoff decision
 */
export async function createStoreManagerOrder({
  orderType,
  items,
  storeManagerNote = "",
} = {}) {
  if (!orderType) {
    throw new Error(
      "Order type is required."
    );
  }

  const response =
    await api.post(
      "/store-manager/orders",
      {
        orderType,
        items,
        storeManagerNote,
      }
    );

  const responseData =
    response.data;

  if (
    !responseData?.success ||
    !responseData?.data?.order
  ) {
    throw new Error(
      "The server returned an invalid Store Manager create-order response."
    );
  }

  return responseData.data;
}


// ============================================================
// STORE MANAGER ORDER SETUP / CUTOFF PREVIEW
// ============================================================

/**
 * Loads trusted order setup data from the backend.
 *
 * The server provides:
 * - authenticated outlet / brand
 * - assigned depot
 * - server time
 * - 16:00 cutoff
 * - remainingSeconds
 * - NEXT_RUN / FOLLOWING_RUN eligibility
 * - effective processing date
 *
 * The frontend uses remainingSeconds only for display.
 * Final cutoff enforcement still happens again on POST /orders.
 */
export async function getStoreManagerOrderSetup({
  signal,
} = {}) {
  const response =
    await api.get(
      "/store-manager/order-setup",
      {
        signal,
      }
    );


  const responseData =
    response.data;


  if (
    !responseData?.success ||
    !responseData?.data?.setup
  ) {
    throw new Error(
      "The server returned an invalid Store Manager order setup response."
    );
  }


  return responseData.data.setup;
}

// ============================================================
// STORE MANAGER DELIVERIES
// ============================================================

/**
 * Loads the delivery workspace for the authenticated Store Manager.
 *
 * SECURITY:
 * The browser does not send an outlet ID. The backend resolves the
 * Store Manager's trusted outlet from the authenticated database user.
 */
export async function getStoreManagerDeliveries({
  signal,
} = {}) {
  const response = await api.get(
    "/store-manager/deliveries",
    { signal }
  );

  const responseData = response.data;

  if (
    !responseData?.success ||
    !Array.isArray(responseData?.data?.deliveries)
  ) {
    throw new Error(
      "The server returned an invalid Store Manager deliveries response."
    );
  }

  return responseData.data.deliveries;
}

/**
 * Loads one outlet-isolated delivery by Store Order code.
 */
export async function getStoreManagerDelivery({
  orderCode,
  signal,
} = {}) {
  const normalizedOrderCode = String(orderCode || "")
    .trim()
    .toUpperCase();

  if (!normalizedOrderCode) {
    throw new Error("A valid order code is required.");
  }

  const response = await api.get(
    `/store-manager/deliveries/${encodeURIComponent(normalizedOrderCode)}`,
    { signal }
  );

  const responseData = response.data;

  if (
    !responseData?.success ||
    !responseData?.data?.delivery
  ) {
    throw new Error(
      "The server returned an invalid Store Manager delivery response."
    );
  }

  return responseData.data.delivery;
}

/**
 * Loads the privacy-filtered live tracking view for one Store Manager
 * delivery. The backend resolves the outlet from the authenticated user;
 * no outlet or room identifier is sent by the browser.
 */
export async function getStoreManagerDeliveryTracking({
  orderCode,
  signal,
} = {}) {
  const normalizedOrderCode = String(orderCode || "")
    .trim()
    .toUpperCase();

  if (!normalizedOrderCode) {
    throw new Error("A valid order code is required.");
  }

  const response = await api.get(
    `/store-manager/deliveries/${encodeURIComponent(normalizedOrderCode)}/tracking`,
    { signal }
  );

  const responseData = response.data;

  if (
    !responseData?.success ||
    !responseData?.data?.tracking
  ) {
    throw new Error(
      "The server returned an invalid Store Manager tracking response."
    );
  }

  return responseData.data.tracking;
}


/**
 * Confirms that the authenticated Store Manager has received a completed
 * delivery. Outlet isolation is enforced by the backend from the JWT user
 * context; the browser never sends an outlet identifier.
 */
export async function confirmStoreManagerDeliveryReceived({
  orderCode,
  acknowledgePartial = false,
  note = "",
} = {}) {
  const normalizedOrderCode = String(orderCode || "")
    .trim()
    .toUpperCase();

  if (!normalizedOrderCode) {
    throw new Error("A valid order code is required.");
  }

  const response = await api.post(
    `/store-manager/deliveries/${encodeURIComponent(normalizedOrderCode)}/confirm-received`,
    {
      acknowledgePartial: acknowledgePartial === true,
      note: String(note || "").trim(),
    }
  );

  const responseData = response.data;

  if (
    !responseData?.success ||
    !responseData?.data?.confirmation
  ) {
    throw new Error(
      "The server returned an invalid Store Manager receipt confirmation response."
    );
  }

  return responseData.data.confirmation;
}

// ============================================================
// STORE MANAGER ISSUES
// ============================================================

export async function getStoreManagerIssues({
  status = "ALL",
  signal,
} = {}) {
  const normalizedStatus = String(status || "ALL").trim().toUpperCase();
  const response = await api.get("/store-manager/issues", {
    params: {
      ...(normalizedStatus && normalizedStatus !== "ALL"
        ? { status: normalizedStatus }
        : {}),
    },
    signal,
  });

  const responseData = response.data;

  if (
    !responseData?.success ||
    !Array.isArray(responseData?.data?.issues) ||
    !responseData?.data?.summary
  ) {
    throw new Error(
      "The server returned an invalid Store Manager issues response."
    );
  }

  return responseData.data;
}

export async function createStoreManagerIssue({
  orderCode,
  category,
  description,
} = {}) {
  const normalizedOrderCode = String(orderCode || "").trim().toUpperCase();

  if (!normalizedOrderCode) {
    throw new Error("A valid order code is required.");
  }

  const response = await api.post("/store-manager/issues", {
    orderCode: normalizedOrderCode,
    category,
    description: String(description || "").trim(),
  });

  const responseData = response.data;

  if (!responseData?.success || !responseData?.data?.issue) {
    throw new Error(
      "The server returned an invalid Store Manager issue response."
    );
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("store-manager-issues-changed"));
  }

  return responseData.data.issue;
}

export async function resolveStoreManagerIssue({
  issueCode,
  resolutionNote = "",
} = {}) {
  const normalizedIssueCode = String(issueCode || "").trim().toUpperCase();

  if (!normalizedIssueCode) {
    throw new Error("A valid issue code is required.");
  }

  const response = await api.post(
    `/store-manager/issues/${encodeURIComponent(normalizedIssueCode)}/resolve`,
    {
      resolutionNote: String(resolutionNote || "").trim(),
    }
  );

  const responseData = response.data;

  if (!responseData?.success || !responseData?.data?.issue) {
    throw new Error(
      "The server returned an invalid Store Manager issue resolution response."
    );
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("store-manager-issues-changed"));
  }

  return responseData.data;
}
