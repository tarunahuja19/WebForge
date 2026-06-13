import React, { useState } from "react";
import { useListStaff, useCreateStaff, StaffMemberInput } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminStaff() {
  const { data: staff, isLoading, refetch } = useListStaff();
  const createMutation = useCreateStaff();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState<StaffMemberInput>({
    name: "", email: "", password: "", role: "warden", department: "hostel", phone: ""
  });

  if (isLoading) return <LoadingSkeleton />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Staff added" });
        setIsOpen(false);
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Staff Management" 
        description="Manage wardens, admins, and gate staff."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Staff</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required />
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Performance Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{member.role}</Badge></TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.performanceScore ? `${member.performanceScore}/10` : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
