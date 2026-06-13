import React, { useState } from "react";
import { usePredictMessWaste, MessPredictionInput, MessPredictionInputMeal } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Calendar, 
  Utensils, 
  Coffee, 
  Moon, 
  AlertTriangle, 
  TrendingDown, 
  IndianRupee, 
  Sparkles, 
  Users, 
  Trash2,
  ChefHat,
  ArrowRightLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const MENU_ITEMS_BY_MEAL: Record<MessPredictionInputMeal, string[]> = {
  Breakfast: [
    "Masala Dosa",
    "Idli Sambhar",
    "Rava Dosa",
    "Uttapam",
    "Idli Vada Combo",
    "Aloo Paratha",
    "Paneer Paratha",
    "Chole Bhature Breakfast",
    "Puri Sabji",
    "Poha",
    "Plain Upma",
    "Methi Thepla",
    "Bread Butter Jam",
    "Veg Sandwich",
    "Rava Upma",
    "Cornflakes & Milk",
    "Vermicelli Upma",
    "Masala Khichdi",
    "Oats Porridge",
    "Plain Khichdi Breakfast"
  ],
  Lunch: [
    "Kadhai Paneer & Roti",
    "Paneer Butter Masala",
    "Palak Paneer & Rice",
    "Shahi Paneer & Naan",
    "Rajma Chawal",
    "Rajma Masala & Roti",
    "Vegetable Biryani",
    "Chole Bhature",
    "Chole Masala & Rice",
    "Dal Tadka & Rice",
    "Jeera Rice & Dal Fry",
    "Dal Makhani & Roti",
    "Aloo Gobhi & Roti",
    "Mix Veg & Paratha",
    "Veg Khichdi",
    "Moong Dal Khichdi",
    "Lauki Ki Sabji",
    "Lauki Kofta Curry",
    "Tinda Masala & Roti",
    "Tinda Tomato Curry"
  ],
  Dinner: [
    "Paneer Tikka Masala",
    "Matar Paneer & Roti",
    "Paneer Bhurji & Paratha",
    "Paneer Kofta",
    "Chicken Biryani / Veg Biryani",
    "Rajma Masala Dinner",
    "Kashmiri Rajma & Rice",
    "Egg Curry & Rice",
    "Chole Kulche",
    "Amritsari Chole",
    "Dal Fry & Jeera Rice",
    "Bhindi Masala & Roti",
    "Aloo Methi & Paratha",
    "Baingan Bharta & Roti",
    "Yellow Dal & Steamed Rice",
    "Veg Pulao & Raita",
    "Dal Khichdi Dinner",
    "Plain Khichdi & Papad",
    "Lauki Ki Bhurji",
    "Stuffed Tinda Curry"
  ]
};

const POPULAR_ITEMS_BY_MEAL: Record<MessPredictionInputMeal, string[]> = {
  Breakfast: ["Masala Dosa", "Aloo Paratha", "Poha", "Bread Butter Jam"],
  Lunch: ["Kadhai Paneer & Roti", "Rajma Chawal", "Chole Bhature", "Dal Tadka & Rice"],
  Dinner: ["Paneer Tikka Masala", "Chicken Biryani / Veg Biryani", "Chole Kulche", "Matar Paneer & Roti"]
};

