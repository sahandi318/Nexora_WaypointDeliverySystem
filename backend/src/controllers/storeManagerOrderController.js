import {
  StoreManagerOrderError,
  createStoreManagerOrder,
  getStoreManagerCatalogData,
  getStoreManagerOrderByCode,
  getStoreManagerOrderSetup,
  listStoreManagerOrders,
} from "../services/storeManagerOrderService.js";


// ============================================================
// ORDER SETUP / CUTOFF / AVAILABLE ORDER TYPES
// ============================================================

export async function getStoreManagerOrderSetupController(
  req,
  res
) {
  try {
    const setup =
      await getStoreManagerOrderSetup(
        req.storeManagerContext
      );

    return res
      .status(200)
      .json({
        success: true,

        data: {
          setup,
        },
      });
  } catch (error) {
    return handleOrderError(
      res,
      error,
      "Unable to load Store Manager order setup."
    );
  }
}


// ============================================================
// ADVANCED PRODUCT CATALOG
// ============================================================

export async function getStoreManagerCatalog(
  req,
  res
) {
  try {
    const data =
      await getStoreManagerCatalogData(
        req.storeManagerContext,
        req.query
      );

    return res
      .status(200)
      .json({
        success: true,

        data,
      });
  } catch (error) {
    return handleOrderError(
      res,
      error,
      "Unable to load the product catalog."
    );
  }
}


// ============================================================
// ORDERS LIST
// ============================================================

export async function getStoreManagerOrders(
  req,
  res
) {
  try {
    const orders =
      await listStoreManagerOrders(
        req.storeManagerContext
      );

    return res
      .status(200)
      .json({
        success: true,

        data: {
          orders,
        },
      });
  } catch (error) {
    return handleOrderError(
      res,
      error,
      "Unable to load Store Manager orders."
    );
  }
}


// ============================================================
// ORDER DETAILS
// ============================================================

export async function getStoreManagerOrder(
  req,
  res
) {
  try {
    const order =
      await getStoreManagerOrderByCode(
        req.storeManagerContext,
        req.params.orderCode
      );

    return res
      .status(200)
      .json({
        success: true,

        data: {
          order,
        },
      });
  } catch (error) {
    return handleOrderError(
      res,
      error,
      "Unable to load the order."
    );
  }
}


// ============================================================
// CREATE ORDER
// ============================================================

export async function postStoreManagerOrder(
  req,
  res
) {
  try {
    const result =
      await createStoreManagerOrder(
        req.storeManagerContext,
        req.body
      );

    return res
      .status(201)
      .json({
        success: true,

        data:
          result,
      });
  } catch (error) {
    return handleOrderError(
      res,
      error,
      "Unable to create the order."
    );
  }
}


// ============================================================
// ERROR RESPONSE
// ============================================================

function handleOrderError(
  res,
  error,
  fallbackMessage
) {
  if (
    error instanceof
    StoreManagerOrderError
  ) {
    return res
      .status(
        error.status
      )
      .json({
        success: false,

        code:
          error.code,

        message:
          error.message,
      });
  }

  console.error(
    "Store Manager order request failed:",
    error?.message ||
      error
  );

  return res
    .status(500)
    .json({
      success: false,

      code:
        "STORE_MANAGER_ORDER_INTERNAL_ERROR",

      message:
        fallbackMessage,
    });
}
