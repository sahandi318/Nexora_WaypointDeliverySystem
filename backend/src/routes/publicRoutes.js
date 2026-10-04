import { Router } from "express";

import prisma from "../config/database.js";

const router = Router();
const PUBLIC_OUTLET_PAGE_SIZE = 10;

function positiveInteger(value, fallback = 1) {
  const numericValue = Number(value);

  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : fallback;
}

function cleanQueryValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase();
}

function uniqueSorted(values) {
  return Array.from(
    new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

async function readPublicOutlets() {
  const outlets = await prisma.outlet.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      outletCode: true,
      brand: true,
      district: true,
    },
  });

  return outlets.map((outlet) => ({
    id: outlet.id,
    outletCode: String(outlet.outletCode ?? "").trim(),
    brand: String(outlet.brand ?? "").trim(),
    district: String(outlet.district ?? "").trim(),
  }));
}

// ============================================================
// PUBLIC OUTLET FILTER OPTIONS
// ============================================================
// Kept for compatibility with older frontend builds. The current
// frontend also receives these options with the outlet response so
// filtering uses one consistent data source.
// ============================================================

router.get("/outlet-filters", async (req, res, next) => {
  try {
    const outlets = await readPublicOutlets();

    return res.status(200).json({
      success: true,
      districts: uniqueSorted(outlets.map((outlet) => outlet.district)),
      brands: uniqueSorted(outlets.map((outlet) => outlet.brand)),
    });
  } catch (error) {
    return next(error);
  }
});

// ============================================================
// PUBLIC OUTLET DIRECTORY
// ============================================================
// Filtering is intentionally performed against normalized values after
// reading the small public directory. This avoids exact-match problems
// caused by whitespace/collation differences in imported organizer data.
// Only public-safe fields are returned.
// ============================================================

router.get("/outlets", async (req, res, next) => {
  try {
    const districtQuery = cleanQueryValue(req.query.district);
    const brandQuery = cleanQueryValue(req.query.brand);
    const searchQuery = cleanQueryValue(req.query.search);
    const requestedPage = positiveInteger(req.query.page, 1);

    const allOutlets = await readPublicOutlets();

    const districts = uniqueSorted(
      allOutlets.map((outlet) => outlet.district)
    );
    const brands = uniqueSorted(
      allOutlets.map((outlet) => outlet.brand)
    );

    const normalizedDistrict = normalizeText(districtQuery);
    const normalizedBrand = normalizeText(brandQuery);
    const normalizedSearch = normalizeText(searchQuery);

    const filteredOutlets = allOutlets
      .filter((outlet) => {
        if (
          normalizedDistrict &&
          normalizeText(outlet.district) !== normalizedDistrict
        ) {
          return false;
        }

        if (
          normalizedBrand &&
          normalizeText(outlet.brand) !== normalizedBrand
        ) {
          return false;
        }

        if (normalizedSearch) {
          const haystack = normalizeText(
            `${outlet.outletCode} ${outlet.brand} ${outlet.district}`
          );

          if (!haystack.includes(normalizedSearch)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const districtCompare = a.district.localeCompare(b.district);

        if (districtCompare !== 0) {
          return districtCompare;
        }

        return a.outletCode.localeCompare(b.outletCode);
      });

    const total = filteredOutlets.length;
    const totalPages = Math.max(
      Math.ceil(total / PUBLIC_OUTLET_PAGE_SIZE),
      1
    );
    const page = Math.min(requestedPage, totalPages);
    const startIndex = (page - 1) * PUBLIC_OUTLET_PAGE_SIZE;
    const outlets = filteredOutlets.slice(
      startIndex,
      startIndex + PUBLIC_OUTLET_PAGE_SIZE
    );

    return res.status(200).json({
      success: true,
      outlets,
      pagination: {
        page,
        limit: PUBLIC_OUTLET_PAGE_SIZE,
        total,
        totalPages,
      },
      filters: {
        districts,
        brands,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
