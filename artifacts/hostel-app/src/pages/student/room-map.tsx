import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DoorClosed, Layers } from "lucide-react";

interface RoomData {
  id: number;
  roomNumber: string;
  floor: number;
  blockName: string;
  capacity: number;
  currentOccupancy: number;
  status: "available" | "full" | "maintenance";
  occupants: { id: number; rollNumber: string }[];
}

interface FloorData {
  floor: number;
  label: string;
  rooms: RoomData[];
}

interface RoomMapProps {
  currentRoomId?: number | null;
  studentId?: number;
}

export default function RoomMap({ currentRoomId, studentId }: RoomMapProps) {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [hoveredRoom, setHoveredRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rooms/floor-map")
      .then(r => r.json())
      .then(data => {
        setFloors(data.floors || []);
        // If current room exists, auto-select its floor
        if (currentRoomId && data.floors) {
          for (const f of data.floors) {
            if (f.rooms.some((r: RoomData) => r.id === currentRoomId)) {
              setSelectedFloor(f.floor);
              break;
            }
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentRoomId]);

  const currentFloor = floors.find(f => f.floor === selectedFloor);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-muted/50 rounded-xl" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted/30 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Hostel Room Map</h3>
          <p className="text-xs text-muted-foreground">3-Floor Building • Click to view room details</p>
        </div>
      </div>

      {/* Floor Selector Tabs */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl backdrop-blur-sm border border-border/50">
        {floors.map(f => {
          const availableCount = f.rooms.filter(r => r.status === "available").length;
          const isActive = f.floor === selectedFloor;
          return (
            <button
              key={f.floor}
              onClick={() => setSelectedFloor(f.floor)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg
                text-sm font-semibold transition-all duration-300 relative overflow-hidden
                ${isActive
                  ? "bg-gradient-to-r from-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }
              `}
            >
              <Layers className="h-4 w-4" />
              <span>{f.label}</span>
              <span className={`
                text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${isActive ? "bg-white/20 text-primary-foreground" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"}
              `}>
                {availableCount} free
              </span>
            </button>
          );
        })}
      </div>

      {/* Room Grid */}
      {currentFloor && (
        <div className="relative">
          {/* Floor Plan Container */}
          <div className="border border-border/50 rounded-2xl bg-gradient-to-b from-muted/20 to-background p-6 relative overflow-hidden">
            {/* Corridor indicator */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-16 bg-muted/20 border-x border-dashed border-border/30 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/50 font-medium tracking-wider rotate-90 whitespace-nowrap">
                CORRIDOR
              </span>
            </div>

            {/* Rooms - Left Side */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left wing */}
              <div className="space-y-3 pr-6">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-2">← Left Wing</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentFloor.rooms
                    .filter((_, i) => i < Math.ceil(currentFloor.rooms.length / 2))
                    .map(room => (
                      <RoomCell
                        key={room.id}
                        room={room}
                        isCurrentRoom={room.id === currentRoomId}
                        onHover={setHoveredRoom}
                        isHovered={hoveredRoom?.id === room.id}
                      />
                    ))}
                </div>
              </div>

              {/* Right wing */}
              <div className="space-y-3 pl-6">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-2 text-right">Right Wing →</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentFloor.rooms
                    .filter((_, i) => i >= Math.ceil(currentFloor.rooms.length / 2))
                    .map(room => (
                      <RoomCell
                        key={room.id}
                        room={room}
                        isCurrentRoom={room.id === currentRoomId}
                        onHover={setHoveredRoom}
                        isHovered={hoveredRoom?.id === room.id}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hovered room tooltip */}
          {hoveredRoom && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full z-50">
              <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl p-4 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <DoorClosed className="h-4 w-4 text-primary" />
                  <span className="font-bold text-foreground">Room {hoveredRoom.roomNumber}</span>
                  {hoveredRoom.id === currentRoomId && (
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">YOUR ROOM</span>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block</span>
                    <span className="font-medium">{hoveredRoom.blockName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium">{hoveredRoom.currentOccupancy}/{hoveredRoom.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-semibold capitalize ${
                      hoveredRoom.status === "available" ? "text-emerald-500" :
                      hoveredRoom.status === "maintenance" ? "text-red-500" : "text-muted-foreground"
                    }`}>
                      {hoveredRoom.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/30 backdrop-blur-sm">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/30" />
          <span className="text-xs text-foreground font-medium">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md bg-gradient-to-br from-gray-400 to-gray-600 shadow-sm" />
          <span className="text-xs text-foreground font-medium">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md bg-gradient-to-br from-primary/80 to-primary shadow-sm shadow-primary/30 ring-2 ring-primary/40 ring-offset-1 ring-offset-background" />
          <span className="text-xs text-foreground font-medium">Your Room</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md bg-gradient-to-br from-red-400 to-red-600 shadow-sm shadow-red-500/30" />
          <span className="text-xs text-foreground font-medium">Maintenance</span>
        </div>
      </div>

      {/* Stats Row */}
      {currentFloor && (
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {currentFloor.rooms.filter(r => r.status === "available").length}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 font-semibold">Available</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-2xl font-bold text-muted-foreground">
              {currentFloor.rooms.filter(r => r.status === "full").length}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">Occupied</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {currentFloor.rooms.filter(r => r.status === "maintenance").length}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-red-600/70 dark:text-red-400/70 font-semibold">Maintenance</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Individual Room Cell ────────────────────────────────────────────────────

function RoomCell({
  room,
  isCurrentRoom,
  onHover,
  isHovered,
}: {
  room: RoomData;
  isCurrentRoom: boolean;
  onHover: (r: RoomData | null) => void;
  isHovered: boolean;
}) {
  let bgClass = "";
  let borderClass = "";
  let textClass = "";
  let glowClass = "";

  if (isCurrentRoom) {
    bgClass = "bg-gradient-to-br from-primary/30 to-primary/10";
    borderClass = "border-primary/60 ring-2 ring-primary/30 ring-offset-1 ring-offset-background";
    textClass = "text-primary";
    glowClass = "shadow-lg shadow-primary/20 animate-pulse";
  } else if (room.status === "available") {
    bgClass = "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5";
    borderClass = "border-emerald-500/30 hover:border-emerald-500/60";
    textClass = "text-emerald-600 dark:text-emerald-400";
  } else if (room.status === "maintenance") {
    bgClass = "bg-gradient-to-br from-red-500/20 to-red-500/5";
    borderClass = "border-red-500/30";
    textClass = "text-red-500";
  } else {
    // full / occupied
    bgClass = "bg-gradient-to-br from-gray-500/15 to-gray-500/5";
    borderClass = "border-gray-500/20";
    textClass = "text-muted-foreground";
  }

  return (
    <div
      onMouseEnter={() => onHover(room)}
      onMouseLeave={() => onHover(null)}
      className={`
        relative p-3 rounded-xl border cursor-pointer
        transition-all duration-300 ease-out
        ${bgClass} ${borderClass} ${glowClass}
        ${isHovered ? "scale-105 shadow-xl -translate-y-0.5" : "hover:scale-[1.02]"}
      `}
    >
      {/* Room number */}
      <div className={`text-sm font-bold ${textClass}`}>
        {room.roomNumber}
      </div>

      {/* Occupancy indicator */}
      <div className="flex items-center gap-1 mt-1.5">
        <Users className={`h-3 w-3 ${textClass}`} />
        <span className="text-[10px] text-muted-foreground font-medium">
          {room.currentOccupancy}/{room.capacity}
        </span>
      </div>

      {/* Current room badge */}
      {isCurrentRoom && (
        <div className="absolute -top-1 -right-1">
          <div className="h-3 w-3 rounded-full bg-primary animate-ping absolute" />
          <div className="h-3 w-3 rounded-full bg-primary relative" />
        </div>
      )}

      {/* Status dot */}
      {!isCurrentRoom && (
        <div className={`absolute top-2 right-2 h-2 w-2 rounded-full ${
          room.status === "available" ? "bg-emerald-500" :
          room.status === "maintenance" ? "bg-red-500" : "bg-gray-400"
        }`} />
      )}
    </div>
  );
}
