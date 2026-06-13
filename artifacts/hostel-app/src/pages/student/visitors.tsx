import React from "react";
import { useAuth } from "@/lib/auth";
import { useListVisitors } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default function StudentVisitors() {
  const { user } = useAuth();
  const { data: visitors, isLoading } = useListVisitors({ studentId: user?.id });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Visitor Passes" 
        description="Pre-approve family and friends to visit you on campus."
        action={
          <Button><Plus className="h-4 w-4 mr-2" /> New Visitor Request</Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Visitor Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Visitor Name</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Expected Arrival</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.visitorName}</TableCell>
                  <TableCell>{v.relation}</TableCell>
                  <TableCell>{new Date(v.expectedArrival).toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                  <TableCell>
                    {v.status === 'approved' && (
                      <Button variant="outline" size="sm" className="h-8 text-xs text-primary border-primary hover:bg-primary/10">
                        View Pass
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!visitors || visitors.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 mb-3 text-muted-foreground/30" />
                      <p>No visitor requests found.</p>
                    </div>
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
