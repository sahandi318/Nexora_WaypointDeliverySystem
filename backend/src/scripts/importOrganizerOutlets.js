import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";


// ============================================================
// CONFIGURATION
// ============================================================

const EXPECTED_OUTLET_COUNT = 120;

const currentFilePath =
  fileURLToPath(import.meta.url);

const currentDirectory =
  path.dirname(currentFilePath);

/**
 * Current script:
 *
 * backend/src/scripts/importOrganizerOutlets.js
 *
 * Organizer dataset:
 *
 * data/outlets.csv
 */
const OUTLETS_CSV_PATH =
  path.resolve(
    currentDirectory,
    "../../../data/outlets.csv"
  );


// ============================================================
// CSV PARSER
// ============================================================

/**
 * Parse a single CSV line.
 *
 * Supports:
 * - comma-separated values
 * - quoted fields
 * - commas inside quoted fields
 * - escaped double quotes
 */
function parseCsvLine(line) {
  const values = [];

  let currentValue = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character =
      line[index];

    if (character === '"') {
      const nextCharacter =
        line[index + 1];

      if (
        insideQuotes &&
        nextCharacter === '"'
      ) {
        currentValue += '"';
        index += 1;
      } else {
        insideQuotes =
          !insideQuotes;
      }

      continue;
    }

    if (
      character === "," &&
      !insideQuotes
    ) {
      values.push(currentValue);

      currentValue = "";

      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);

  return values;
}


/**
 * Convert the organizer CSV file into JavaScript objects.
 */
function parseCsv(csvContent) {
  const normalizedContent =
    csvContent
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();

  const lines =
    normalizedContent
      .split("\n")
      .filter(
        (line) =>
          line.trim().length > 0
      );

  if (lines.length < 2) {
    throw new Error(
      "The organizer outlet CSV does not contain any outlet records."
    );
  }

  const headers =
    parseCsvLine(lines[0]).map(
      (header) =>
        header.trim()
    );

  return lines
    .slice(1)
    .map((line, rowIndex) => {
      const values =
        parseCsvLine(line);

      if (
        values.length !==
        headers.length
      ) {
        throw new Error(
          `Invalid CSV row ${
            rowIndex + 2
          }. Expected ${
            headers.length
          } columns but received ${
            values.length
          }.`
        );
      }

      return Object.fromEntries(
        headers.map(
          (
            header,
            columnIndex
          ) => [
            header,
            values[
              columnIndex
            ].trim(),
          ]
        )
      );
    });
}


// ============================================================
// DATASET VALIDATION
// ============================================================

const requiredColumns = [
  "outlet_id",
  "brand",
  "district",
  "depot",
  "dock_type",
  "parking_constraint",
  "mall_window",
  "window_open_time",
  "window_close_time",
];


function validateRows(rows) {
  if (rows.length === 0) {
    throw new Error(
      "No organizer outlets were found."
    );
  }


  const firstRow =
    rows[0];


  for (
    const column
    of requiredColumns
  ) {
    if (
      !Object.hasOwn(
        firstRow,
        column
      )
    ) {
      throw new Error(
        `Required organizer CSV column is missing: ${column}`
      );
    }
  }


  if (
    rows.length !==
    EXPECTED_OUTLET_COUNT
  ) {
    throw new Error(
      `Expected ${EXPECTED_OUTLET_COUNT} organizer outlets, but found ${rows.length}.`
    );
  }


  const outletIds =
    new Set();


  for (const row of rows) {
    if (!row.outlet_id) {
      throw new Error(
        "An organizer outlet is missing outlet_id."
      );
    }


    if (!row.brand) {
      throw new Error(
        `Outlet ${row.outlet_id} is missing brand.`
      );
    }


    if (!row.district) {
      throw new Error(
        `Outlet ${row.outlet_id} is missing district.`
      );
    }


    if (!row.depot) {
      throw new Error(
        `Outlet ${row.outlet_id} is missing depot.`
      );
    }


    if (
      outletIds.has(
        row.outlet_id
      )
    ) {
      throw new Error(
        `Duplicate organizer outlet ID found: ${row.outlet_id}`
      );
    }


    outletIds.add(
      row.outlet_id
    );
  }
}


// ============================================================
// DATA HELPERS
// ============================================================

/**
 * Generate an internal database depot code from the
 * organizer-provided depot name.
 *
 * Examples:
 *
 * Peliyagoda -> PELIYAGODA
 * Kandy      -> KANDY
 */
function createDepotCode(
  depotName
) {
  const code =
    depotName
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      )
      .slice(0, 30);


  if (!code) {
    throw new Error(
      `Unable to generate a depot code for "${depotName}".`
    );
  }


  return code;
}


