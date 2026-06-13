import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListLeaveRequests, useUpdateLeaveRequest } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, X, Calendar, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WardenLeave() {
  const { data: leaves, isLoading, refetch } = useListLeaveRequests();
  const updateMutation = useUpdateLeaveRequest();
  const { toast } = useToast();
  
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState<'warden_approved' | 'rejected'>('warden_approved');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton />;

  const pendingLeaves = leaves?.filter(l => l.status === 'pending') || [];
  const processedLeaves = leaves?.filter(l => l.status !== 'pending') || [];

  const handleOpenDialog = (leave: any, act: 'warden_approved' | 'rejected') => {
    setSelectedLeave(leave);
    setAction(act);
    setRemarks("");
    setIsDialogOpen(true);
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    updateMutation.mutate({ 
      id: selectedLeave.id, 
      data: { status: action, wardenRemarks: remarks } 
    }, {
      onSuccess: () => {
        toast({ title: `Leave ${action === 'warden_approved' ? 'Approved' : 'Rejected'}` });
        setIsDialogOpen(false);
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Leave Approvals" 
        description="Review student leave requests."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'warden_approved' ? 'Approve' : 'Reject'} Leave Request</DialogTitle>
            <DialogDescription>
              Provide optional remarks for this action.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAction} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Textarea 
                placeholder="Enter remarks..." 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                variant={action === 'rejected' ? 'destructive' : 'default'}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Processing..." : `Confirm ${action === 'warden_approved' ? 'Approval' : 'Rejection'}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4">
        {pendingLeaves.map(leave => (
          <Card key={leave.id} className="border-sidebar-border overflow-hidden hover-elevate">
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="flex-1 p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{leave.studentName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{leave.destination}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Duration</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium mt-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-sm space-y-2">
                  <div>
                    <span className="font-semibold text-muted-foreground text-xs uppercase">Reason</span>
                    <p className="text-foreground mt-1">{leave.reason}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground text-xs uppercase">Emergency Contact</span>
                    <p className="text-foreground mt-1 flex items-center gap-1"><Phone className="h-3 w-3"/> {leave.emergencyContact}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/10 border-t md:border-t-0 md:border-l border-border p-6 flex flex-row md:flex-col items-center justify-center gap-3 shrink-0 md:w-48">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                  onClick={() => handleOpenDialog(leave, 'warden_approved')}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
                  onClick={() => handleOpenDialog(leave, 'rejected')}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {pendingLeaves.length === 0 && (
          <div className="p-12 text-center border border-dashed rounded-xl bg-card text-muted-foreground">
            No pending leave requests.
          </div>
        )}
      </div>
      
      {processedLeaves.length > 0 && (
        <div className="mt-8">
           <h3 className="text-lg font-semibold mb-4 text-foreground">Recently Processed</h3>
           <div className="space-y-4">
             {processedLeaves.slice(0,5).map(leave => (
               <Card key={leave.id} className="bg-muted/20">
                 <CardContent className="p-4 flex justify-between items-center">
                   <div>
                     <h4 className="font-semibold">{leave.studentName}</h4>
                     <p className="text-sm text-muted-foreground">{new Date(leave.fromDate).toLocaleDateString()} to {new Date(leave.toDate).toLocaleDateString()}</p>
                   </div>
                   <StatusBadge status={leave.status} />
                 </CardContent>
               </Card>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
