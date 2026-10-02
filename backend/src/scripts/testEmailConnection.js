import "dotenv/config";

import {
  getEmailDeliveryMode,
  verifyMailConnection,
} from "../services/mailService.js";


async function main() {
  try {
    const mode =
      getEmailDeliveryMode();


    console.log(
      `Testing Waypoint email delivery (${mode})...`
    );


    await verifyMailConnection();


    if (
      mode ===
      "console"
    ) {
      console.log(
        "[OK] Development console email mode is ready."
      );

      console.log(
        "[OK] Password reset OTPs will appear in the backend terminal."
      );

      return;
    }


    console.log(
      "[OK] SMTP email connection verified."
    );

    console.log(
      "[OK] Email service is ready."
    );
  } catch (error) {
    console.error(
      "[ERROR] Email delivery test failed."
    );

    console.error(
      error.message
    );

    process.exitCode = 1;
  }
}


main();
