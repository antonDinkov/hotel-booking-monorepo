import type { PartnerImageDraft, PartnerManagedImage } from "@/types/partner-hotel";

function createClientId(prefix: string, id: number): string {
  return `${prefix}-${id}`;
}

export function toImageDrafts(images: PartnerManagedImage[]): PartnerImageDraft[] {
  return images.map((image) => ({
    clientId: createClientId("existing", image.id),
    source: "existing",
    id: image.id,
    imageKey: image.imageKey,
    imageUrl: image.imageUrl,
    sortOrder: image.sortOrder,
    isCover: image.isCover,
  }));
}

export function buildImagePayload(images: PartnerImageDraft[]) {
  return {
    existingImages: images
      .filter((image) => image.source === "existing" && image.id)
      .map((image) => ({
        id: image.id as number,
        sortOrder: image.sortOrder,
        isCover: image.isCover,
      })),
    directImages: images
      .filter((image) => image.source === "url" && image.imageKey)
      .map((image) => ({
        imageKey: image.imageKey as string,
        sortOrder: image.sortOrder,
        isCover: image.isCover,
      })),
    fileImages: images
      .filter((image) => image.source === "file" && image.file)
      .map((image) => ({
        clientId: image.clientId,
        sortOrder: image.sortOrder,
        isCover: image.isCover,
      })),
  };
}

export function appendImageFiles(formData: FormData, images: PartnerImageDraft[]): void {
  for (const image of images) {
    if (image.source !== "file" || !image.file) continue;
    formData.append(`file:${image.clientId}`, image.file);
  }
}
