import {
  randomUUID,
} from "node:crypto";

import prisma from "../config/database.js";

const COLOMBO_TIME_ZONE =
  "Asia/Colombo";

const CUTOFF_HOUR =
  16;

const CUTOFF_TIME =
  "16:00";

const COLOMBO_UTC_OFFSET =
  "+05:30";

const MAX_ORDER_ITEMS =
  100;

const MAX_QUANTITY_PER_ITEM =
  999;

const DEFAULT_PAGE_SIZE =
  20;

const MAX_PAGE_SIZE =
  20;

const MAX_SEARCH_LENGTH =
  100;

const MAX_STORE_MANAGER_NOTE_LENGTH =
  500;

const VALID_ORDER_TYPES =
  new Set([
    "AMBIENT_DRY",
    "CHILLED",
  ]);

const PRODUCT_PUBLIC_SELECT = {
  id: true,
  sku: true,
  name: true,
  manufacturerBrand: true,
  productType: true,
  category: true,
  handlingType: true,
  unitLabel: true,
  unitWeightKg: true,
  unitVolumeM3: true,
  imageData: true,
  imageMimeType: true,
  source: true,
};

const PRODUCT_SEARCH_SELECT = {
  id: true,
  sku: true,
  name: true,
  manufacturerBrand: true,
  productType: true,
  category: true,
  handlingType: true,
};


// ============================================================
// DOMAIN ERROR
// ============================================================

export class StoreManagerOrderError
  extends Error {
  constructor(
    message,
    {
      status = 400,
      code =
        "STORE_MANAGER_ORDER_ERROR",
    } = {}
  ) {
    super(message);

    this.name =
      "StoreManagerOrderError";

    this.status =
      status;

    this.code =
      code;
  }
}


// ============================================================
// CUTOFF EVALUATION
// ============================================================

export function evaluateStoreOrderCutoff(
  now = new Date()
) {
  const local =
    getColomboDateTimeParts(
      now
    );

  const afterCutoff =
    local.hour >=
    CUTOFF_HOUR;

  const localDate = {
    year:
      local.year,
    month:
      local.month,
    day:
      local.day,
  };

  const requestedDate =
    addCalendarDays(
      localDate,
      1
    );

  const effectiveDate =
    addCalendarDays(
      localDate,
      afterCutoff
        ? 2
        : 1
    );

  const submittedLocalDate =
    formatDateOnly(
      localDate
    );

  const cutoffAt =
    `${submittedLocalDate}T${CUTOFF_TIME}:00${COLOMBO_UTC_OFFSET}`;

  const remainingSeconds =
    afterCutoff
      ? 0
      : Math.max(
          0,
          Math.floor(
            (
              new Date(
                cutoffAt
              ).getTime() -
              now.getTime()
            ) /
              1000
          )
        );

  return {
    timeZone:
      COLOMBO_TIME_ZONE,

    cutoffHour:
      CUTOFF_HOUR,

    cutoffTime:
      CUTOFF_TIME,

    cutoffAt,

    serverTime:
      now.toISOString(),

    submittedLocalDate,

    submittedLocalTime:
      [
        pad2(
          local.hour
        ),
        pad2(
          local.minute
        ),
        pad2(
          local.second
        ),
      ].join(":"),

    remainingSeconds,

    cutoffPassed:
      afterCutoff,

    cutoffDecision:
      afterCutoff
        ? "AFTER_CUTOFF"
        : "ON_TIME",

    eligibility:
      afterCutoff
        ? "FOLLOWING_RUN"
        : "NEXT_RUN",

    status:
      afterCutoff
        ? "DEFERRED"
        : "SUBMITTED",

    requestedDispatchDate:
      toDatabaseDate(
        requestedDate
      ),

    effectiveDispatchDate:
      toDatabaseDate(
        effectiveDate
      ),

    deferredReason:
      afterCutoff
        ? "Submitted at or after the 4:00 PM cutoff; moved to the following delivery run."
        : null,
  };
}


// ============================================================
// ORDER SETUP / AVAILABLE ORDER TYPES
// ============================================================

