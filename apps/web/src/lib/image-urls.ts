const CLOUD_IMAGE_PREFIXES = ["hotels/", "avatars/"];

function getR2PublicBaseUrl(): string | null {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;
  return publicUrl ? publicUrl.replace(/\/+$/, "") : null;
}

export function isExternalImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isCloudflareImageKey(value: string): boolean {
  return CLOUD_IMAGE_PREFIXES.some((prefix) => value.startsWith(prefix)) && !isExternalImageUrl(value);
}

export function resolveImageUrl(imageKey: string): string {
  if (isExternalImageUrl(imageKey)) return imageKey;
  if (!isCloudflareImageKey(imageKey)) return imageKey;

  const publicBaseUrl = getR2PublicBaseUrl();
  if (!publicBaseUrl) return imageKey;

  return `${publicBaseUrl}/${imageKey.replace(/^\/+/, "")}`;
}
