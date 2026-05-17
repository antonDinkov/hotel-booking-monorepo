import { z } from "zod";

import { isExternalImageUrl } from "@/lib/image-urls";

export const partnerPaymentMethodSchema = z.enum(["stripe", "cash_on_arrival"]);

const directImageUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => isExternalImageUrl(value), "Image URL must be a valid external URL.");

const existingImageSchema = z.object({
  id: z.number().int().positive(),
  sortOrder: z.number().int().min(0),
  isCover: z.boolean(),
});

const directImageSchema = z.object({
  imageKey: directImageUrlSchema,
  sortOrder: z.number().int().min(0),
  isCover: z.boolean(),
});

const fileImageMetaSchema = z.object({
  clientId: z.string().trim().min(1),
  sortOrder: z.number().int().min(0),
  isCover: z.boolean(),
});

export const imageMutationPayloadSchema = z.object({
  existingImages: z.array(existingImageSchema).default([]),
  directImages: z.array(directImageSchema).default([]),
  fileImages: z.array(fileImageMetaSchema).default([]),
});

export const hotelMutationPayloadSchema = z.object({
  name: z.string().trim().min(1),
  location: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  paymentMethods: z.array(partnerPaymentMethodSchema).default([]),
  images: imageMutationPayloadSchema.default({
    existingImages: [],
    directImages: [],
    fileImages: [],
  }),
});

export const roomMutationPayloadSchema = z.object({
  hotelId: z.number().int().positive(),
  name: z.string().trim().min(1),
  capacity: z.number().int().positive(),
  pricePerNight: z.number().int().positive(),
  totalRooms: z.number().int().positive(),
  images: imageMutationPayloadSchema.default({
    existingImages: [],
    directImages: [],
    fileImages: [],
  }),
});

export const roomQuerySchema = z.object({
  hotelId: z.coerce.number().int().positive(),
});
