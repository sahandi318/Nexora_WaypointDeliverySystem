import assert from "node:assert/strict";

import request from "supertest";

import app from "../app.js";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  createAccessToken,
} from "../utils/jwt.js";

const USER_ID =
  process.env.TEST_STORE_MANAGER_USER_ID ||
  "SM001";

let user;
let allowedProduct;
let foreignProduct;

async function main() {
  try {
    await connectDatabase();

    user =
      await prisma.user.findUnique({
        where: {
          userId:
            USER_ID,
        },

        include: {
          outlet:
            true,
        },
      });

    assert.ok(
      user?.outlet,
      "Store Manager with an outlet is required."
    );

    assert.equal(
      user.mustChangePassword,
      false
    );

    const foreignBrand =
      user.outlet.brand ===
        "Tech"
        ? "Fresh"
        : "Tech";

    const suffix =
      Date.now();

    allowedProduct =
      await prisma.product.create({
        data: {
          sku:
            `TEST-BRAND-OK-${suffix}`,

          name:
            "Allowed Brand Test Product",

          source:
            "TEST_FIXTURE",

          isActive:
            true,

          imageData:
            Buffer.from(
              "<svg></svg>"
            ),

          imageMimeType:
            "image/svg+xml",

          brandAssignments: {
            create: {
              brand:
                user.outlet.brand,
            },
          },
        },
      });

    foreignProduct =
      await prisma.product.create({
        data: {
          sku:
            `TEST-BRAND-NO-${suffix}`,

          name:
            "Foreign Brand Test Product",

          source:
            "TEST_FIXTURE",

          isActive:
            true,

          imageData:
            Buffer.from(
              "<svg></svg>"
            ),

          imageMimeType:
            "image/svg+xml",

          brandAssignments: {
            create: {
              brand:
                foreignBrand,
            },
          },
        },
      });

    const token =
      createAccessToken(
        user
      );

    const setup =
      await request(app)
        .get(
          "/api/store-manager/order-setup"
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        );

    assert.equal(
      setup.status,
      200
    );

    assert.equal(
      setup.body.data
        .setup.outlet.brand,
      user.outlet.brand
    );

    assert.equal(
      setup.body.data
        .setup.cutoff.cutoffTime,
      "16:00"
    );

    assert.ok(
      Number.isInteger(
        setup.body.data
          .setup.cutoff
          .remainingSeconds
      )
    );

    console.log(
      "✓ trusted order setup + cutoff countdown"
    );

    const catalog =
      await request(app)
        .get(
          `/api/store-manager/catalog?brand=${encodeURIComponent(
            foreignBrand
          )}`
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        );

    assert.equal(
      catalog.status,
      200
    );

    assert.equal(
      catalog.body.data.brand,
      user.outlet.brand
    );

    const ids =
      new Set(
        catalog.body.data
          .products
          .map(
            (product) =>
              product.id
          )
      );

    assert.equal(
      ids.has(
        allowedProduct.id
      ),
      true
    );

    assert.equal(
      ids.has(
        foreignProduct.id
      ),
      false
    );

    const apiAllowedProduct =
      catalog.body.data
        .products
        .find(
          (product) =>
            product.id ===
            allowedProduct.id
        );

    assert.equal(
      apiAllowedProduct
        .imageMimeType,
      "image/svg+xml"
    );

    assert.ok(
      apiAllowedProduct
        .imageBase64
    );

    console.log(
      "✓ catalog is brand-filtered and returns image bytes from MySQL"
    );

    const rejected =
      await request(app)
        .post(
          "/api/store-manager/orders"
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          brand:
            foreignBrand,

          items: [
            {
              productId:
                foreignProduct.id,

              quantity:
                1,
            },
          ],
        });

    assert.equal(
      rejected.status,
      400
    );

    assert.equal(
      rejected.body.code,
      "STORE_ORDER_PRODUCT_NOT_AVAILABLE_FOR_OUTLET"
    );

    console.log(
      "✓ foreign-brand product submission is rejected"
    );

    console.log(
      "Passed 3/3 outlet-aware catalog tests"
    );
  } finally {
    const ids =
      [
        allowedProduct?.id,
        foreignProduct?.id,
      ].filter(Boolean);

    if (ids.length > 0) {
      await prisma.product.deleteMany({
        where: {
          id: {
            in:
              ids,
          },
        },
      });
    }

    await disconnectDatabase();
  }
}

main().catch(
  (error) => {
    console.error(
      "Outlet-aware catalog tests failed:"
    );
    console.error(error);
    process.exitCode = 1;
  }
);
