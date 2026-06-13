import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { 
  useListLeaveRequests, 
  useCreateLeaveRequest,
  LeaveRequestInput
} from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, MapPin, Clock, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentLeave() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const { data: leaves, isLoading, refetch } = useListLeaveRequests({
    studentId: user?.id
  });

  const createMutation = useCreateLeaveRequest();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate || !destination || !reason || !emergencyContact) {
      toast({ title: "Validation Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    const payload: LeaveRequestInput = {
      fromDate: new Date(fromDate).toISOString(),
      toDate: new Date(toDate).toISOString(),
      destination,
      reason,
      emergencyContact,
    };

    createMutation.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Leave request submitted successfully." });
        setIsOpen(false);
        setFromDate("");
        setToDate("");
        setDestination("");
        setReason("");
        setEmergencyContact("");
        refetch();
      },
      onError: (err) => {
        toast({ title: "Error", description: "Failed to submit leave request.", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Leave Requests" 
        description="Apply for multi-day leave from the hostel."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Apply for Leave</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Leave Application</DialogTitle>
                <DialogDescription>
                  Submit your leave application. Parent approval may be required for extended leaves.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input 
                      id="fromDate" 
                      type="date" 
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate">To Date</Label>
                    <Input 
                      id="toDate" 
                      type="date" 
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination/Address</Label>
                  <Input 
                    id="destination" 
                    placeholder="Where are you going?" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Leave</Label>
                  <Textarea 
                    id="reason" 
                    placeholder="Please provide a valid reason" 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Emergency Contact During Leave</Label>
                  <Input 
                    id="contact" 
                    placeholder="Phone number" 
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
          <CardDescription>Your previous and upcoming leave applications</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!leaves || leaves.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">You haven't requested any leaves yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaves.map((leave) => {
                const isUpcoming = new Date(leave.fromDate) > new Date();
                return (
                  <div key={leave.id} className={`p-6 hover:bg-muted/30 transition-colors ${isUpcoming ? 'bg-primary/5' : ''}`}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{leave.destination}</h4>
                          <StatusBadge status={leave.status} />
                          {isUpcoming && <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-medium">Upcoming</span>}
                        </div>
                        <p className="text-muted-foreground text-sm max-w-2xl">{leave.reason}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-2">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {leave.emergencyContact}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Timeline visualization */}
                      <div className="md:w-48 shrink-0 bg-background rounded-lg border border-border p-3">
                        <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Approval Status</div>
                        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
                          
                          <div className="relative flex items-center gap-3 text-sm">
                            <div className="h-4 w-4 rounded-full bg-emerald-500 border border-background shrink-0 z-10" />
                            <span className="text-foreground">Submitted</span>
                          </div>
                          
                          <div className="relative flex items-center gap-3 text-sm">
                            <div className={`h-4 w-4 rounded-full border border-background shrink-0 z-10 ${
                              ['warden_approved', 'admin_approved'].includes(leave.status) ? 'bg-emerald-500' :
                              leave.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />
                            <span className={leave.status === 'pending' ? 'text-muted-foreground font-medium' : 'text-foreground'}>Warden</span>
                          </div>
                          
                          <div className="relative flex items-center gap-3 text-sm">
                            <div className={`h-4 w-4 rounded-full border border-background shrink-0 z-10 ${
                              leave.status === 'admin_approved' ? 'bg-emerald-500' :
                              leave.status === 'rejected' ? 'bg-red-500' : 'bg-muted'
                            }`} />
                            <span className={['warden_approved', 'pending'].includes(leave.status) ? 'text-muted-foreground font-medium' : 'text-foreground'}>Admin</span>
                          </div>
                          
                        </div>
                        {leave.wardenRemarks && (
                          <div className="mt-3 pt-3 border-t border-border text-xs">
                            <span className="font-semibold text-muted-foreground">Note:</span> {leave.wardenRemarks}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
