import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";

if (!process.env["DATABASE_URL"]) {
  try {
    process.loadEnvFile();
  } catch {
    // ignore
  }
}

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"]!,
  api_key: process.env["CLOUDINARY_API_KEY"]!,
  api_secret: process.env["CLOUDINARY_API_SECRET"]!,
});

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

export async function deleteFromCloudinary(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
