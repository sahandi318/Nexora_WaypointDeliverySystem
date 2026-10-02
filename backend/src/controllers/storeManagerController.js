// ============================================================
// Nexora Waypoint Delivery System
// Store Manager Controller
// ============================================================


// ============================================================
// GET AUTHENTICATED STORE MANAGER CONTEXT
// ============================================================

/**
 * Returns the authenticated Store Manager's trusted identity,
 * outlet assignment and depot details.
 *
 * SECURITY:
 *
 * The outlet is taken only from:
 *
 *   req.storeManagerContext
 *
 * That context is created from the authenticated database user.
 *
 * This controller deliberately ignores:
 *
 * - req.query.outletId
 * - req.body.outletId
 * - req.params.outletId
 * - req.query.role
 * - req.body.role
 *
 * A Store Manager therefore cannot switch outlet or role by
 * modifying a request from the browser.
 */
export function getStoreManagerContext(
  req,
  res
) {
  const context =
    req.storeManagerContext;


  if (!context) {
    return res
      .status(500)
      .json({
        success: false,

        code:
          "STORE_MANAGER_CONTEXT_MISSING",

        message:
          "Store Manager context is unavailable.",
      });
  }


  return res
    .status(200)
    .json({
      success: true,

      data: {
        user: {
          id:
            context.userDatabaseId,

          userId:
            context.userId,

          fullName:
            context.fullName,

          email:
            context.email,

          role:
            context.role,
        },


        outlet: {
          id:
            context.outletDatabaseId,

          outletCode:
            context.outletCode,

          brand:
            context.brand,

          district:
            context.district,

          dockType:
            context.dockType,

          parkingConstraint:
            context.parkingConstraint,

          mallWindow:
            context.mallWindow,

          windowOpenTime:
            context.windowOpenTime,

          windowCloseTime:
            context.windowCloseTime,

          isActive:
            context.outletIsActive,
        },


        depot:
          context.depot,
      },
    });
}