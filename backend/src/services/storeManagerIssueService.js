import { randomBytes } from "node:crypto";

import prisma from "../config/database.js";

const ISSUE_CATEGORIES = new Set([
  "DELIVERY_SHORTFALL",
  "DAMAGED_GOODS",
  "LATE_DELIVERY",
  "DELIVERY_EXCEPTION",
  "ORDER_PROBLEM",
  "OTHER",
]);

const ISSUE_STATUSES = new Set(["OPEN", "RESOLVED"]);

export class StoreManagerIssueError extends Error {
  constructor(message, { status = 400, code = "STORE_MANAGER_ISSUE_ERROR" } = {}) {
    super(message);
    this.name = "StoreManagerIssueError";
    this.status = status;
    this.code = code;
  }
}

export async function listStoreManagerIssues(
  context,
  { status = "ALL" } = {}
) {
  const outletId = requireTrustedOutletId(context);
  const normalizedStatus = normalizeStatusFilter(status);

  const [issues, grouped] = await Promise.all([
    prisma.storeManagerIssue.findMany({
      where: {
        outletId,
        ...(normalizedStatus === "ALL"
          ? {}
          : { status: normalizedStatus }),
      },
      orderBy: [
        { status: "asc" },
        { reportedAt: "desc" },
      ],
      include: ISSUE_INCLUDE,
    }),
    prisma.storeManagerIssue.groupBy({
      by: ["status"],
      where: { outletId },
      _count: { _all: true },
    }),
  ]);

  const summary = {
    total: 0,
    open: 0,
    resolved: 0,
  };

  for (const row of grouped) {
    const count = row?._count?._all ?? 0;
    summary.total += count;
    if (row.status === "OPEN") summary.open = count;
    if (row.status === "RESOLVED") summary.resolved = count;
  }

  return {
    issues: issues.map(mapIssue),
    summary,
  };
}

export async function createStoreManagerIssue(
  context,
  {
    orderCode,
    category,
    description,
  } = {}
) {
  const outletId = requireTrustedOutletId(context);
  const userDatabaseId = requireTrustedUserId(context);
  const normalizedOrderCode = normalizeIdentifier(orderCode, "orderCode");
  const normalizedCategory = normalizeCategory(category);
  const normalizedDescription = normalizeDescription(description);

  const order = await prisma.storeOrder.findFirst({
    where: {
      orderCode: normalizedOrderCode,
      outletId,
    },
    select: {
      id: true,
      orderCode: true,
    },
  });

  if (!order) {
    throw new StoreManagerIssueError(
      "Order or delivery was not found for this outlet.",
      {
        status: 404,
        code: "STORE_MANAGER_ISSUE_ORDER_NOT_FOUND",
      }
    );
  }

  const created = await prisma.storeManagerIssue.create({
    data: {
      issueCode: buildIssueCode(),
      storeOrderId: order.id,
      outletId,
      reportedByUserId: userDatabaseId,
      category: normalizedCategory,
      description: normalizedDescription,
      status: "OPEN",
    },
    include: ISSUE_INCLUDE,
  });

  return mapIssue(created);
}

export async function resolveStoreManagerIssue(
  context,
  issueCode,
  { resolutionNote = "" } = {}
) {
  const outletId = requireTrustedOutletId(context);
  const userDatabaseId = requireTrustedUserId(context);
  const normalizedIssueCode = normalizeIdentifier(issueCode, "issueCode");
  const normalizedResolutionNote = normalizeResolutionNote(resolutionNote);

  const issue = await prisma.storeManagerIssue.findFirst({
    where: {
      issueCode: normalizedIssueCode,
      outletId,
    },
    include: ISSUE_INCLUDE,
  });

  if (!issue) {
    throw new StoreManagerIssueError(
      "Issue was not found for this outlet.",
      {
        status: 404,
        code: "STORE_MANAGER_ISSUE_NOT_FOUND",
      }
    );
  }

  if (issue.status === "RESOLVED") {
    return {
      issue: mapIssue(issue),
      alreadyResolved: true,
    };
  }

  const resolved = await prisma.storeManagerIssue.update({
    where: { id: issue.id },
    data: {
      status: "RESOLVED",
      resolvedByUserId: userDatabaseId,
      resolvedAt: new Date(),
      resolutionNote: normalizedResolutionNote,
    },
    include: ISSUE_INCLUDE,
  });

  return {
    issue: mapIssue(resolved),
    alreadyResolved: false,
  };
}

