import "dotenv/config";

import {
  verifyMailConnection,
} from "../services/mailService.js";


async function main() {
  try {
    console.log(
      "Testing Waypoint SMTP connection..."
    );


    await verifyMailConnection();


    console.log(
      "✓ SMTP email connection verified."
    );

    console.log(
      "✓ Email service is ready."
    );
  } catch (error) {
    console.error(
      "✗ SMTP connection test failed."
    );

    console.error(
      error.message
    );

    process.exitCode = 1;
  }
}


main();