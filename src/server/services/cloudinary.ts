// Lazy-import cloudinary to avoid module-level init during `next build`
let _cloudinary: any = null;

async function getCloudinary() {
  if (!_cloudinary) {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    _cloudinary = cloudinary;
  }
  return _cloudinary;
}

/**
 * Generate a signed upload signature for client-side direct uploads.
 * The client uploads directly to Cloudinary (no file goes through our server).
 */
export async function getUploadSignature(folder: string = "listings") {
  const cloudinary = await getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);

  const params = {
    timestamp,
    folder,
    transformation: "c_limit,w_1600,h_1600,q_auto,f_auto",
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

/**
 * Delete an image from Cloudinary by public_id
 */
export async function deleteImage(publicId: string) {
  const cloudinary = await getCloudinary();
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Build an optimized Cloudinary URL with transformations
 */
export function buildImageUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {}
) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const { width = 800, height = 800, crop = "limit" } = options;
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_${crop},w_${width},h_${height},q_auto,f_auto/${publicId}`;
}