const ISSUE_INCLUDE = {
  storeOrder: {
    select: {
      id: true,
      orderCode: true,
      status: true,
      orderType: true,
      effectiveDispatchDate: true,
    },
  },
  reportedByUser: {
    select: {
      userId: true,
      fullName: true,
    },
  },
  resolvedByUser: {
    select: {
      userId: true,
      fullName: true,
    },
  },
};

function mapIssue(issue) {
  return {
    issueCode: issue.issueCode,
    category: issue.category,
    description: issue.description,
    status: issue.status,
    reportedAt: issue.reportedAt,
    resolvedAt: issue.resolvedAt,
    resolutionNote: issue.resolutionNote,
    order: issue.storeOrder
      ? {
          orderCode: issue.storeOrder.orderCode,
          orderStatus: issue.storeOrder.status,
          orderType: issue.storeOrder.orderType,
          effectiveDispatchDate: formatDatabaseDate(
            issue.storeOrder.effectiveDispatchDate
          ),
        }
      : null,
    reportedBy: issue.reportedByUser
      ? {
          userId: issue.reportedByUser.userId,
          fullName: issue.reportedByUser.fullName,
        }
      : null,
    resolvedBy: issue.resolvedByUser
      ? {
          userId: issue.resolvedByUser.userId,
          fullName: issue.resolvedByUser.fullName,
        }
      : null,
  };
}

function requireTrustedOutletId(context) {
  const outletId = Number(context?.outletDatabaseId);
  if (!Number.isInteger(outletId) || outletId <= 0) {
    throw new StoreManagerIssueError(
      "A trusted Store Manager outlet is required.",
      {
        status: 403,
        code: "STORE_MANAGER_OUTLET_REQUIRED",
      }
    );
  }
  return outletId;
}

function requireTrustedUserId(context) {
  const userId = Number(context?.userDatabaseId);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new StoreManagerIssueError(
      "Store Manager identity is unavailable.",
      {
        status: 403,
        code: "STORE_MANAGER_ISSUE_USER_REQUIRED",
      }
    );
  }
  return userId;
}

function normalizeIdentifier(value, label) {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) {
    throw new StoreManagerIssueError(
      `${label} is required.`,
      {
        status: 400,
        code: "STORE_MANAGER_ISSUE_INVALID_IDENTIFIER",
      }
    );
  }
  return normalized;
}

function normalizeCategory(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (!ISSUE_CATEGORIES.has(normalized)) {
    throw new StoreManagerIssueError(
      "A valid issue category is required.",
      {
        status: 422,
        code: "STORE_MANAGER_ISSUE_INVALID_CATEGORY",
      }
    );
  }
  return normalized;
}

function normalizeStatusFilter(value) {
  const normalized = String(value || "ALL").trim().toUpperCase();
  if (normalized === "ALL") return normalized;
  if (!ISSUE_STATUSES.has(normalized)) {
    throw new StoreManagerIssueError(
      "A valid issue status filter is required.",
      {
        status: 422,
        code: "STORE_MANAGER_ISSUE_INVALID_STATUS",
      }
    );
  }
  return normalized;
}

function normalizeDescription(value) {
  const normalized = String(value || "").trim();
  if (normalized.length < 5) {
    throw new StoreManagerIssueError(
      "Please provide a short description of the issue.",
      {
        status: 422,
        code: "STORE_MANAGER_ISSUE_DESCRIPTION_REQUIRED",
      }
    );
  }
  if (normalized.length > 1000) {
    throw new StoreManagerIssueError(
      "Issue description must not exceed 1000 characters.",
      {
        status: 422,
        code: "STORE_MANAGER_ISSUE_DESCRIPTION_TOO_LONG",
      }
    );
  }
  return normalized;
}

function normalizeResolutionNote(value) {
  const normalized = String(value || "").trim();
  if (normalized.length > 1000) {
    throw new StoreManagerIssueError(
      "Resolution note must not exceed 1000 characters.",
      {
        status: 422,
        code: "STORE_MANAGER_ISSUE_RESOLUTION_TOO_LONG",
      }
    );
  }
  return normalized || null;
}

function buildIssueCode() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  return `ISS-${timePart}-${randomPart}`;
}

function formatDatabaseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}