export async function getStoreManagerOrderSetup(
  context,
  now = new Date()
) {
  assertTrustedContext(
    context
  );

  const cutoff =
    evaluateStoreOrderCutoff(
      now
    );

  const orderTypeRows =
    await prisma.product.findMany({
      where: {
        isActive:
          true,

        brandAssignments: {
          some: {
            brand:
              context.brand,

            isActive:
              true,
          },
        },
      },

      distinct: [
        "handlingType",
      ],

      select: {
        handlingType:
          true,
      },
    });

  const availableOrderTypes =
    orderTypeRows
      .map(
        (row) =>
          row.handlingType
      )
      .sort(
        orderTypeSort
      );

  return {
    serverTime:
      cutoff.serverTime,

    serverLocalDate:
      cutoff.submittedLocalDate,

    serverLocalTime:
      cutoff.submittedLocalTime,

    outlet: {
      id:
        context.outletDatabaseId,

      outletCode:
        context.outletCode,

      brand:
        context.brand,

      district:
        context.district,

      deliveryWindow:
        context.windowOpenTime &&
        context.windowCloseTime
          ? {
              open:
                context.windowOpenTime,

              close:
                context.windowCloseTime,
            }
          : null,
    },

    depot:
      context.depot,

    availableOrderTypes,

    cutoff: {
      timeZone:
        cutoff.timeZone,

      cutoffTime:
        cutoff.cutoffTime,

      cutoffAt:
        cutoff.cutoffAt,

      remainingSeconds:
        cutoff.remainingSeconds,

      cutoffPassed:
        cutoff.cutoffPassed,

      decision:
        cutoff.cutoffDecision,

      eligibility:
        cutoff.eligibility,

      requestedDispatchDate:
        formatDatabaseDate(
          cutoff.requestedDispatchDate
        ),

      effectiveDispatchDate:
        formatDatabaseDate(
          cutoff.effectiveDispatchDate
        ),
    },
  };
}


// ============================================================
// ADVANCED PRODUCT CATALOG
// ============================================================

export async function getStoreManagerCatalogData(
  context,
  rawQuery = {}
) {
  assertTrustedContext(
    context
  );

  const query =
    normalizeCatalogQuery(
      rawQuery
    );

  const availabilityWhere =
    buildCatalogWhere({
      context,
      orderType:
        query.orderType,
      category:
        null,
      search:
        "",
    });

  const categoriesRows =
    await prisma.product.findMany({
      where:
        availabilityWhere,

      distinct: [
        "category",
      ],

      orderBy: {
        category:
          "asc",
      },

      select: {
        category:
          true,
      },
    });

  const categories =
    categoriesRows
      .map(
        (row) =>
          row.category
      )
      .filter(Boolean);

  const where =
    buildCatalogWhere({
      context,
      orderType:
        query.orderType,
      category:
        query.category,
      search:
        query.search,
    });

  const totalItems =
    await prisma.product.count({
      where,
    });

  let products =
    [];

  let suggestions =
    [];

  if (
    query.search
  ) {
    const candidates =
      await prisma.product.findMany({
        where,

        select:
          PRODUCT_SEARCH_SELECT,
      });

    const ranked =
      rankSearchCandidates(
        candidates,
        query.search
      );

    const start =
      (
        query.page -
        1
      ) *
      query.pageSize;

    const pageCandidates =
      ranked.slice(
        start,
        start +
          query.pageSize
      );

    products =
      await loadProductsInOrder(
        pageCandidates.map(
          (item) =>
            item.id
        )
      );

    if (
      query.search.length >=
      2
    ) {
      const suggestionIds =
        ranked
          .slice(
            0,
            6
          )
          .map(
            (item) =>
              item.id
          );

      suggestions =
        await loadProductsInOrder(
          suggestionIds
        );
    }
  } else {
    const rows =
      await prisma.product.findMany({
        where,

        orderBy: [
          {
            category:
              "asc",
          },
          {
            productType:
              "asc",
          },
          {
            name:
              "asc",
          },
          {
            manufacturerBrand:
              "asc",
          },
          {
            sku:
              "asc",
          },
        ],

        skip:
          (
            query.page -
            1
          ) *
          query.pageSize,

        take:
          query.pageSize,

        select:
          PRODUCT_PUBLIC_SELECT,
      });

    products =
      rows.map(
        mapProductForApi
      );
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems /
          query.pageSize
      )
    );

  const safePage =
    Math.min(
      query.page,
      totalPages
    );

  return {
    brand:
      context.brand,

    orderType:
      query.orderType,

    categories,

    products,

    suggestions,

    pagination: {
      page:
        safePage,

      pageSize:
        query.pageSize,

      totalItems,

      totalPages,

      from:
        totalItems === 0
          ? 0
          : (
              safePage -
              1
            ) *
              query.pageSize +
            1,

      to:
        totalItems === 0
          ? 0
          : Math.min(
              safePage *
                query.pageSize,
              totalItems
            ),
    },

    filters: {
      search:
        query.search,

      category:
        query.category,
    },
  };
}


