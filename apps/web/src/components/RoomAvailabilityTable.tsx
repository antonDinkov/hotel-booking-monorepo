"use client";

import { useMemo } from "react";
import type { RoomAvailability } from "@/types/room-availability";

interface RoomAvailabilityTableProps {
  availability: RoomAvailability[];
  guestsCount: number;
  checkInDate: string;
  checkOutDate: string;
  selectedRoomTypeId: number | null;
  roomCounts: Record<number, number>;
  onSelectRoomType: (roomTypeId: number) => void;
  onRoomCountChange: (roomTypeId: number, count: number) => void;
}

export function RoomAvailabilityTable({
  availability,
  guestsCount,
  checkInDate,
  checkOutDate,
  selectedRoomTypeId,
  roomCounts,
  onSelectRoomType,
  onRoomCountChange,
}: RoomAvailabilityTableProps) {
  const hasDates = Boolean(checkInDate && checkOutDate);

  const summaryLabel = useMemo(() => {
    if (!hasDates) return "Add dates to see availability.";
    return `Showing availability for ${guestsCount} guest${guestsCount === 1 ? "" : "s"}.`;
  }, [hasDates, guestsCount]);

  const getRequiredRooms = (room: RoomAvailability) => (
    room.requiredRooms ?? Math.ceil(guestsCount / Math.max(1, room.capacity))
  );

  const getRoomOptions = (room: RoomAvailability) => {
    const requiredRooms = getRequiredRooms(room);
    const optionCount = room.availableRooms - requiredRooms + 1;
    return Array.from({ length: Math.max(0, optionCount) }, (_, i) => requiredRooms + i);
  };

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-slate-950 mb-3">Availability</h2>
      <p className="text-sm text-slate-600 mb-4">{summaryLabel}</p>

      {!hasDates ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Select check-in and check-out dates from search to load availability.
        </div>
      ) : availability.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No available rooms match the current guest count.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Room type</th>
                <th className="px-4 py-3 font-semibold">Capacity</th>
                <th className="px-4 py-3 font-semibold">Price / night</th>
                <th className="px-4 py-3 font-semibold">Available</th>
                <th className="px-4 py-3 font-semibold">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {availability.map((room) => (
                <tr key={room.roomTypeId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{room.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    Up to {room.capacity} guest{room.capacity === 1 ? "" : "s"} each
                  </td>
                  <td className="px-4 py-3 text-slate-900">${room.pricePerNight}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {room.availableRooms} left, {getRequiredRooms(room)} needed
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="roomType"
                        checked={selectedRoomTypeId === room.roomTypeId}
                        onChange={() => onSelectRoomType(room.roomTypeId)}
                      />
                      <select
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                        value={roomCounts[room.roomTypeId] ?? 0}
                        onChange={(e) => onRoomCountChange(room.roomTypeId, Number(e.target.value))}
                        disabled={selectedRoomTypeId !== room.roomTypeId}
                        aria-label={`Select number of rooms for ${room.name}`}
                      >
                        {selectedRoomTypeId === room.roomTypeId ? (
                          getRoomOptions(room).map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))
                        ) : (
                          <option value={0}>0</option>
                        )}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Room count must cover the full guest party for the selected room type.
      </p>

    </section>
  );
}
