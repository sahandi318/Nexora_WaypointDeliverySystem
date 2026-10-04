export const ROLE_HOME_PATHS = {
  ADMIN:
    "/admin/dashboard",

  STORE_MANAGER:
    "/store-manager/dashboard",

  DISPATCHER:
    "/dispatcher/dashboard",

  LOADER:
    "/loader",

  DRIVER:
    "/driver",
};


export function getRoleHomePath(
  role
) {
  return (
    ROLE_HOME_PATHS[role] ||
    "/login"
  );
}