// Backward-compatible helper used by older tests/callers.
export async function listActiveCatalogProducts(
  context
) {
  const data =
    await getStoreManagerCatalogData(
      context,
      {
        page: 1,
        pageSize:
          MAX_PAGE_SIZE,
      }
    );

  return data.products;
}


// ============================================================
// STORE MANAGER ORDERS
// ============================================================

export async function listStoreManagerOrders(
  context
) {
  assertTrustedContext(
    context
  );

  const orders =
    await prisma.storeOrder.findMany({
      where: {
        outletId:
          context.outletDatabaseId,
      },

      orderBy: {
        submittedAt:
          "desc",
      },

      take: 100,

      include: {
        items: {
          select: {
            quantity:
              true,
          },
        },
      },
    });

  return orders.map(
    mapOrderSummary
  );
}


export async function getStoreManagerOrderByCode(
  context,
  orderCode
) {
  assertTrustedContext(
    context
  );

  const normalizedOrderCode =
    normalizeOrderCode(
      orderCode
    );

  const order =
    await prisma.storeOrder.findFirst({
      where: {
        orderCode:
          normalizedOrderCode,

        outletId:
          context.outletDatabaseId,
      },

      include: {
        items: {
          orderBy: {
            id:
              "asc",
          },

          include: {
            product: {
              select:
                PRODUCT_PUBLIC_SELECT,
            },
          },
        },
      },
    });

  if (!order) {
    throw new StoreManagerOrderError(
      "Order was not found.",
      {
        status: 404,
        code:
          "STORE_ORDER_NOT_FOUND",
      }
    );
  }

  return mapOrderDetails(
    order
  );
}