/**
 * Convert blank CSV fields into null.
 */
function optionalValue(value) {
  const trimmedValue =
    value?.trim();

  return trimmedValue
    ? trimmedValue
    : null;
}


// ============================================================
// DATABASE IMPORT
// ============================================================

async function importOrganizerOutlets() {
  console.log("");
  console.log(
    "=========================================="
  );
  console.log(
    " Nexora Organizer Outlet Import"
  );
  console.log(
    "=========================================="
  );

  console.log(
    `Dataset: ${OUTLETS_CSV_PATH}`
  );


  // ----------------------------------------------------------
  // Read organizer file
  // ----------------------------------------------------------

  const csvContent =
    await fs.readFile(
      OUTLETS_CSV_PATH,
      "utf8"
    );


  const rows =
    parseCsv(csvContent);


  validateRows(rows);


  // ----------------------------------------------------------
  // Determine organizer depots
  // ----------------------------------------------------------

  const uniqueDepotNames = [
    ...new Set(
      rows.map(
        (row) =>
          row.depot
      )
    ),
  ].sort();


  console.log(
    `Validated outlets : ${rows.length}`
  );

  console.log(
    `Detected depots   : ${uniqueDepotNames.length}`
  );


  // ----------------------------------------------------------
  // Import everything inside a transaction
  // ----------------------------------------------------------

  await prisma.$transaction(
    async (transaction) => {
      const depotsByName =
        new Map();


      // ======================================================
      // DEPOTS
      // ======================================================

      for (
        const depotName
        of uniqueDepotNames
      ) {
        const depotCode =
          createDepotCode(
            depotName
          );


        const depot =
          await transaction.depot.upsert(
            {
              where: {
                name:
                  depotName,
              },

              update: {
                code:
                  depotCode,

                isActive:
                  true,
              },

              create: {
                code:
                  depotCode,

                name:
                  depotName,

                /**
                 * outlets.csv does not contain a separate
                 * district value for each depot.
                 *
                 * We intentionally avoid inventing data.
                 */
                district:
                  null,

                isActive:
                  true,
              },
            }
          );


        depotsByName.set(
          depotName,
          depot
        );
      }


      // ======================================================
      // OUTLETS
      // ======================================================

      for (const row of rows) {
        const depot =
          depotsByName.get(
            row.depot
          );


        if (!depot) {
          throw new Error(
            `Depot "${row.depot}" could not be resolved for outlet ${row.outlet_id}.`
          );
        }


        const outletData = {
          brand:
            row.brand,

          district:
            row.district,

          depotId:
            depot.id,

          dockType:
            optionalValue(
              row.dock_type
            ),

          parkingConstraint:
            optionalValue(
              row.parking_constraint
            ),

          mallWindow:
            optionalValue(
              row.mall_window
            ),

          windowOpenTime:
            optionalValue(
              row.window_open_time
            ),

          windowCloseTime:
            optionalValue(
              row.window_close_time
            ),

          isActive:
            true,
        };


        /**
         * Upsert makes this importer safe to rerun.
         *
         * Existing organizer outlets are updated rather than
         * duplicated.
         */
        await transaction.outlet.upsert(
          {
            where: {
              outletCode:
                row.outlet_id,
            },

            update:
              outletData,

            create: {
              outletCode:
                row.outlet_id,

              ...outletData,
            },
          }
        );
      }
    }
  );


  // ==========================================================
  // POST-IMPORT VERIFICATION
  // ==========================================================

  const outletCount =
    await prisma.outlet.count();


  const depotCount =
    await prisma.depot.count();


  const depots =
    await prisma.depot.findMany({
      orderBy: {
        name:
          "asc",
      },

      select: {
        code:
          true,

        name:
          true,

        _count: {
          select: {
            outlets:
              true,
          },
        },
      },
    });


  console.log("");
  console.log(
    "✓ Organizer outlet import completed."
  );

  console.log(
    `Database outlets : ${outletCount}`
  );

  console.log(
    `Database depots  : ${depotCount}`
  );

  console.log("");


  for (const depot of depots) {
    console.log(
      `- ${depot.name} (${depot.code}): ${depot._count.outlets} outlets`
    );
  }


  console.log(
    "=========================================="
  );
  console.log("");
}


// ============================================================
// SCRIPT ENTRY POINT
// ============================================================

async function main() {
  try {
    await connectDatabase();

    await importOrganizerOutlets();
  } catch (error) {
    console.error("");

    console.error(
      "✗ Organizer outlet import failed."
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}


main();