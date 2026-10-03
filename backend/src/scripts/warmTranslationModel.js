import "dotenv/config";

import {
  warmLocalTranslationModel,
} from "../services/localTranslationModel.js";


async function main() {
  console.log("");
  console.log(
    "=========================================="
  );
  console.log(
    " Nexora Local Translation Model Warmup"
  );
  console.log(
    "=========================================="
  );


  const status =
    await warmLocalTranslationModel();


  console.log("");
  console.log(
    "Model ready:"
  );
  console.log(
    status
  );
}


main()
  .catch(
    (error) => {
      console.error("");
      console.error(
        "Translation model warmup failed:"
      );
      console.error(
        error
      );

      process.exitCode =
        1;
    }
  );