export async function createStoreManagerOrder(
  context,
  body,
  {
    now = new Date(),
  } = {}
) {
  assertTrustedContext(
    context
  );

  const items =
    normalizeOrderItems(
      body?.items
    );

  const storeManagerNote =
    normalizeStoreManagerNote(
      body?.storeManagerNote
    );

  const requestedOrderType =
    normalizeOrderType(
      body?.orderType,
      {
        allowMissing:
          true,
      }
    );

  const productIds =
    items.map(
      (item) =>
        item.productId
    );

  const allowedProducts =
    await prisma.product.findMany({
      where: {
        id: {
          in:
            productIds,
        },

        isActive:
          true,

        brandAssignments: {
          some: {
            brand:
              context.brand,

            isActive:
              true,
          },
        },
      },

      select: {
        id: true,
        handlingType: true,
        unitWeightKg: true,
        unitVolumeM3: true,
      },
    });

  const byId =
    new Map(
      allowedProducts.map(
        (product) => [
          product.id,
          product,
        ]
      )
    );

  const unavailable =
    productIds.filter(
      (productId) =>
        !byId.has(
          productId
        )
    );

  if (
    unavailable.length >
    0
  ) {
    throw new StoreManagerOrderError(
      "One or more selected products are not available for this outlet.",
      {
        status: 400,
        code:
          "STORE_ORDER_PRODUCT_NOT_AVAILABLE_FOR_OUTLET",
      }
    );
  }

  const selectedTypes =
    new Set(
      allowedProducts.map(
        (product) =>
          product.handlingType
      )
    );

  let orderType =
    requestedOrderType;

  // Temporary compatibility for the already-built UI.
  // The final Stage 9.4R-C2 frontend always sends orderType.
  if (!orderType) {
    if (
      selectedTypes.size !==
      1
    ) {
      throw new StoreManagerOrderError(
        "Choose one order type before submitting mixed handling products.",
        {
          status: 400,
          code:
            "STORE_ORDER_TYPE_REQUIRED",
        }
      );
    }

    orderType =
      [
        ...selectedTypes,
      ][0];
  }

  const mismatched =
    allowedProducts.filter(
      (product) =>
        product.handlingType !==
        orderType
    );

  if (
    mismatched.length >
    0
  ) {
    throw new StoreManagerOrderError(
      "All products in an order must match the selected order type.",
      {
        status: 400,
        code:
          "STORE_ORDER_PRODUCT_TYPE_MISMATCH",
      }
    );
  }

  let totalUnits =
    0;

  let estimatedWeightKg =
    0;

  let estimatedVolumeM3 =
    0;

  for (
    const item
    of items
  ) {
    const product =
      byId.get(
        item.productId
      );

    totalUnits +=
      item.quantity;

    estimatedWeightKg +=
      Number(
        product.unitWeightKg
      ) *
      item.quantity;

    estimatedVolumeM3 +=
      Number(
        product.unitVolumeM3
      ) *
      item.quantity;
  }

  estimatedWeightKg =
    roundNumber(
      estimatedWeightKg,
      3
    );

  estimatedVolumeM3 =
    roundNumber(
      estimatedVolumeM3,
      6
    );

  const cutoff =
    evaluateStoreOrderCutoff(
      now
    );

  const orderCode =
    createOrderCode(
      now
    );

  const created =
    await prisma.storeOrder.create({
      data: {
        orderCode,

        outletId:
          context.outletDatabaseId,

        createdByUserId:
          context.userDatabaseId,

        status:
          cutoff.status,

        orderType,

        cutoffDecision:
          cutoff.cutoffDecision,

        submittedAt:
          now,

        requestedDispatchDate:
          cutoff.requestedDispatchDate,

        effectiveDispatchDate:
          cutoff.effectiveDispatchDate,

        deferredReason:
          cutoff.deferredReason,

        storeManagerNote,

        totalUnits,

        estimatedWeightKg:
          estimatedWeightKg.toFixed(
            3
          ),

        estimatedVolumeM3:
          estimatedVolumeM3.toFixed(
            6
          ),

        items: {
          create:
            items.map(
              (item) => ({
                productId:
                  item.productId,

                quantity:
                  item.quantity,
              })
            ),
        },
      },

      include: {
        items: {
          orderBy: {
            id:
              "asc",
          },

          include: {
            product: {
              select:
                PRODUCT_PUBLIC_SELECT,
            },
          },
        },
      },
    });

  return {
    order:
      mapOrderDetails(
        created
      ),

    cutoff: {
      timeZone:
        cutoff.timeZone,

      cutoffHour:
        cutoff.cutoffHour,

      cutoffTime:
        cutoff.cutoffTime,

      cutoffAt:
        cutoff.cutoffAt,

      cutoffDecision:
        cutoff.cutoffDecision,

      eligibility:
        cutoff.eligibility,

      submittedLocalDate:
        cutoff.submittedLocalDate,

      submittedLocalTime:
        cutoff.submittedLocalTime,
    },
  };
}


// ============================================================
// CATALOG HELPERS
// ============================================================

function normalizeCatalogQuery(
  rawQuery
) {
  const page =
    positiveInteger(
      rawQuery?.page,
      1
    );

  const requestedPageSize =
    positiveInteger(
      rawQuery?.pageSize,
      DEFAULT_PAGE_SIZE
    );

  const pageSize =
    Math.min(
      requestedPageSize,
      MAX_PAGE_SIZE
    );

  const search =
    String(
      rawQuery?.search ||
      ""
    )
      .trim()
      .slice(
        0,
        MAX_SEARCH_LENGTH
      );

  const categoryValue =
    String(
      rawQuery?.category ||
      ""
    )
      .trim();

  const category =
    !categoryValue ||
    categoryValue ===
      "ALL"
      ? null
      : categoryValue.slice(
          0,
          100
        );

  const orderType =
    normalizeOrderType(
      rawQuery?.orderType,
      {
        allowMissing:
          true,
      }
    );

  return {
    page,
    pageSize,
    search,
    category,
    orderType,
  };
}


