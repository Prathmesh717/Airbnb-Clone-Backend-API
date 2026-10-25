import { createHash } from "node:crypto";
import type { AuthContext } from "../lib/server/auth";
import { serverEnv } from "../lib/server/env";
import { ApiError } from "../lib/server/http";

export function createCloudinaryUploadSignature(context: AuthContext) {
  if (context.role !== "HOST" && context.role !== "ADMIN") {
    throw new ApiError(403, "Only hosts can upload listing media");
  }
  if (!serverEnv.cloudinaryCloudName || !serverEnv.cloudinaryApiKey || !serverEnv.cloudinaryApiSecret) {
    throw new ApiError(503, "Cloudinary uploads are not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "stayfolk/listings";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${serverEnv.cloudinaryApiSecret}`)
    .digest("hex");

  return {
    cloudName: serverEnv.cloudinaryCloudName,
    apiKey: serverEnv.cloudinaryApiKey,
    timestamp,
    folder,
    signature,
  };
}
