import "server-only";
import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const requiredEnvVars = [
    "R2_ENDPOINT",
    "R2_BUCKET_NAME",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
] as const;

const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required env variable: ${envVar}`);
    }
}

if (!publicUrl) {
    throw new Error("Missing required env variable: NEXT_PUBLIC_R2_PUBLIC_URL (or R2_PUBLIC_URL)");
}

const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadAvatar(
    userId: string,
    file: File
): Promise<string> {
    console.info("[uploadAvatar] env check", {
        endpoint: Boolean(process.env.R2_ENDPOINT),
        bucket: process.env.R2_BUCKET_NAME,
        publicUrl: Boolean(publicUrl),
        accessKeyId: Boolean(process.env.R2_ACCESS_KEY_ID),
        secretAccessKey: Boolean(process.env.R2_SECRET_ACCESS_KEY),
    });
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("Unsupported image format");
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("File too large");
    }

    const extension = EXTENSION_MAP[file.type];

    if (!extension) {
        throw new Error("Unsupported file extension");
    }

    const key = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;

    console.info("[uploadAvatar] generated key", { key });

    const bytes = await file.arrayBuffer();

    const fileBuffer = Buffer.from(bytes);

    console.info("[uploadAvatar] before PutObjectCommand", {
        bucket: process.env.R2_BUCKET_NAME,
        key,
    });

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
            Body: fileBuffer,
            ContentType: file.type,
            CacheControl: "public, max-age=31536000, immutable",
        })
    );

    console.info("[uploadAvatar] upload complete", { key });

    return key;
}

export function getPublicImageUrl(key: string): string {
    return `${publicUrl}/${key}`;
}

export async function deleteAvatar(key: string): Promise<void> {
    console.info("[deleteAvatar] deleting", { key });
    await s3.send(
        new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
        })
    );
    console.info("[deleteAvatar] deleted", { key });
}