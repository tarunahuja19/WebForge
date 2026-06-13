import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Users, CheckCircle2, Sparkles, Brain, ArrowRight, ArrowLeft,
  Clock, Book, Utensils, Volume2, UserPlus, Sun, Moon, Star,
  DoorClosed, Building2, Loader2,
} from "lucide-react";
import RoomMap from "./room-map";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PersonalityFormData {
  name: string;
  age: string;
  gender: string;
  year: string;
  course: string;
  sleepTime: string;
  wakeTime: string;
  studyHours: string;
  dietaryPreference: string;
  cleanliness: number;
  noiseTolerance: number;
  guestFrequency: string;
  introvertExtrovert: number;
  studyTime: string;
  comfortableWithGuests: string;
}

interface MatchResult {
  roomId: number | null;
  roomNumber: string;
  floor: number;
  blockName: string;
  roommates: {
    id: number;
    name: string;
    compatibility: number;
    traits: {
      cleanliness: number;
      noiseTolerance: number;
      introvertExtrovert: number;
    };
  }[];
  matchScore: number;
  message?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COURSES = [
  "Computer Science", "Mechanical Engineering", "Electrical Engineering",
  "Business Administration", "Psychology", "English Literature",
  "Biology", "Mathematics", "Chemistry",
];

const STEPS = [
  { title: "Personal Info", icon: Users, description: "Tell us about yourself" },
  { title: "Lifestyle", icon: Clock, description: "Your daily routine" },
  { title: "Personality", icon: Brain, description: "Your preferences & habits" },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function StudentRoom() {
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [hasRoom, setHasRoom] = useState<boolean | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [form, setForm] = useState<PersonalityFormData>({
    name: user?.name || "",
    age: "",
    gender: "",
    year: "",
    course: "",
    sleepTime: "23:00",
    wakeTime: "07:00",
    studyHours: "4",
    dietaryPreference: "",
    cleanliness: 3,
    noiseTolerance: 3,
    guestFrequency: "",
    introvertExtrovert: 3,
    studyTime: "",
    comfortableWithGuests: "",
  });

  // Check if student has profile and room
  useEffect(() => {
    async function checkStatus() {
      try {
        // We need the student record ID. Try to get it from the students API
        const studRes = await fetch("/api/students");
        const students = await studRes.json();
        const myStudent = students.find?.((s: any) => s.userId === user?.id) || students[0];

        if (!myStudent) {
          setHasProfile(false);
          setHasRoom(false);
          setLoading(false);
          return;
        }

        // Check if has personality profile
        const profRes = await fetch(`/api/personality/${myStudent.id}`);
        const profData = await profRes.json();
        setHasProfile(profData.hasProfile);

        // Check if has room
        if (myStudent.roomId) {
          setHasRoom(true);
          const roomRes = await fetch(`/api/rooms/${myStudent.roomId}`);
          const room = await roomRes.json();
          setRoomData({ ...room, studentId: myStudent.id });
        } else {
          setHasRoom(false);
        }
      } catch {
        setHasProfile(false);
        setHasRoom(false);
      }
      setLoading(false);
    }
    checkStatus();
  }, [user]);

  const updateForm = (key: keyof PersonalityFormData, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const studRes = await fetch("/api/students");
      const students = await studRes.json();
      const myStudent = students.find?.((s: any) => s.userId === user?.id) || students[0];

      const res = await fetch("/api/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: myStudent?.id || 1,
          ...form,
          comfortableWithGuests: form.comfortableWithGuests === "yes",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMatchResult(data.matchResult);
        setShowResult(true);
        setHasProfile(true);
        if (data.matchResult.roomId) {
          setHasRoom(true);
          // Fetch room details
          const roomRes = await fetch(`/api/rooms/${data.matchResult.roomId}`);
          const room = await roomRes.json();
          setRoomData({ ...room, studentId: myStudent?.id || 1 });
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingSkeleton />;

  // ─── Show Match Result ──────────────────────────────────────────────────

  if (showResult && matchResult) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="🎉 Room Assigned!"
          description="Our AI has found the perfect room and roommate for you"
        />

        {/* Match Result Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                  <DoorClosed className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Room {matchResult.roomNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground">{matchResult.blockName} • Floor {matchResult.floor}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Room successfully assigned</span>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                onClick={() => { setShowResult(false); }}
              >
                View My Room & Map
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Roommate Card */}
          {matchResult.roommates.length > 0 && (
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent overflow-hidden relative">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Your Roommate</CardTitle>
                    <p className="text-sm text-muted-foreground">AI-matched for compatibility</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {matchResult.roommates.map(rm => (
                  <div key={rm.id} className="space-y-3">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {rm.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground text-lg">{rm.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-semibold text-primary">{rm.compatibility}% Match</span>
                        </div>
                      </div>
                    </div>

                    {/* Compatibility Traits */}
                    <div className="grid grid-cols-3 gap-2">
                      <TraitBar label="Cleanliness" value={rm.traits.cleanliness} max={5} />
                      <TraitBar label="Noise OK" value={rm.traits.noiseTolerance} max={5} />
                      <TraitBar label="Social" value={rm.traits.introvertExtrovert} max={5} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ─── Show Room Details + Map (has room) ─────────────────────────────────

  if (hasRoom && roomData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Room ${roomData.roomNumber || "Details"}`}
          description={`${roomData.blockName || "Block"} • Floor ${roomData.floor || 1}`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Roommates */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Roommates</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roomData.students?.map((student: any) => (
                    <div key={student.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                        {student.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                      </div>
                    </div>
                  ))}
                  {(!roomData.students || roomData.students.length === 0) && (
                    <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      No roommates assigned yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Room Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6">
                  {(roomData.amenities || ["Wi-Fi", "AC", "Attached Washroom", "Study Table", "Wardrobe"]).map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Room Map */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Hostel Room Map</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <RoomMap currentRoomId={roomData.id} studentId={roomData.studentId} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-primary/10">
                  <span className="text-muted-foreground text-sm">Capacity</span>
                  <span className="font-bold">{roomData.capacity || 2} Persons</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-primary/10">
                  <span className="text-muted-foreground text-sm">Current Occupancy</span>
                  <span className="font-bold">{roomData.currentOccupancy || 0} Persons</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-primary/10">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <span className="font-bold capitalize text-emerald-600">{roomData.status || "available"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground text-sm">Type</span>
                  <span className="font-bold">Standard Non-AC</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── Personality Test Form (no profile yet) ─────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Find Your Perfect Room"
        description="Complete this personality test and our AI will match you with the ideal roommate and room"
      />

      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-foreground">Step {step + 1} of {STEPS.length}</span>
          </div>
          <span className="text-sm text-muted-foreground">{STEPS[step].title}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2 bg-muted/50" />

        {/* Step indicators */}
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => i < step && setStep(i)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300
                ${i === step
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : i < step
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-500/25"
                    : "bg-muted/30 text-muted-foreground cursor-default"
                }
              `}
            >
              {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            {React.createElement(STEPS[step].icon, { className: "h-6 w-6 text-primary" })}
            <div>
              <CardTitle className="text-xl">{STEPS[step].title}</CardTitle>
              <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Q1: Name */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-primary font-bold">Q1.</span> What is your name?
                </Label>
                <Input
                  id="personality-name"
                  value={form.name}
                  onChange={e => updateForm("name", e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-muted/30 border-border/50 focus:border-primary h-11"
                />
              </div>

              {/* Q2: Age */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-primary font-bold">Q2.</span> How old are you?
                </Label>
                <Input
                  id="personality-age"
                  type="number"
                  value={form.age}
                  onChange={e => updateForm("age", e.target.value)}
                  placeholder="Enter your age"
                  min={16}
                  max={30}
                  className="bg-muted/30 border-border/50 focus:border-primary h-11"
                />
              </div>

              {/* Q3: Gender */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-primary font-bold">Q3.</span> What is your gender?
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {["Male", "Female", "Non-binary"].map(g => (
                    <SelectButton
                      key={g}
                      label={g}
                      selected={form.gender === g.toLowerCase().replace("-", "_")}
                      onClick={() => updateForm("gender", g.toLowerCase().replace("-", "_"))}
                    />
                  ))}
                </div>
              </div>

              {/* Q4: Year */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-primary font-bold">Q4.</span> Which year are you studying in?
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {["1st", "2nd", "3rd", "4th"].map((y, i) => (
                    <SelectButton
                      key={y}
                      label={`${y} Year`}
                      selected={form.year === String(i + 1)}
                      onClick={() => updateForm("year", String(i + 1))}
                    />
                  ))}
                </div>
              </div>

              {/* Q5: Course */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-primary font-bold">Q5.</span> What is your course/major?
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {COURSES.map(c => (
                    <SelectButton
                      key={c}
                      label={c}
                      selected={form.course === c}
                      onClick={() => updateForm("course", c)}
                      small
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Lifestyle */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Q6: Sleep Time */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <span className="text-primary font-bold">Q6.</span> What time do you usually go to sleep?
                </Label>
                <Input
                  id="personality-sleep"
                  type="time"
                  value={form.sleepTime}
                  onChange={e => updateForm("sleepTime", e.target.value)}
                  className="bg-muted/30 border-border/50 focus:border-primary h-11"
                />
              </div>

              {/* Q7: Wake Time */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="text-primary font-bold">Q7.</span> What time do you usually wake up?
                </Label>
                <Input
                  id="personality-wake"
                  type="time"
                  value={form.wakeTime}
                  onChange={e => updateForm("wakeTime", e.target.value)}
                  className="bg-muted/30 border-border/50 focus:border-primary h-11"
                />
              </div>

              {/* Q8: Study Hours */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Book className="h-4 w-4 text-blue-400" />
                  <span className="text-primary font-bold">Q8.</span> How many hours do you study per day?
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="personality-study-hours"
                    type="range"
                    min={0}
                    max={16}
                    value={form.studyHours}
                    onChange={e => updateForm("studyHours", e.target.value)}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-lg font-bold text-primary min-w-[3rem] text-center">{form.studyHours}h</span>
                </div>
              </div>

              {/* Q9: Diet */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-green-400" />
                  <span className="text-primary font-bold">Q9.</span> What is your dietary preference?
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Vegetarian", value: "vegetarian" },
                    { label: "Non-vegetarian", value: "non-vegetarian" },
                    { label: "Eggetarian", value: "eggetarian" },
                    { label: "Vegan", value: "vegan" },
                    { label: "No preference", value: "no_preference" },
                  ].map(d => (
                    <SelectButton
                      key={d.value}
                      label={d.label}
                      selected={form.dietaryPreference === d.value}
                      onClick={() => updateForm("dietaryPreference", d.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Personality */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Q10: Cleanliness */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="text-primary font-bold">Q10.</span> How would you rate your cleanliness?
                </Label>
                <p className="text-xs text-muted-foreground">1 = Very messy, 5 = Very clean</p>
                <ScaleSelector
                  value={form.cleanliness}
                  onChange={v => updateForm("cleanliness", v)}
                  labels={["Very Messy", "Messy", "Average", "Clean", "Very Clean"]}
                />
              </div>

              {/* Q11: Noise Tolerance */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-purple-400" />
                  <span className="text-primary font-bold">Q11.</span> Noise tolerance while studying/resting?
                </Label>
                <p className="text-xs text-muted-foreground">1 = Cannot tolerate noise, 5 = Very tolerant</p>
                <ScaleSelector
                  value={form.noiseTolerance}
                  onChange={v => updateForm("noiseTolerance", v)}
                  labels={["Zero", "Low", "Moderate", "High", "Very High"]}
                />
              </div>

              {/* Q12: Guest Frequency */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-cyan-400" />
                  <span className="text-primary font-bold">Q12.</span> How often do you have guests/friends over?
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {["Never", "Sometimes", "Often"].map(g => (
                    <SelectButton
                      key={g}
                      label={g}
                      selected={form.guestFrequency === g.toLowerCase()}
                      onClick={() => updateForm("guestFrequency", g.toLowerCase())}
                    />
                  ))}
                </div>
              </div>

              {/* Q13: Introvert-Extrovert */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-pink-400" />
                  <span className="text-primary font-bold">Q13.</span> Introvert-Extrovert scale?
                </Label>
                <p className="text-xs text-muted-foreground">1 = Highly introverted, 5 = Highly extroverted</p>
                <ScaleSelector
                  value={form.introvertExtrovert}
                  onChange={v => updateForm("introvertExtrovert", v)}
                  labels={["Introvert", "Lean Intro", "Ambivert", "Lean Extro", "Extrovert"]}
                />
              </div>

              {/* Q14: Study Time */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Book className="h-4 w-4 text-blue-400" />
                  <span className="text-primary font-bold">Q14.</span> When do you prefer to study?
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Morning", icon: Sun },
                    { label: "Afternoon", icon: Clock },
                    { label: "Night", icon: Moon },
                  ].map(t => (
                    <SelectButton
                      key={t.label}
                      label={t.label}
                      selected={form.studyTime === t.label.toLowerCase()}
                      onClick={() => updateForm("studyTime", t.label.toLowerCase())}
                      icon={t.icon}
                    />
                  ))}
                </div>
              </div>

              {/* Q15: Comfortable with guests */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span className="text-primary font-bold">Q15.</span> Comfortable with friends in room frequently?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {["Yes", "No"].map(v => (
                    <SelectButton
                      key={v}
                      label={v}
                      selected={form.comfortableWithGuests === v.toLowerCase()}
                      onClick={() => updateForm("comfortableWithGuests", v.toLowerCase())}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-border/30">
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-8"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is finding your match...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Find My Perfect Room
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Reusable Sub-components ─────────────────────────────────────────────────

function SelectButton({
  label,
  selected,
  onClick,
  small = false,
  icon: Icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  small?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 rounded-xl border transition-all duration-200 font-medium
        ${small ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"}
        ${selected
          ? "bg-primary/15 border-primary/50 text-primary shadow-sm shadow-primary/10"
          : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40 hover:border-border hover:text-foreground"
        }
      `}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
      {selected && <CheckCircle2 className="h-3.5 w-3.5 ml-1" />}
    </button>
  );
}

function ScaleSelector({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  labels: string[];
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`
            flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-200
            ${v === value
              ? "bg-primary/15 border-primary/50 text-primary shadow-sm shadow-primary/10"
              : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            }
          `}
        >
          <span className="text-lg font-bold">{v}</span>
          <span className="text-[9px] leading-tight text-center font-medium">{labels[v - 1]}</span>
        </button>
      ))}
    </div>
  );
}

function TraitBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{value}/{max}</span>
    </div>
  );
}
