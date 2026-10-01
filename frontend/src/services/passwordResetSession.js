const PASSWORD_RESET_IDENTIFIER_KEY =
  "nexora_password_reset_identifier";

const PASSWORD_RESET_TOKEN_KEY =
  "nexora_password_reset_token";


// ============================================================
// IDENTIFIER
// ============================================================

export function savePasswordResetIdentifier(
  identifier
) {
  const cleanedIdentifier =
    identifier?.trim();


  if (!cleanedIdentifier) {
    sessionStorage.removeItem(
      PASSWORD_RESET_IDENTIFIER_KEY
    );

    return;
  }


  sessionStorage.setItem(
    PASSWORD_RESET_IDENTIFIER_KEY,
    cleanedIdentifier
  );
}


export function getPasswordResetIdentifier() {
  return sessionStorage.getItem(
    PASSWORD_RESET_IDENTIFIER_KEY
  );
}


// ============================================================
// RESET TOKEN
// ============================================================

export function savePasswordResetToken(
  token
) {
  if (!token) {
    sessionStorage.removeItem(
      PASSWORD_RESET_TOKEN_KEY
    );

    return;
  }


  sessionStorage.setItem(
    PASSWORD_RESET_TOKEN_KEY,
    token
  );
}


export function getPasswordResetToken() {
  return sessionStorage.getItem(
    PASSWORD_RESET_TOKEN_KEY
  );
}


// ============================================================
// CLEAR RECOVERY SESSION
// ============================================================

export function clearPasswordResetSession() {
  sessionStorage.removeItem(
    PASSWORD_RESET_IDENTIFIER_KEY
  );

  sessionStorage.removeItem(
    PASSWORD_RESET_TOKEN_KEY
  );
}


export {
  PASSWORD_RESET_IDENTIFIER_KEY,
  PASSWORD_RESET_TOKEN_KEY,
};