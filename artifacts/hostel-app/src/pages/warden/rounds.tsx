import React from "react";
import { useAuth } from "@/lib/auth";
import { useListWardenRounds } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Plus } from "lucide-react";

export default function WardenRounds() {
  const { user } = useAuth();
  const { data: rounds, isLoading } = useListWardenRounds({
    // In a real app we'd pass wardenId: user.id
  });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Rounds Log" 
        description="Track your block inspection rounds."
        action={
          <Button><Plus className="h-4 w-4 mr-2" /> Log Round Manually</Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Rounds</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Time</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Warden</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rounds?.map((round) => (
                <TableRow key={round.id}>
                  <TableCell className="font-medium">{new Date(round.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {round.roomNumber}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{round.method}</TableCell>
                  <TableCell>{round.wardenName}</TableCell>
                </TableRow>
              ))}
              {(!rounds || rounds.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No rounds logged yet.
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
