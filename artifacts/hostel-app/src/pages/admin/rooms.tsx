import React, { useState } from "react";
import { useListRooms, useCreateRoom, RoomInput } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Users, Grid3X3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminRooms() {
  const { data: rooms, isLoading, refetch } = useListRooms();
  const createMutation = useCreateRoom();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState<RoomInput>({
    roomNumber: "", blockId: 1, floor: 1, capacity: 2, amenities: ["Wi-Fi", "AC"]
  });

  if (isLoading) return <LoadingSkeleton />;

  const filtered = rooms?.filter(r => r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Room added" });
        setIsOpen(false);
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Room Management" 
        description="View and manage hostel room allocations."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Room</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Input value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Block ID</Label>
                    <Input type="number" value={formData.blockId} onChange={e => setFormData({...formData, blockId: parseInt(e.target.value)})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Floor</Label>
                    <Input type="number" value={formData.floor} onChange={e => setFormData({...formData, floor: parseInt(e.target.value)})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} required />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search rooms..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon"><Grid3X3 className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Room</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.roomNumber}</TableCell>
                  <TableCell>{room.blockName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{room.currentOccupancy} / {room.capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={room.status || 'available'} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Manage Allocation</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
