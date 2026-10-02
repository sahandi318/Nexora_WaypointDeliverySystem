import api from "./api";


// ============================================================
// STORE MANAGER CONTEXT
// ============================================================

/**
 * Loads the authenticated Store Manager's trusted operational
 * context from the backend.
 *
 * The backend determines:
 *
 * - authenticated user
 * - role
 * - assigned outlet
 * - depot
 *
 * The browser never supplies or selects these values.
 */
export async function getStoreManagerContext({
  signal,
} = {}) {
  const response =
    await api.get(
      "/store-manager/context",
      {
        signal,
      }
    );


  const responseData =
    response.data;


  if (
    !responseData?.success ||
    !responseData?.data
  ) {
    throw new Error(
      "The server returned an invalid Store Manager context response."
    );
  }


  return responseData.data;
}