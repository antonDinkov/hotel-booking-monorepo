// Availability info per room type for a specific date range and guest count.
export interface RoomAvailability {
  roomTypeId: number;
  name: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
  availableRooms: number;
  // Minimum rooms of this type needed to fit the current guest search.
  requiredRooms?: number;
}