function buildCatalogWhere({
  context,
  orderType,
  category,
  search,
}) {
  const where = {
    isActive:
      true,

    brandAssignments: {
      some: {
        brand:
          context.brand,

        isActive:
          true,
      },
    },
  };

  if (orderType) {
    where.handlingType =
      orderType;
  }

  if (category) {
    where.category =
      category;
  }

  if (search) {
    where.OR = [
      {
        sku: {
          contains:
            search,
        },
      },
      {
        name: {
          contains:
            search,
        },
      },
      {
        manufacturerBrand: {
          contains:
            search,
        },
      },
      {
        productType: {
          contains:
            search,
        },
      },
      {
        category: {
          contains:
            search,
        },
      },
    ];
  }

  return where;
}


function rankSearchCandidates(
  candidates,
  search
) {
  const needle =
    search.toLowerCase();

  return [
    ...candidates,
  ].sort(
    (
      a,
      b
    ) => {
      const scoreDiff =
        searchScore(
          a,
          needle
        ) -
        searchScore(
          b,
          needle
        );

      if (
        scoreDiff !==
        0
      ) {
        return scoreDiff;
      }

      return a.name
        .localeCompare(
          b.name
        );
    }
  );
}


function searchScore(
  product,
  needle
) {
  const sku =
    String(
      product.sku ||
      ""
    ).toLowerCase();

  const name =
    String(
      product.name ||
      ""
    ).toLowerCase();

  const brand =
    String(
      product.manufacturerBrand ||
      ""
    ).toLowerCase();

  const type =
    String(
      product.productType ||
      ""
    ).toLowerCase();

  const category =
    String(
      product.category ||
      ""
    ).toLowerCase();

  if (
    sku ===
    needle
  ) {
    return 0;
  }

  if (
    name ===
    needle
  ) {
    return 1;
  }

  if (
    name.startsWith(
      needle
    )
  ) {
    return 2;
  }

  if (
    sku.startsWith(
      needle
    )
  ) {
    return 3;
  }

  if (
    brand.startsWith(
      needle
    )
  ) {
    return 4;
  }

  if (
    type.startsWith(
      needle
    )
  ) {
    return 5;
  }

  if (
    category.startsWith(
      needle
    )
  ) {
    return 6;
  }

  return 10;
}


async function loadProductsInOrder(
  ids
) {
  if (
    ids.length ===
    0
  ) {
    return [];
  }

  const rows =
    await prisma.product.findMany({
      where: {
        id: {
          in:
            ids,
        },
      },

      select:
        PRODUCT_PUBLIC_SELECT,
    });

  const map =
    new Map(
      rows.map(
        (row) => [
          row.id,
          mapProductForApi(
            row
          ),
        ]
      )
    );

  return ids
    .map(
      (id) =>
        map.get(
          id
        )
    )
    .filter(Boolean);
}


// ============================================================
// VALIDATION
// ============================================================

function assertTrustedContext(
  context
) {
  if (
    !context?.userDatabaseId ||
    !context?.outletDatabaseId ||
    !context?.brand
  ) {
    throw new StoreManagerOrderError(
      "Store Manager context is unavailable.",
      {
        status: 500,
        code:
          "STORE_MANAGER_CONTEXT_MISSING",
      }
    );
  }
}


function normalizeOrderType(
  value,
  {
    allowMissing = false,
  } = {}
) {
  const normalized =
    String(
      value ||
      ""
    )
      .trim()
      .toUpperCase();

  if (
    !normalized
  ) {
    if (
      allowMissing
    ) {
      return null;
    }

    throw new StoreManagerOrderError(
      "Order type is required.",
      {
        code:
          "STORE_ORDER_TYPE_REQUIRED",
      }
    );
  }

  if (
    !VALID_ORDER_TYPES.has(
      normalized
    )
  ) {
    throw new StoreManagerOrderError(
      "Order type must be AMBIENT_DRY or CHILLED.",
      {
        code:
          "STORE_ORDER_TYPE_INVALID",
      }
    );
  }

  return normalized;
}


