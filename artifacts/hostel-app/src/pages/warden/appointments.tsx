import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, MapPin, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WardenAppointments() {
  const { user } = useAuth();
  const { data: appointments, isLoading, refetch } = useListAppointments();
  const updateMutation = useUpdateAppointment();
  const { toast } = useToast();

  if (isLoading) return <LoadingSkeleton />;

  const upcoming = appointments?.filter(a => a.status === 'pending' || a.status === 'confirmed') || [];

  const handleAction = (id: number, status: 'confirmed' | 'cancelled' | 'completed') => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Appointment ${status}` });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Appointments" 
        description="Manage meetings with parents and students."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upcoming.map(apt => (
          <Card key={apt.id} className="hover-elevate">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{apt.studentName}'s Parent</h3>
                  <StatusBadge status={apt.status} className="mt-1" />
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {apt.type === 'virtual' ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <Calendar className="h-4 w-4" />
                {new Date(apt.scheduledAt).toLocaleString()}
              </div>
              
              {apt.notes && (
                <p className="text-sm">{apt.notes}</p>
              )}

              {apt.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" onClick={() => handleAction(apt.id, 'confirmed')} disabled={updateMutation.isPending}>
                    <Check className="mr-1 h-4 w-4" /> Confirm
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleAction(apt.id, 'cancelled')} disabled={updateMutation.isPending}>
                    <X className="mr-1 h-4 w-4" /> Decline
                  </Button>
                </div>
              )}
              {apt.status === 'confirmed' && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" onClick={() => handleAction(apt.id, 'completed')} disabled={updateMutation.isPending}>
                    <Check className="mr-1 h-4 w-4" /> Mark Completed
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {upcoming.length === 0 && (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl bg-card text-muted-foreground">
            No upcoming appointments.
          </div>
        )}
      </div>
    </div>
  );
}
