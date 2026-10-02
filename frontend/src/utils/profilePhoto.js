const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const MAX_SOURCE_BYTES =
  5 * 1024 * 1024;

const OUTPUT_SIZE =
  320;

const MAX_DATA_URL_LENGTH =
  850_000;


function loadImageFromFile(
  file
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const objectUrl =
        URL.createObjectURL(
          file
        );

      const image =
        new Image();


      image.onload =
        () => {
          URL.revokeObjectURL(
            objectUrl
          );

          resolve(
            image
          );
        };


      image.onerror =
        () => {
          URL.revokeObjectURL(
            objectUrl
          );

          reject(
            new Error(
              "Unable to read that image."
            )
          );
        };


      image.src =
        objectUrl;
    }
  );
}


export async function prepareProfilePhoto(
  file
) {
  if (!(file instanceof File)) {
    throw new Error(
      "Choose a valid image file."
    );
  }


  if (
    !ALLOWED_IMAGE_TYPES.has(
      file.type
    )
  ) {
    throw new Error(
      "Use a JPG, PNG or WebP image."
    );
  }


  if (
    file.size >
    MAX_SOURCE_BYTES
  ) {
    throw new Error(
      "Choose an image smaller than 5 MB."
    );
  }


  const image =
    await loadImageFromFile(
      file
    );

  const shortestSide =
    Math.min(
      image.naturalWidth,
      image.naturalHeight
    );

  const sourceX =
    (
      image.naturalWidth -
      shortestSide
    ) / 2;

  const sourceY =
    (
      image.naturalHeight -
      shortestSide
    ) / 2;

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    OUTPUT_SIZE;

  canvas.height =
    OUTPUT_SIZE;

  const context =
    canvas.getContext(
      "2d"
    );


  if (!context) {
    throw new Error(
      "Your browser could not prepare the profile image."
    );
  }


  context.fillStyle =
    "#ffffff";

  context.fillRect(
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  context.drawImage(
    image,
    sourceX,
    sourceY,
    shortestSide,
    shortestSide,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );


  const dataUrl =
    canvas.toDataURL(
      "image/jpeg",
      0.84
    );


  if (
    dataUrl.length >
    MAX_DATA_URL_LENGTH
  ) {
    throw new Error(
      "That image is still too large after processing. Try another image."
    );
  }


  return dataUrl;
}
