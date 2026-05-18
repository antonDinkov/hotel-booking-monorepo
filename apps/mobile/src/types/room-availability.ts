export type RoomAvailability = {
  availableRooms: number;
  capacity: number;
  name: string;
  pricePerNight: number;
  requiredRooms?: number;
  roomTypeId: number;
  totalRooms: number;
};

export type HotelAvailabilityResult = {
  hasAvailability: boolean;
  rooms: RoomAvailability[];
};
