# Password recovery verification

Run from the repository root. No seed or migration is needed for the existing
SM001 account. Never paste an OTP, reset token, password, or SMTP credential into
chat, source code, command history, or logs.

## Automated checks

```powershell
Push-Location backend
npm test
npx tsx src/scripts/testRoleMiddleware.js
npx tsx src/scripts/testStoreManagerMiddleware.js
npx tsx src/scripts/testPasswordReset.js
npm run test:email
Pop-Location
Push-Location frontend
npm run build
Pop-Location
```

The recovery regression script replaces persistence and SMTP with in-memory
test doubles. It exercises the HTTP routes, six-digit OTP generation, HMAC
storage, ten-minute expiry, sixty-second cooldown, five-attempt limit, reset
authorization, replay rejection, password policy/reuse, bcrypt, login, generic
responses, SMTP rejection/authentication errors, and secret-free diagnostics.
It does not change real users or send mail. The existing HTTP security suite
temporarily changes SM001 state and restores it in its cleanup.

`test:email` verifies SMTP connectivity and authentication, not inbox arrival.

## Start the application

In one PowerShell terminal:

```powershell
Set-Location backend
npm run dev
```

In a second terminal, starting from the repository root:

```powershell
Set-Location frontend
npm run dev
```

Use the frontend URL printed by Vite. Restart an already-running backend so it
loads the updated SMTP-only service.

## Browser acceptance checks

1. Open `/login`, select English, Sinhala, or Tamil, then Forgot password.
2. Enter `SM001` or its registered email and submit. The server should report a
   masked recipient and `Password reset email accepted by SMTP`. No OTP appears
   in the terminal or HTTP response. Check the registered inbox and spam folder.
3. Enter the code from the email on the verification page. A wrong code must be
   rejected. Resend remains unavailable for sixty seconds; use the newest email
   after resending. Codes expire after ten minutes with the default settings.
4. Set a new password of at least ten characters including uppercase, lowercase,
   a number, and a special character. Confirm it, then use Back to sign in and
   verify the new password works. This step changes the real account password.
5. Repeat the layout checks at 320px, 375px, 768px, and desktop width, in all three
   languages and both themes. Utility controls, branding, and card share one
   centered column. On narrow screens the language/theme group may wrap together.
   Translated headings and buttons must wrap without horizontal page overflow.
6. Switch languages after resending: the fixed confirmation should switch too.
   Language selection must persist through navigation and reload. Account IDs,
   email addresses, and numeric codes remain unchanged.
7. Open `/forgot-password?portal=admin`: follow recovery with a registered admin
   account and check that navigation retains `portal=admin` and Back to sign in
   returns to `/admin/login`.

## Optional HTTP walkthrough in PowerShell

Run with the backend listening. This changes SM001's password only when the final
reset request is submitted. Sensitive inputs use hidden prompts; responses with
reset/access tokens are assigned to variables rather than printed.

```powershell
$api = 'http://localhost:5000/api/auth'
$identifier = 'SM001'
function Read-PrivateValue([string]$Prompt) {
    $secureValue = Read-Host $Prompt -AsSecureString
    return [System.Net.NetworkCredential]::new('', $secureValue).Password
}
function Invoke-AuthPost([string]$Path, [hashtable]$Payload) {
    Invoke-RestMethod -Method Post -Uri "$api/$Path" `
        -ContentType 'application/json' -TimeoutSec 60 `
        -Body ($Payload | ConvertTo-Json -Compress)
}
try {
    $requested = Invoke-AuthPost 'forgot-password' @{ identifier = $identifier }
    Write-Host $requested.message
    $otp = Read-PrivateValue 'Enter the code from your registered inbox'
    $verified = Invoke-AuthPost 'verify-reset-otp' @{ identifier = $identifier; otp = $otp }
    $newPassword = Read-PrivateValue 'New strong password'
    $confirmation = Read-PrivateValue 'Confirm new password'
    $reset = Invoke-AuthPost 'reset-password' @{
        resetToken = $verified.resetToken
        newPassword = $newPassword
        confirmPassword = $confirmation
    }
    Write-Host $reset.message
    $login = Invoke-AuthPost 'login' @{ identifier = $identifier; password = $newPassword }
    Write-Host ('Login successful: ' + $login.success)
} finally {
    Remove-Variable otp, verified, newPassword, confirmation, login -ErrorAction SilentlyContinue
}
```

## Environment names

Configure in `backend/.env`; never commit that file.

| Variable | Purpose |
| --- | --- |
| `EMAIL_DELIVERY_MODE` | Optional explicit SMTP mode; SMTP is the default. Console mode is rejected. |
| `SMTP_HOST` | Provider SMTP hostname |
| `SMTP_PORT` | Provider SMTP port |
| `SMTP_SECURE` | Implicit TLS setting; STARTTLS is required when false |
| `SMTP_USER` | SMTP authentication account |
| `SMTP_PASSWORD` | Provider SMTP credential; Gmail App Password where supported |
| `SMTP_FROM` | Authorized sender; defaults to SMTP_USER |
| `PASSWORD_RESET_OTP_SECRET` | Existing independent HMAC secret |
| `PASSWORD_RESET_TOKEN_SECRET` | Existing independent reset JWT secret |
| `PASSWORD_RESET_OTP_EXPIRY_MINUTES` | Existing OTP lifetime |
| `PASSWORD_RESET_OTP_RESEND_SECONDS` | Existing resend cooldown |
| `PASSWORD_RESET_OTP_MAX_ATTEMPTS` | Existing failed-attempt limit |
| `PASSWORD_RESET_TOKEN_EXPIRES_IN` | Existing reset token lifetime |
| `STORE_MANAGER_SEED_EMAIL` | Seed-only registered recipient; no runtime override |

Google documents Gmail SMTP authentication and App Password requirements at
https://support.google.com/a/answer/176600. The inspected local credentials passed
SMTP authentication, so replacement credentials were not needed.

SMTP acceptance does not guarantee inbox placement. The API intentionally gives
the same response for unknown/inactive accounts, cooldowns, and mail failures;
inspect safe backend diagnostics for `EAUTH`, `ETIMEDOUT`, `EMAIL_CONFIGURATION`,
or `SMTP_NOT_ACCEPTED` rather than exposing account existence to the client.
