import React from "react";
import { useAuth } from "@/lib/auth";
import { useListMessMenus } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Coffee, Moon } from "lucide-react";

export default function StudentMess() {
  const { user } = useAuth();
  
  // Fetch current week menu
  const { data: menus, isLoading } = useListMessMenus();

  if (isLoading) return <LoadingSkeleton />;

  const currentMenu = menus && menus.length > 0 ? menus[0] : null;

  const getMealIcon = (type: string) => {
    if (type === 'breakfast') return <Coffee className="h-5 w-5 text-amber-500" />;
    if (type === 'lunch') return <Utensils className="h-5 w-5 text-emerald-500" />;
    return <Moon className="h-5 w-5 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mess & Menu" 
        description="View this week's menu and track your dining attendance."
      />

      {currentMenu ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">This Week's Menu</h3>
            <span className="text-sm text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">
              Week of {new Date(currentMenu.weekStart).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentMenu.items.map((dayItem: any) => (
              <Card key={dayItem.day} className="border-sidebar-border hover-elevate transition-all overflow-hidden flex flex-col">
                <div className="bg-primary/10 py-3 px-4 border-b border-primary/20">
                  <h4 className="font-bold text-primary capitalize text-center">{dayItem.day}</h4>
                </div>
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="p-4 border-b border-border flex-1">
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {getMealIcon('breakfast')} Breakfast
                    </div>
                    <p className="text-sm font-medium text-foreground">{dayItem.breakfast}</p>
                  </div>
                  <div className="p-4 border-b border-border flex-1">
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {getMealIcon('lunch')} Lunch
                    </div>
                    <p className="text-sm font-medium text-foreground">{dayItem.lunch}</p>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {getMealIcon('dinner')} Dinner
                    </div>
                    <p className="text-sm font-medium text-foreground">{dayItem.dinner}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Utensils className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">No menu published yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">The warden hasn't published the menu for this week. Check back later.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
