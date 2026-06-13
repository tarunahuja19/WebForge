import React, { useState } from "react";
import { useListAnnouncements, useCreateAnnouncement, AnnouncementInputTargetRole } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus } from "lucide-react";

export default function AdminAnnouncements() {
  const { data: announcements, isLoading, refetch } = useListAnnouncements();
  const createMutation = useCreateAnnouncement();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<AnnouncementInputTargetRole>("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    createMutation.mutate({ data: { title, content, targetRole } }, {
      onSuccess: () => {
        toast({ title: "Announcement Published" });
        setTitle("");
        setContent("");
        refetch();
      }
    });
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Announcements" 
        description="Broadcast messages to specific roles or the entire campus."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Audience</label>
                  <Select value={targetRole} onValueChange={(v) => setTargetRole(v as AnnouncementInputTargetRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="student">All Students</SelectItem>
                      <SelectItem value="warden">All Wardens</SelectItem>
                      <SelectItem value="parent">All Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Keep it concise" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Type your message here..." className="h-32" required />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Publishing..." : "Publish Announcement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Recent Broadcasts
          </h3>
          <div className="space-y-4">
            {announcements?.map((ann) => (
              <Card key={ann.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-foreground text-lg">{ann.title}</h4>
                    <Badge variant="secondary" className="capitalize">{ann.targetRole}</Badge>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{ann.content}</p>
                  <div className="text-xs text-muted-foreground pt-2 mt-2 border-t border-border">
                    Published on {new Date(ann.createdAt).toLocaleString()} by {ann.createdByName}
                  </div>
                </CardContent>
              </Card>
            ))}
            {announcements?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                No announcements published yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
