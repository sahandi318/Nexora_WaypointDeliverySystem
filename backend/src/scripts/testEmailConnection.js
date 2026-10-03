import "dotenv/config";
import { verifyMailConnection, getSafeMailError } from "../services/mailService.js";

try {
  await verifyMailConnection();
  console.log("[OK] Mail transport connected and SMTP authentication verified.");
  console.log("[OK] Ready to send; this check does not prove inbox delivery.");
} catch (error) {
  console.error("[ERROR] Email delivery test failed:", getSafeMailError(error));
  process.exitCode = 1;
}
