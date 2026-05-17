import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

import { isExternalImageUrl, resolveImageUrl } from "@/lib/image-urls";

const requiredEnvVars = [
    "R2_ENDPOINT",
    "R2_BUCKET_NAME",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
] as const;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
];

const EXTENSION_MAP: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

let s3Client: S3Client | null = null;

function assertR2Config(): void {
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required env variable: ${envVar}`);
        }
    }
}

function getR2Client(): S3Client {
    assertR2Config();

    if (!s3Client) {
        s3Client = new S3Client({
            region: "auto",
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
        });
    }

    return s3Client;
}

function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function getFileExtension(file: File): string {
    const extension = EXTENSION_MAP[file.type];
    if (!extension) {
        throw new Error("Unsupported file extension");
    }

    return extension;
}

function validateImageFile(file: File): void {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("Unsupported image format");
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("File too large");
    }
}

async function uploadImageObject(key: string, file: File): Promise<string> {
    validateImageFile(file);

    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    await getR2Client().send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
            Body: fileBuffer,
            ContentType: file.type,
            CacheControl: "public, max-age=31536000, immutable",
        })
    );

    return key;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
    const key = `avatars/${userId}/${randomUUID()}.${getFileExtension(file)}`;
    return uploadImageObject(key, file);
}

export async function uploadHotelImage(
    input: { hotelId: number; roomTypeId?: number | null },
    file: File
): Promise<string> {
    const extension = getFileExtension(file);
    const safeName = sanitizeFilename(file.name) || `image.${extension}`;
    const folder = input.roomTypeId
        ? `hotels/${input.hotelId}/rooms/${input.roomTypeId}`
        : `hotels/${input.hotelId}/general`;
    const key = `${folder}/${randomUUID()}-${safeName}`;

    return uploadImageObject(key, file);
}

export function getPublicImageUrl(key: string): string {
    return resolveImageUrl(key);
}

export async function deleteImageObject(key: string): Promise<void> {
    if (!key || isExternalImageUrl(key)) return;

    await getR2Client().send(
        new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
        })
    );
}

export async function deleteAvatar(key: string): Promise<void> {
    await deleteImageObject(key);
}
