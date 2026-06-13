import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListStudents, useCreateStudent, StudentInput } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: students, isLoading, refetch } = useListStudents();
  const createMutation = useCreateStudent();

  // Form
  const [formData, setFormData] = useState<StudentInput>({
    name: "", email: "", password: "", rollNumber: "", year: 1, department: "", phone: "", emergencyContact: ""
  });

  if (isLoading) return <LoadingSkeleton />;

  const filtered = students?.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Student added successfully" });
        setIsOpen(false);
        refetch();
        setFormData({ name: "", email: "", password: "", rollNumber: "", year: 1, department: "", phone: "", emergencyContact: "" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Student Master List" 
        description="Manage all students across the campus."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} required />
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
                    <Label>Department</Label>
                    <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} required />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>Save Student</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search students..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Block & Room</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.blockName ? `${student.blockName} • ${student.roomNumber}` : 'Unassigned'}</TableCell>
                  <TableCell><StatusBadge status={student.status || 'active'} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
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