export default function MessForecast() {
  const { toast } = useToast();
  
  // Set default date to tomorrow
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [meal, setMeal] = useState<MessPredictionInputMeal>("Lunch");
  const [menu, setMenu] = useState("Rajma Chawal");
  const [examWeek, setExamWeek] = useState(false);
  const [festival, setFestival] = useState(false);
  const [holidayNear, setHolidayNear] = useState(true);
  const [rain, setRain] = useState(false);

  const handleMealChange = (newMeal: MessPredictionInputMeal) => {
    setMeal(newMeal);
    if (newMeal === "Breakfast") setMenu("Masala Dosa");
    else if (newMeal === "Lunch") setMenu("Rajma Chawal");
    else if (newMeal === "Dinner") setMenu("Paneer Tikka Masala");
  };

  const predictMutation = usePredictMessWaste();

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !meal || !menu.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill out Date, Meal, and Menu.",
        variant: "destructive"
      });
      return;
    }

    const payload: MessPredictionInput = {
      date,
      meal,
      menu: menu.trim(),
      examWeek,
      festival,
      holidayNear,
      rain
    };

    predictMutation.mutate({ data: payload }, {
      onSuccess: () => {
        toast({
          title: "Forecast Generated",
          description: "Mess forecast and waste predictions updated successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Prediction Failed",
          description: error?.message || "An error occurred while connecting to the model API.",
          variant: "destructive"
        });
      }
    });
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case "Breakfast":
        return <Coffee className="h-4 w-4 text-amber-500" />;
      case "Lunch":
        return <Utensils className="h-4 w-4 text-emerald-500" />;
      case "Dinner":
        return <Moon className="h-4 w-4 text-indigo-500" />;
      default:
        return <ChefHat className="h-4 w-4 text-primary" />;
    }
  };

  const results = predictMutation.data;
  
  // Custom computations
  const costLoss = results ? results.wasteKg * 80 : 0; // ₹80 per kg cost
  const reductionPercent = results && results.preparedFoodKg > 0 
    ? Math.max(0, Math.min(20, Math.round((results.wasteKg / results.preparedFoodKg) * 2.8 * 100))) 
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto selection:bg-primary/20">
      <PageHeader 
        title="Mess Forecast & Waste Predictor" 
        description="Predict student dining attendance and minimize kitchen food waste using trained machine learning models."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Parameters Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-sidebar-border bg-card/60 backdrop-blur-xl shadow-xl flex flex-col h-full hover:border-primary/20 transition-all duration-300">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary animate-pulse" />
                Forecast Configuration
              </CardTitle>
              <CardDescription>Configure conditions for tomorrow's mess service</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1">
              <form onSubmit={handlePredict} className="space-y-6">
                
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" /> Date
                  </Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-background/40 hover:bg-background/80 focus:bg-background transition-all"
                  />
                </div>

                {/* Meal & Menu row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meal" className="text-sm font-semibold flex items-center gap-1.5">
                      <Utensils className="h-4 w-4 text-muted-foreground" /> Meal
                    </Label>
                    <Select 
                      value={meal} 
                      onValueChange={(v) => handleMealChange(v as MessPredictionInputMeal)}
                    >
                      <SelectTrigger id="meal" className="bg-background/40 hover:bg-background/80 transition-all">
                        <SelectValue placeholder="Select Meal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Breakfast">
                          <span className="flex items-center gap-2">
                            {getMealIcon("Breakfast")} Breakfast
                          </span>
                        </SelectItem>
                        <SelectItem value="Lunch">
                          <span className="flex items-center gap-2">
                            {getMealIcon("Lunch")} Lunch
                          </span>
                        </SelectItem>
                        <SelectItem value="Dinner">
                          <span className="flex items-center gap-2">
                            {getMealIcon("Dinner")} Dinner
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="menu" className="text-sm font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-muted-foreground" /> Menu Item
                    </Label>
                    <Select 
                      value={menu} 
                      onValueChange={setMenu}
                    >
                      <SelectTrigger id="menu" className="bg-background/40 hover:bg-background/80 transition-all">
                        <SelectValue placeholder="Select Dish" />
                      </SelectTrigger>
                      <SelectContent>
                        {MENU_ITEMS_BY_MEAL[meal].map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Suggestions Pills */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Popular Items</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {POPULAR_ITEMS_BY_MEAL[meal].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setMenu(item)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-all border font-medium ${
                          menu === item 
                            ? "bg-primary border-primary text-primary-foreground shadow-md scale-95" 
                            : "bg-background/40 border-border hover:border-primary/40 hover:bg-background"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border/50 my-2" />

                {/* Toggles section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/40 hover:bg-background/50 transition-all">
                    <div className="space-y-0.5">
                      <Label htmlFor="exam-week" className="text-sm font-semibold cursor-pointer">Exam Week</Label>
                      <p className="text-xs text-muted-foreground">Are exams ongoing?</p>
                    </div>
                    <Switch id="exam-week" checked={examWeek} onCheckedChange={setExamWeek} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/40 hover:bg-background/50 transition-all">
                    <div className="space-y-0.5">
                      <Label htmlFor="festival" className="text-sm font-semibold cursor-pointer">Festival Special</Label>
                      <p className="text-xs text-muted-foreground">Is it a major festival day?</p>
                    </div>
                    <Switch id="festival" checked={festival} onCheckedChange={setFestival} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/40 hover:bg-background/50 transition-all">
                    <div className="space-y-0.5">
                      <Label htmlFor="holiday-near" className="text-sm font-semibold cursor-pointer">Holiday Near</Label>
                      <p className="text-xs text-muted-foreground">Is there a holiday today/tomorrow?</p>
                    </div>
                    <Switch id="holiday-near" checked={holidayNear} onCheckedChange={setHolidayNear} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/40 hover:bg-background/50 transition-all">
                    <div className="space-y-0.5">
                      <Label htmlFor="rain" className="text-sm font-semibold cursor-pointer">Monsoon / Rain</Label>
                      <p className="text-xs text-muted-foreground">Is it raining heavily?</p>
                    </div>
                    <Switch id="rain" checked={rain} onCheckedChange={setRain} />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-sm font-bold shadow-lg hover:shadow-primary/20 py-6 transition-all duration-300 hover:scale-[1.01]" 
                  disabled={predictMutation.isPending}
                >
                  {predictMutation.isPending ? "Chaining Models..." : "Predict Waste"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Prediction Results Display */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[450px]">
          <AnimatePresence mode="wait">
            {predictMutation.isPending ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1"
              >
                <Card className="h-full border-sidebar-border bg-card/40 backdrop-blur-xl shadow-xl flex items-center justify-center p-12">
                  <div className="text-center space-y-4 w-full">
                    <LoadingSkeleton />
                    <p className="text-muted-foreground font-medium animate-pulse text-sm mt-4">Chaining models & preparing prediction features...</p>
                  </div>
                </Card>
              </motion.div>
            ) : results ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex-1 space-y-6"
              >
                <Card className="border-sidebar-border bg-card/60 backdrop-blur-xl shadow-xl hover:border-primary/20 transition-all duration-300">
                  <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                        🍽 Tomorrow's Mess Forecast
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {meal} Forecast for {menu} ({new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })})
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs font-semibold text-primary">
                      {getMealIcon(meal)}
                      {meal}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Main Analytics Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Expected Attendance */}
                      <Card className="border-border bg-background/40 hover-elevate transition-all duration-200">
                        <CardHeader className="p-4 pb-1">
                          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            Expected Attendance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <div className="text-3xl font-extrabold text-foreground tracking-tight">
                            {results.attendance}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 font-medium">Students predicted to dine</p>
                        </CardContent>
                      </Card>

                      {/* Food to Prepare */}
                      <Card className="border-border bg-background/40 hover-elevate transition-all duration-200">
                        <CardHeader className="p-4 pb-1">
                          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <ChefHat className="h-3.5 w-3.5 text-emerald-500" />
                            Food To Prepare
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <div className="text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-1">
                            {results.preparedFoodKg} <span className="text-sm font-semibold text-muted-foreground">kg</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 font-medium">For {results.expectedAttendance} expected (1.10x safety)</p>
                        </CardContent>
                      </Card>

                      {/* Expected Waste */}
                      <Card className="border-border bg-background/40 hover-elevate transition-all duration-200">
                        <CardHeader className="p-4 pb-1">
                          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            Expected Waste
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <div className="text-3xl font-extrabold text-destructive tracking-tight flex items-baseline gap-1">
                            {results.wasteKg} <span className="text-sm font-semibold text-muted-foreground">kg</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 font-medium">Predicted plate & prep waste</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Cost Loss and Safety Factor details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cost Loss */}
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                        <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                          <IndianRupee className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estimated Cost Loss</div>
                          <div className="text-2xl font-black text-destructive mt-0.5">₹{costLoss}</div>
                          <div className="text-[11px] text-muted-foreground/80 mt-0.5 font-medium">Based on ₹80 average raw material cost per kg</div>
                        </div>
                      </div>

                      {/* Chained Pipeline Info */}
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <ArrowRightLeft className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Model Integration</div>
                          <div className="text-sm font-bold text-foreground mt-0.5">Chained XGBoost Pipelines</div>
                          <div className="text-[11px] text-muted-foreground/80 mt-0.5 font-medium">Model 1 predictions feed into Model 2 inputs</div>
                        </div>
                      </div>
                    </div>

                    {/* Actionable Recommendation */}
                    <div className={`p-5 rounded-xl border flex items-start gap-4 transition-all duration-300 ${
                      reductionPercent > 5 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-100" 
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-100"
                    }`}>
                      <div className={`p-2.5 rounded-lg ${reductionPercent > 5 ? "bg-amber-500/20 text-amber-600" : "bg-emerald-500/20 text-emerald-600"}`}>
                        <TrendingDown className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold tracking-tight uppercase">Warden Recommendation</div>
                        <div className="text-base font-bold">
                          {reductionPercent > 0 
                            ? `Reduce preparation by ${reductionPercent}%` 
                            : "Preparation levels are highly optimal"}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          {reductionPercent > 0 
                            ? `Scaling down preparation by ${reductionPercent}% will match predicted plate consumption while retaining a safe buffer.` 
                            : "No action is required. The models predict minimum food wastage for this specific meal and condition combination."}
                        </p>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1"
              >
                <Card className="h-full border-sidebar-border bg-card/60 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center p-8 text-center hover:border-primary/20 transition-all duration-300">
                  <div className="max-w-md space-y-4 p-6">
                    <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                      <ChefHat className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Forecast Awaiting Input</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Select tomorrow's date, meal, menu, and weather/schedule conditions, then click <b>Predict Waste</b> to run the machine learning models.
                    </p>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-full border">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        Aims to prevent plate & kitchen food waste
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
