import cloudinary from "./cloudinary.js";
import s3Client, { S3_CONFIG } from "./aws-s3.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

class UploadService {
  constructor() {
    this.defaultProvider = process.env.DEFAULT_UPLOAD_PROVIDER || "cloudinary"; // 'cloudinary' or 's3'
  }

  // Generate unique filename
  generateUniqueFilename(originalName, folder = "") {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(6).toString("hex");
    const extension = originalName.split(".").pop();
    const baseName = originalName.split(".").slice(0, -1).join(".");
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");

    const filename = `${safeName}_${timestamp}_${randomString}.${extension}`;
    return folder ? `${folder}/${filename}` : filename;
  }

  // Upload to Cloudinary
  async uploadToCloudinary(imageData, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(imageData, {
        folder: options.folder || "babyshop",
        transformation: options.transformation || [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
        ...options,
      });

      return {
        success: true,
        provider: "cloudinary",
        url: result.secure_url,
        publicId: result.public_id,
        originalName: options.originalName,
        size: result.bytes,
        format: result.format,
      };
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  // Upload to AWS S3
  async uploadToS3(imageBuffer, options = {}) {
    try {
      const filename = this.generateUniqueFilename(
        options.originalName || "image.jpg",
        options.folder || "babyshop"
      );

      const uploadParams = {
        Bucket: S3_CONFIG.bucketName,
        Key: filename,
        Body: imageBuffer,
        ContentType: options.contentType || "image/jpeg",
        // Removed ACL as bucket doesn't allow ACLs
        // Public access will be handled by bucket policy
        Metadata: {
          "original-name": options.originalName || "",
          "upload-date": new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(uploadParams);
      await S3_CONFIG.client.send(command);

      const url = `https://${S3_CONFIG.bucketName}.s3.${S3_CONFIG.region}.amazonaws.com/${filename}`;

      return {
        success: true,
        provider: "s3",
        url: url,
        key: filename,
        originalName: options.originalName,
        size: imageBuffer.length,
        bucket: S3_CONFIG.bucketName,
      };
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  // Main upload method - uses default provider or specified provider
  async uploadImage(imageData, options = {}) {
    const provider = options.provider || this.defaultProvider;

    try {
      if (provider === "s3") {
        // Convert base64 to buffer if needed
        let imageBuffer;
        if (typeof imageData === "string" && imageData.startsWith("data:")) {
          // Base64 data URL
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
          imageBuffer = Buffer.from(base64Data, "base64");

          // Extract content type
          const contentTypeMatch = imageData.match(/^data:([^;]+);/);
          if (contentTypeMatch) {
            options.contentType = contentTypeMatch[1];
          }
        } else if (Buffer.isBuffer(imageData)) {
          imageBuffer = imageData;
        } else {
          throw new Error("Invalid image data format for S3 upload");
        }

        return await this.uploadToS3(imageBuffer, options);
      } else {
        return await this.uploadToCloudinary(imageData, options);
      }
    } catch (error) {
      console.error(`Upload failed with ${provider}:`, error.message);

      // Fallback to alternative provider if primary fails
      if (options.enableFallback !== false) {
        const fallbackProvider = provider === "s3" ? "cloudinary" : "s3";

        try {
          return await this.uploadImage(imageData, {
            ...options,
            provider: fallbackProvider,
            enableFallback: false, // Prevent infinite fallback loop
          });
        } catch (fallbackError) {
          throw new Error(
            `Both upload providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`
          );
        }
      }

      throw error;
    }
  }

  // Replace image - uploads new image and deletes the old one
  async replaceImage(newImageData, oldImageUrl, options = {}) {
    try {
      // Upload new image first
      const uploadResult = await this.uploadImage(newImageData, options);

      // If upload successful, delete old image
      if (oldImageUrl && uploadResult.success) {
        try {
          await this.deleteImage(oldImageUrl);
          c;
        } catch (deleteError) {
          console.error(
            `Failed to delete old image ${oldImageUrl}: ${deleteError.message}`
          );
          // Don't fail the operation if old image deletion fails
        }
      }

      return uploadResult;
    } catch (error) {
      throw new Error(`Image replacement failed: ${error.message}`);
    }
  }

  // Delete from Cloudinary
  async deleteFromCloudinary(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: result.result === "ok", provider: "cloudinary" };
    } catch (error) {
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  }

  // Delete from S3
  async deleteFromS3(key) {
    try {
      const deleteParams = {
        Bucket: S3_CONFIG.bucketName,
        Key: key,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await S3_CONFIG.client.send(command);

      return { success: true, provider: "s3" };
    } catch (error) {
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  // Delete image (auto-detects provider based on URL or provides key/publicId)
  async deleteImage(identifier, provider = null) {
    try {
      if (!provider) {
        // Auto-detect provider based on URL pattern
        if (typeof identifier === "string") {
          if (identifier.includes("cloudinary.com")) {
            provider = "cloudinary";
            // Extract public ID from Cloudinary URL
            const matches = identifier.match(/\/v\d+\/(.+)\.[^.]+$/);
            identifier = matches ? matches[1] : identifier;
          } else if (
            identifier.includes("amazonaws.com") ||
            identifier.includes("s3.")
          ) {
            provider = "s3";
            // Extract key from S3 URL
            const matches =
              identifier.match(/amazonaws\.com\/(.+)$/) ||
              identifier.match(/s3\.[^/]+\/[^/]+\/(.+)$/);
            identifier = matches ? matches[1] : identifier;
          }
        }
      }

      if (provider === "s3") {
        return await this.deleteFromS3(identifier);
      } else {
        return await this.deleteFromCloudinary(identifier);
      }
    } catch (error) {
      console.error("Delete failed:", error.message);
      throw error;
    }
  }

  // Generate presigned URL for S3 (for temporary access)
  async generatePresignedUrl(key, expiresIn = 3600) {
    try {
      const command = new PutObjectCommand({
        Bucket: S3_CONFIG.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(S3_CONFIG.client, command, {
        expiresIn: expiresIn, // URL expires in 1 hour by default
      });

      return signedUrl;
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  // Get upload statistics
  getUploadStats() {
    return {
      defaultProvider: this.defaultProvider,
      availableProviders: ["cloudinary", "s3"],
      s3Config: {
        region: S3_CONFIG.region,
        bucket: S3_CONFIG.bucketName,
      },
    };
  }
}

// Export singleton instance
const uploadService = new UploadService();
export default uploadService;

// Export convenience methods for backward compatibility
export const uploadToCloudinary = (imageData, folder) =>
  uploadService.uploadToCloudinary(imageData, { folder });

export const deleteFromCloudinary = (identifier) =>
  uploadService.deleteImage(identifier, "cloudinary");
