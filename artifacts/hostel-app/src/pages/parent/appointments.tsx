import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListAppointments, useCreateAppointment, AppointmentInputType } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Video, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ParentAppointments() {
  const { user } = useAuth();
  const { data: appointments, isLoading, refetch } = useListAppointments();
  const createMutation = useCreateAppointment();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [type, setType] = useState<AppointmentInputType>("virtual");

  if (isLoading) return <LoadingSkeleton />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return;

    createMutation.mutate({
      data: {
        wardenId: 1, // Mock
        studentId: user?.id || 1,
        scheduledAt: new Date(scheduledAt).toISOString(),
        type
      }
    }, {
      onSuccess: () => {
        toast({ title: "Appointment Requested" });
        setIsOpen(false);
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Warden Appointments" 
        description="Book a meeting with your ward's hostel warden."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Book Appointment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as AppointmentInputType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual (Video Call)</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>Submit Request</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments?.map(apt => (
          <Card key={apt.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Meeting with Warden</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(apt.scheduledAt).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={apt.status} />
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-muted/50 p-2 rounded-md">
                {apt.type === 'virtual' ? <><Video className="h-4 w-4 text-blue-500" /> Virtual Meeting</> : <><MapPin className="h-4 w-4 text-emerald-500" /> In-Person Meeting</>}
              </div>
            </CardContent>
          </Card>
        ))}
        {appointments?.length === 0 && (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
            No appointments scheduled.
          </div>
        )}
      </div>
    </div>
  );
}
