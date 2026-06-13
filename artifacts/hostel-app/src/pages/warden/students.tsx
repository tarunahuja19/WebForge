import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListStudents, useGetStudentWellbeing } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ShieldAlert } from "lucide-react";

export default function WardenStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: students, isLoading } = useListStudents();

  if (isLoading) return <LoadingSkeleton />;

  const filtered = students?.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Students Directory" 
        description="Manage and monitor students in your block."
      />

      <Card className="border-sidebar-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, roll no, or room..." 
                className="pl-9 bg-muted/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Student</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Wellbeing</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                        {student.name?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{student.name}</span>
                        <span className="text-xs text-muted-foreground">{student.rollNumber} • {student.year} Year</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{student.roomNumber || 'Unassigned'}</TableCell>
                  <TableCell className="text-sm">{student.phone}</TableCell>
                  <TableCell><StatusBadge status={student.status || 'active'} /></TableCell>
                  <TableCell>
                    {student.wellbeingScore ? (
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          student.wellbeingScore > 8 ? 'bg-emerald-500' :
                          student.wellbeingScore > 5 ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm font-medium">{student.wellbeingScore}/10</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="font-medium text-primary">View Profile</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No students found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
