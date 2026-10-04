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
