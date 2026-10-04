import "dotenv/config";

import {
  readFile,
} from "node:fs/promises";

import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  STORE_MANAGER_CATALOG,
} from "../data/storeManagerCatalogData.js";

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const IMAGE_ROOT =
  path.resolve(
    __dirname,
    "../assets/store-manager-catalog"
  );

async function seedCatalog() {
  const activeDemoSkus =
    STORE_MANAGER_CATALOG.map(
      (item) =>
        item.sku
    );

  // Old application demo products that are not part of the new
  // catalog stay in the database for migration/history safety,
  // but they are hidden from all new order flows.
  await prisma.product.updateMany({
    where: {
      source:
        "APPLICATION_DEMO",

      sku: {
        notIn:
          activeDemoSkus,
      },
    },

    data: {
      isActive:
        false,
    },
  });

  let seeded =
    0;

  for (
    const item
    of STORE_MANAGER_CATALOG
  ) {
    const imageData =
      await readFile(
        path.resolve(
          IMAGE_ROOT,
          item.imageFile
        )
      );

    const product =
      await prisma.product.upsert({
        where: {
          sku:
            item.sku,
        },

        update: {
          name:
            item.name,

          manufacturerBrand:
            item.manufacturerBrand,

          productType:
            item.productType,

          category:
            item.category,

          handlingType:
            item.handlingType,

          unitLabel:
            item.unitLabel,

          unitWeightKg:
            item.unitWeightKg,

          unitVolumeM3:
            item.unitVolumeM3,

          imageData,

          imageMimeType:
            "image/webp",

          source:
            "APPLICATION_DEMO",

          isActive:
            true,
        },

        create: {
          sku:
            item.sku,

          name:
            item.name,

          manufacturerBrand:
            item.manufacturerBrand,

          productType:
            item.productType,

          category:
            item.category,

          handlingType:
            item.handlingType,

          unitLabel:
            item.unitLabel,

          unitWeightKg:
            item.unitWeightKg,

          unitVolumeM3:
            item.unitVolumeM3,

          imageData,

          imageMimeType:
            "image/webp",

          source:
            "APPLICATION_DEMO",

          isActive:
            true,
        },
      });

    await prisma.productBrandAssignment.upsert({
      where: {
        productId_brand: {
          productId:
            product.id,

          brand:
            item.outletBrand,
        },
      },

      update: {
        isActive:
          true,
      },

      create: {
        productId:
          product.id,

        brand:
          item.outletBrand,

        isActive:
          true,
      },
    });

    seeded +=
      1;
  }

  const counts =
    STORE_MANAGER_CATALOG.reduce(
      (
        result,
        item
      ) => {
        result[
          item.outletBrand
        ] =
          (
            result[
              item.outletBrand
            ] ||
            0
          ) +
          1;

        return result;
      },
      {}
    );

  const freshAmbient =
    STORE_MANAGER_CATALOG.filter(
      (item) =>
        item.outletBrand ===
          "Fresh" &&
        item.handlingType ===
          "AMBIENT_DRY"
    ).length;

  const freshChilled =
    STORE_MANAGER_CATALOG.filter(
      (item) =>
        item.outletBrand ===
          "Fresh" &&
        item.handlingType ===
          "CHILLED"
    ).length;

  console.log("");
  console.log("==========================================");
  console.log(" Advanced Store Manager Catalog Seed");
  console.log("==========================================");
  console.log(`Products       : ${seeded}`);
  console.log(`Fresh          : ${counts.Fresh || 0}`);
  console.log(`  Ambient/Dry  : ${freshAmbient}`);
  console.log(`  Chilled      : ${freshChilled}`);
  console.log(`Tech           : ${counts.Tech || 0}`);
  console.log(`Style          : ${counts.Style || 0}`);
  console.log("Images         : WebP bytes in MySQL");
  console.log("Prices         : not used");
  console.log("Stock          : not used");
  console.log("==========================================");
  console.log("");
}

async function main() {
  try {
    await connectDatabase();

    await seedCatalog();
  } catch (error) {
    console.error(
      "✗ Advanced Store Manager catalog seed failed."
    );

    console.error(
      error
    );

    process.exitCode =
      1;
  } finally {
    await disconnectDatabase();
  }
}

main();
