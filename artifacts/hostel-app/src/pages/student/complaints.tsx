import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { 
  useListComplaints, 
  useCreateComplaint,
} from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Clock, CheckCircle2, Wrench, Plus, MessageSquare, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ComplaintInputCategory = "plumbing" | "electrical" | "furniture" | "hygiene" | "other";
type ComplaintInputPriority = "low" | "medium" | "high";

export default function StudentComplaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form
  const [category, setCategory] = useState<ComplaintInputCategory>("plumbing");
  const [description, setDescription] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [priority, setPriority] = useState<ComplaintInputPriority>("medium");

  const { data: complaints, isLoading, refetch } = useListComplaints({
    studentId: user?.id
  });

  const createMutation = useCreateComplaint();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !roomNumber) {
      toast({ title: "Validation Error", description: "Description and Room Number are required", variant: "destructive" });
      return;
    }

    createMutation.mutate({ 
      data: { category, description, roomNumber, priority } 
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Complaint registered." });
        setIsOpen(false);
        setDescription("");
        refetch();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to submit complaint.", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <LoadingSkeleton />;

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'plumbing': return <Wrench className="h-5 w-5 text-blue-500" />;
      case 'electrical': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'hygiene': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      default: return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Complaints & Maintenance" 
        description="Report issues in your room or block."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Raise Complaint</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Raise a New Complaint</DialogTitle>
                <DialogDescription>Please provide clear details so our maintenance team can resolve it quickly.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as ComplaintInputCategory)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="hygiene">Hygiene & Cleaning</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as ComplaintInputPriority)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Room / Location</Label>
                  <Input 
                    placeholder="e.g. Room A-204" 
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Describe the issue in detail..." 
                    className="h-32"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complaints?.map(complaint => (
          <Card key={complaint.id} className="flex flex-col hover-elevate transition-all border-sidebar-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(complaint.category)}
                  <CardTitle className="text-base capitalize">{complaint.category}</CardTitle>
                </div>
                <StatusBadge status={complaint.status} />
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-4 pb-2">
              <p className="text-sm text-foreground/90 line-clamp-3">{complaint.description}</p>
              
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <MapPin className="h-3.5 w-3.5" />
                  {complaint.roomNumber}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(complaint.createdAt || '').toLocaleDateString()}
                </div>
              </div>
            </CardContent>
            <div className="p-4 pt-0 mt-auto">
              <Button variant="outline" className="w-full text-xs h-8" disabled>
                <MessageSquare className="mr-2 h-3.5 w-3.5" /> View Thread
              </Button>
            </div>
          </Card>
        ))}
        
        {(!complaints || complaints.length === 0) && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
            <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No active complaints</h3>
            <p className="text-muted-foreground text-sm mt-1">Everything seems to be working fine.</p>
          </div>
        )}
      </div>
    </div>
  );
}
