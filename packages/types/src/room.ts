export type Room = {
  id: number;
  hotelId: number;
  name: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
};

export type RoomAvailability = {
  roomTypeId: number;
  name: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
  availableRooms: number;
  requiredRooms?: number;
};

export type HotelAvailabilityResult = {
  hasAvailability: boolean;
  rooms: RoomAvailability[];
};
