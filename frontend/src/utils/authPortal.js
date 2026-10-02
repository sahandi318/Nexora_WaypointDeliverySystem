export const ADMIN_PORTAL =
  "admin";

export const STAFF_PORTAL =
  "staff";


export function getPortalFromSearchParams(
  searchParams
) {
  return searchParams.get(
    "portal"
  ) === ADMIN_PORTAL
    ? ADMIN_PORTAL
    : STAFF_PORTAL;
}


export function getLoginPathForPortal(
  portal
) {
  return portal ===
    ADMIN_PORTAL
    ? "/admin/login"
    : "/login";
}


export function getLoginPathForRole(
  role
) {
  return role ===
    "ADMIN"
    ? "/admin/login"
    : "/login";
}


export function getRecoveryPath(
  path,
  portal
) {
  return portal ===
    ADMIN_PORTAL
    ? `${path}?portal=admin`
    : path;
}