function normalizeStoreManagerNote(
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(
      value
    ).trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.length >
    MAX_STORE_MANAGER_NOTE_LENGTH
  ) {
    throw new StoreManagerOrderError(
      `Store Manager note cannot exceed ${MAX_STORE_MANAGER_NOTE_LENGTH} characters.`,
      {
        code:
          "STORE_ORDER_NOTE_TOO_LONG",
      }
    );
  }

  return normalized;
}


function normalizeOrderItems(
  rawItems
) {
  if (
    !Array.isArray(
      rawItems
    ) ||
    rawItems.length === 0
  ) {
    throw new StoreManagerOrderError(
      "At least one order item is required.",
      {
        code:
          "STORE_ORDER_ITEMS_REQUIRED",
      }
    );
  }

  if (
    rawItems.length >
    MAX_ORDER_ITEMS
  ) {
    throw new StoreManagerOrderError(
      `An order cannot contain more than ${MAX_ORDER_ITEMS} different products.`,
      {
        code:
          "STORE_ORDER_TOO_MANY_ITEMS",
      }
    );
  }

  const seenProductIds =
    new Set();

  return rawItems.map(
    (
      rawItem,
      index
    ) => {
      const productId =
        Number(
          rawItem?.productId
        );

      const quantity =
        Number(
          rawItem?.quantity
        );

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        throw new StoreManagerOrderError(
          `Item ${index + 1} has an invalid productId.`,
          {
            code:
              "STORE_ORDER_INVALID_PRODUCT",
          }
        );
      }

      if (
        seenProductIds.has(
          productId
        )
      ) {
        throw new StoreManagerOrderError(
          "The same product cannot appear more than once in an order.",
          {
            code:
              "STORE_ORDER_DUPLICATE_PRODUCT",
          }
        );
      }

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0 ||
        quantity >
          MAX_QUANTITY_PER_ITEM
      ) {
        throw new StoreManagerOrderError(
          `Item ${index + 1} must have a quantity between 1 and ${MAX_QUANTITY_PER_ITEM}.`,
          {
            code:
              "STORE_ORDER_INVALID_QUANTITY",
          }
        );
      }

      seenProductIds.add(
        productId
      );

      return {
        productId,
        quantity,
      };
    }
  );
}


function normalizeOrderCode(
  value
) {
  const orderCode =
    String(
      value ||
      ""
    )
      .trim()
      .toUpperCase();

  if (
    !orderCode ||
    orderCode.length >
      40
  ) {
    throw new StoreManagerOrderError(
      "A valid order code is required.",
      {
        code:
          "STORE_ORDER_CODE_INVALID",
      }
    );
  }

  return orderCode;
}


// ============================================================
// API MAPPING
// ============================================================

function mapProductForApi(
  product
) {
  if (!product) {
    return null;
  }

  return {
    id:
      product.id,

    sku:
      product.sku,

    name:
      product.name,

    manufacturerBrand:
      product.manufacturerBrand,

    productType:
      product.productType,

    category:
      product.category,

    handlingType:
      product.handlingType,

    unitLabel:
      product.unitLabel,

    unitWeightKg:
      Number(
        product.unitWeightKg
      ),

    unitVolumeM3:
      Number(
        product.unitVolumeM3
      ),

    imageMimeType:
      product.imageMimeType,

    imageBase64:
      product.imageData
        ? Buffer
            .from(
              product.imageData
            )
            .toString(
              "base64"
            )
        : null,

    source:
      product.source,
  };
}


function mapOrderSummary(
  order
) {
  return {
    id:
      order.id,

    orderCode:
      order.orderCode,

    status:
      order.status,

    orderType:
      order.orderType,

    cutoffDecision:
      order.cutoffDecision,

    submittedAt:
      order.submittedAt,

    requestedDispatchDate:
      formatDatabaseDate(
        order.requestedDispatchDate
      ),

    effectiveDispatchDate:
      formatDatabaseDate(
        order.effectiveDispatchDate
      ),

    deferredReason:
      order.deferredReason,

    storeManagerNote:
      order.storeManagerNote,

    totalUnits:
      order.totalUnits,

    estimatedWeightKg:
      Number(
        order.estimatedWeightKg
      ),

    estimatedVolumeM3:
      Number(
        order.estimatedVolumeM3
      ),

    itemCount:
      order.items.length,
  };
}


