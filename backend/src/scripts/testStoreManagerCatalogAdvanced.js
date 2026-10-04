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
let token;
let createdOrderId;

function auth(
  req
) {
  return req.set(
    "Authorization",
    `Bearer ${token}`
  );
}

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
      "SM001 with an assigned outlet is required."
    );

    assert.equal(
      user.mustChangePassword,
      false
    );

    token =
      createAccessToken(
        user
      );

    // --------------------------------------------------------
    // Setup / order types
    // --------------------------------------------------------

    const setup =
      await auth(
        request(app)
          .get(
            "/api/store-manager/order-setup"
          )
      );

    assert.equal(
      setup.status,
      200
    );

    assert.equal(
      setup.body.success,
      true
    );

    assert.equal(
      setup.body.data
        .setup.outlet.brand,
      user.outlet.brand
    );

    if (
      user.outlet.brand ===
      "Fresh"
    ) {
      assert.deepEqual(
        setup.body.data
          .setup.availableOrderTypes,
        [
          "AMBIENT_DRY",
          "CHILLED",
        ]
      );
    }

    console.log(
      "✓ available order types are derived from DB products"
    );

    // --------------------------------------------------------
    // Pagination: Fresh ambient has exactly 20 seeded items.
    // Tech/Style also exercise 20-per-page through their own users.
    // --------------------------------------------------------

    const ambient =
      await auth(
        request(app)
          .get(
            "/api/store-manager/catalog"
          )
          .query({
            orderType:
              "AMBIENT_DRY",

            page:
              1,

            pageSize:
              20,
          })
      );

    assert.equal(
      ambient.status,
      200
    );

    assert.ok(
      ambient.body.data
        .products.length <=
        20
    );

    assert.equal(
      ambient.body.data
        .pagination.pageSize,
      20
    );

    for (
      const product
      of ambient.body.data
        .products
    ) {
      assert.equal(
        product.handlingType,
        "AMBIENT_DRY"
      );

      assert.ok(
        product.manufacturerBrand
      );

      assert.ok(
        product.productType
      );

      assert.ok(
        product.unitWeightKg >
        0
      );

      assert.ok(
        product.unitVolumeM3 >
        0
      );

      assert.equal(
        product.imageMimeType,
        "image/webp"
      );

      assert.ok(
        product.imageBase64
      );
    }

    console.log(
      "✓ catalog provides paginated logistics metadata and DB images"
    );

    // --------------------------------------------------------
    // Search suggestions
    // --------------------------------------------------------

    if (
      user.outlet.brand ===
      "Fresh"
    ) {
      const search =
        await auth(
          request(app)
            .get(
              "/api/store-manager/catalog"
            )
            .query({
              orderType:
                "CHILLED",

              search:
                "yog",

              page:
                1,

              pageSize:
                20,
            })
        );

      assert.equal(
        search.status,
        200
      );

      assert.ok(
        search.body.data
          .products.length >=
        3
      );

      assert.ok(
        search.body.data
          .suggestions.length >=
        3
      );

      assert.ok(
        search.body.data
          .categories.includes(
            "Dairy"
          )
      );

      console.log(
        "✓ server-side search, suggestions and dynamic categories work"
      );

      // ------------------------------------------------------
      // Order type mismatch must be rejected.
      // ------------------------------------------------------

      const ambientProduct =
        ambient.body.data
          .products[0];

      const mismatch =
        await auth(
          request(app)
            .post(
              "/api/store-manager/orders"
            )
            .send({
              orderType:
                "CHILLED",

              items: [
                {
                  productId:
                    ambientProduct.id,

                  quantity:
                    1,
                },
              ],
            })
        );

      assert.equal(
        mismatch.status,
        400
      );

      assert.equal(
        mismatch.body.code,
        "STORE_ORDER_PRODUCT_TYPE_MISMATCH"
      );

      console.log(
        "✓ ambient product cannot be submitted in a chilled order"
      );

      // ------------------------------------------------------
      // Backend totals
      // ------------------------------------------------------

      const chilled =
        search.body.data
          .products.slice(
            0,
            2
          );

      assert.equal(
        chilled.length,
        2
      );

      const quantities = [
        3,
        5,
      ];

      const expectedWeight =
        Number(
          (
            chilled[0]
              .unitWeightKg *
              quantities[0] +
            chilled[1]
              .unitWeightKg *
              quantities[1]
          ).toFixed(
            3
          )
        );

      const expectedVolume =
        Number(
          (
            chilled[0]
              .unitVolumeM3 *
              quantities[0] +
            chilled[1]
              .unitVolumeM3 *
              quantities[1]
          ).toFixed(
            6
          )
        );

      const created =
        await auth(
          request(app)
            .post(
              "/api/store-manager/orders"
            )
            .send({
              orderType:
                "CHILLED",

              // Forged totals must be ignored.
              estimatedWeightKg:
                99999,

              estimatedVolumeM3:
                99999,

              storeManagerNote:
                "Please keep this order together for outlet receiving.",

              items: [
                {
                  productId:
                    chilled[0].id,

                  quantity:
                    quantities[0],
                },
                {
                  productId:
                    chilled[1].id,

                  quantity:
                    quantities[1],
                },
              ],
            })
        );

      assert.equal(
        created.status,
        201
      );

      createdOrderId =
        created.body.data
          .order.id;

      assert.equal(
        created.body.data
          .order.orderType,
        "CHILLED"
      );

      assert.equal(
        created.body.data
          .order.totalUnits,
        8
      );

      assert.equal(
        created.body.data
          .order.estimatedWeightKg,
        expectedWeight
      );

      assert.equal(
        created.body.data
          .order.estimatedVolumeM3,
        expectedVolume
      );

      assert.equal(
        created.body.data
          .order.storeManagerNote,
        "Please keep this order together for outlet receiving."
      );

      const dbOrder =
        await prisma.storeOrder.findUnique({
          where: {
            id:
              createdOrderId,
          },
        });

      assert.equal(
        Number(
          dbOrder.estimatedWeightKg
        ),
        expectedWeight
      );

      assert.equal(
        Number(
          dbOrder.estimatedVolumeM3
        ),
        expectedVolume
      );

      assert.equal(
        dbOrder.storeManagerNote,
        "Please keep this order together for outlet receiving."
      );

      console.log(
        "✓ backend recalculates totals and stores the Store Manager note"
      );
    }

    console.log(
      "Passed advanced Store Manager catalog/order tests"
    );
  } finally {
    if (
      createdOrderId
    ) {
      await prisma.storeOrder.delete({
        where: {
          id:
            createdOrderId,
        },
      });
    }

    await disconnectDatabase();
  }
}

main().catch(
  (error) => {
    console.error(
      "Advanced Store Manager catalog/order tests failed:"
    );

    console.error(
      error
    );

    process.exitCode =
      1;
  }
);
