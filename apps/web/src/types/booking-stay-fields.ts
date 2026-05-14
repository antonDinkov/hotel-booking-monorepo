export type GuestInputVariant = "select" | "number";

export interface BookingStayFieldsProps {
    checkIn: string;
    checkOut: string;
    guests: string;
    onCheckInChange: (value: string) => void;
    onCheckOutChange: (value: string) => void;
    onGuestsChange: (value: string) => void;
    guestInputVariant?: GuestInputVariant;
    maxGuests?: number;
    className?: string;
}