function mapOrderDetails(
  order
) {
  return {
    id:
      order.id,

    orderCode:
      order.orderCode,

    status:
      order.status,

    orderType:
      order.orderType,

    cutoffDecision:
      order.cutoffDecision,

    submittedAt:
      order.submittedAt,

    requestedDispatchDate:
      formatDatabaseDate(
        order.requestedDispatchDate
      ),

    effectiveDispatchDate:
      formatDatabaseDate(
        order.effectiveDispatchDate
      ),

    deferredReason:
      order.deferredReason,

    storeManagerNote:
      order.storeManagerNote,

    totalUnits:
      order.totalUnits,

    estimatedWeightKg:
      Number(
        order.estimatedWeightKg
      ),

    estimatedVolumeM3:
      Number(
        order.estimatedVolumeM3
      ),

    itemCount:
      order.items.length,

    items:
      order.items.map(
        (item) => ({
          id:
            item.id,

          quantity:
            item.quantity,

          product:
            mapProductForApi(
              item.product
            ),
        })
      ),
  };
}


// ============================================================
// ORDER CODE
// ============================================================

function createOrderCode(
  now
) {
  const local =
    getColomboDateTimeParts(
      now
    );

  const datePart =
    `${local.year}${pad2(
      local.month
    )}${pad2(
      local.day
    )}`;

  const randomPart =
    randomUUID()
      .replaceAll(
        "-",
        ""
      )
      .slice(
        0,
        8
      )
      .toUpperCase();

  return `ORD-${datePart}-${randomPart}`;
}


// ============================================================
// DATE / NUMBER HELPERS
// ============================================================

function getColomboDateTimeParts(
  date
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          COLOMBO_TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hourCycle:
          "h23",
      }
    );

  const parts =
    Object.fromEntries(
      formatter
        .formatToParts(
          date
        )
        .filter(
          (part) =>
            part.type !==
            "literal"
        )
        .map(
          (part) => [
            part.type,
            Number(
              part.value
            ),
          ]
        )
    );

  return {
    year:
      parts.year,
    month:
      parts.month,
    day:
      parts.day,
    hour:
      parts.hour,
    minute:
      parts.minute,
    second:
      parts.second,
  };
}


function addCalendarDays(
  dateParts,
  days
) {
  const date =
    new Date(
      Date.UTC(
        dateParts.year,
        dateParts.month -
          1,
        dateParts.day +
          days
      )
    );

  return {
    year:
      date.getUTCFullYear(),

    month:
      date.getUTCMonth() +
      1,

    day:
      date.getUTCDate(),
  };
}


function toDatabaseDate(
  dateParts
) {
  return new Date(
    Date.UTC(
      dateParts.year,
      dateParts.month -
        1,
      dateParts.day
    )
  );
}


function formatDateOnly(
  dateParts
) {
  return [
    dateParts.year,
    pad2(
      dateParts.month
    ),
    pad2(
      dateParts.day
    ),
  ].join("-");
}


function formatDatabaseDate(
  value
) {
  if (!value) {
    return null;
  }

  return value
    .toISOString()
    .slice(
      0,
      10
    );
}


function pad2(
  value
) {
  return String(
    value
  ).padStart(
    2,
    "0"
  );
}


function positiveInteger(
  value,
  fallback
) {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed <=
      0
  ) {
    return fallback;
  }

  return parsed;
}


function roundNumber(
  value,
  decimalPlaces
) {
  const factor =
    10 **
    decimalPlaces;

  return Math.round(
    (
      value +
      Number.EPSILON
    ) *
      factor
  ) /
    factor;
}


function orderTypeSort(
  first,
  second
) {
  const order = {
    AMBIENT_DRY: 0,
    CHILLED: 1,
  };

  return (
    order[first] ??
    99
  ) -
    (
      order[second] ??
      99
    );
}
