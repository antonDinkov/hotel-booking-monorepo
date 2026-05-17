export type PartnerPaymentMethod = "stripe" | "cash_on_arrival";

export type PartnerManagedImage = {
  id: number;
  hotelId: number;
  roomTypeId: number | null;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  isCover: boolean;
};

export type PartnerHotelSummary = {
  id: number;
  name: string;
  location: string;
  description: string | null;
  coverImageUrl: string | null;
  roomTypeCount: number;
};

export type PartnerRoomType = {
  id: number;
  hotelId: number;
  name: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
  existingRoomsCount: number;
  images: PartnerManagedImage[];
};

export type PartnerHotelDetails = PartnerHotelSummary & {
  images: PartnerManagedImage[];
  paymentMethods: PartnerPaymentMethod[];
  rooms: PartnerRoomType[];
};

export type PartnerImageDraft = {
  clientId: string;
  source: "existing" | "url" | "file";
  id?: number;
  imageKey?: string;
  imageUrl: string;
  file?: File;
  sortOrder: number;
  isCover: boolean;
};

export type PartnerExistingImageInput = {
  id: number;
  sortOrder: number;
  isCover: boolean;
};

export type PartnerDirectImageInput = {
  imageKey: string;
  sortOrder: number;
  isCover: boolean;
};

export type PartnerFileImageInput = {
  clientId: string;
  file: File;
  sortOrder: number;
  isCover: boolean;
};

export type PartnerImageMutationInput = {
  existingImages: PartnerExistingImageInput[];
  directImages: PartnerDirectImageInput[];
  fileImages: PartnerFileImageInput[];
};

export type PartnerHotelMutationInput = {
  name: string;
  location: string;
  description: string | null;
  paymentMethods: PartnerPaymentMethod[];
  images: PartnerImageMutationInput;
};

export type PartnerRoomMutationInput = {
  hotelId: number;
  name: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
  images: PartnerImageMutationInput;
};

export type PartnerHotelFormProps = {
  mode: "new" | "edit";
  hotel?: PartnerHotelDetails;
};

export type PartnerImageManagerProps = {
  label: string;
  images: PartnerImageDraft[];
  onChange: (images: PartnerImageDraft[]) => void;
  fileInputId: string;
};

export type PartnerRoomFormProps = {
  mode: "new" | "edit";
  hotelId: number;
  room?: PartnerRoomType;
  onCancel?: () => void;
  onSaved?: (room: PartnerRoomType) => void;
};

export type PartnerRoomsManagerProps = {
  hotel: Pick<PartnerHotelDetails, "id" | "name">;
  initialRooms: PartnerRoomType[];
};
