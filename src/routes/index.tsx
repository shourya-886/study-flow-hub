import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  Timer,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
type Tab = "classes" | "exams" | "study" | "focus";
type Exam = { id: number; subject: string; date: string; syllabus: string };
type FocusLog = { id: number; subject: string; hours: string; note: string };
type SplitPeriod = { time: string; subject: string };
type ClassPeriod = { time: string; subject?: string; isSplit?: boolean; splitPeriods?: SplitPeriod[] };
type ScheduleDetails = Record<Day, ClassPeriod[]>;
type PlanItem = { exam: Exam; topic: string; day: number };
type HomeCell = { slot: string; topics: PlanItem[]; note?: string };

const days: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = [
  { label: "01", time: "08:00 — 09:25" },
  { label: "02", time: "09:35 — 11:00" },
  { label: "03", time: "11:10 — 12:35" },
  { label: "04", time: "13:25 — 14:50" },
  { label: "05", time: "15:00 — 16:25" },
];
const homeSlots = ["05:00 — 06:30", "19:30 — 20:30", "20:30 — 21:30", "21:30 — 22:30", "22:30 — 23:00 · optional"];
const subjects = [
  { code: "PRT", name: "Physics" },
  { code: "BIO KP", name: "Biology" },
  { code: "MPJ", name: "Mental ability" },
  { code: "MLK", name: "Maths" },
  { code: "TELUGU/HINDI", name: "Language" },
  { code: "CSM", name: "Chemistry" },
  { code: "SOCIAL PNCF", name: "Social" },
  { code: "ENGLISH PNCF", name: "English" },
  { code: "—", name: "Free / study" },
  { code: "HOLIDAY", name: "Holiday" },
];

const sampleJson = `{
  "schedule": {
    "Monday": { "isHoliday": true, "periods": [] },
    "Tuesday": {
      "isHoliday": false,
      "periods": [
        { "time": "8:00 AM - 9:25 AM", "subject": "PRT" },
        { "time": "9:35 AM - 11:05 AM", "subject": "BIO KP" },
        { "time": "11:15 AM - 12:45 PM", "isSplit": true, "splitPeriods": [
          { "time": "11:15 AM - 12:01 PM", "subject": "MPJ" },
          { "time": "12:01 PM - 12:45 PM", "subject": "BIO KP" }
        ] },
        { "time": "1:25 PM - 2:55 PM", "subject": "MLK" },
        { "time": "3:05 PM - 4:30 PM", "subject": "TELUGU / HINDI" }
      ]
    },
    "Wednesday": { "isHoliday": false, "periods": [
      { "time": "8:00 AM - 9:25 AM", "subject": "CSM" },
      { "time": "9:35 AM - 11:05 AM", "subject": "SOCIAL PNCF" },
      { "time": "11:15 AM - 12:45 PM", "subject": "BIO KP" },
      { "time": "1:25 PM - 2:55 PM", "subject": "CSM" },
      { "time": "3:05 PM - 4:30 PM", "subject": "MLK" }
    ] },
    "Thursday": { "isHoliday": false, "periods": [
      { "time": "8:00 AM - 9:25 AM", "subject": "TELUGU / HINDI" },
      { "time": "9:35 AM - 11:05 AM", "subject": "MLK" },
      { "time": "11:15 AM - 12:45 PM", "subject": "PRT" },
      { "time": "1:25 PM - 2:55 PM", "subject": "BIO KP" },
      { "time": "3:05 PM - 4:30 PM", "subject": "PRT" }
    ] },
    "Friday": { "isHoliday": false, "periods": [
      { "time": "8:00 AM - 9:25 AM", "subject": "CSM" },
      { "time": "9:35 AM - 11:05 AM", "subject": "MLK" },
      { "time": "11:15 AM - 12:45 PM", "subject": "PRT" },
      { "time": "1:25 PM - 2:55 PM", "subject": "BIO KP" },
      { "time": "3:05 PM - 4:30 PM", "subject": "FREE / STUDY" }
    ] }
  }
}`;

function holidayIndex(dayClasses: string[]) {
  const index = dayClasses.indexOf("HOLIDAY");
  return index === -1 ? null : index;
}

function dayIsOff(dayClasses: string[]) {
  const index = holidayIndex(dayClasses);
  return index === null ? null : index === 0 ? "full" : "half";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mapSubject(raw: string) {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const aliases: Record<string, string> = {
    PRT: "PRT",
    "BIO KP": "BIO KP",
    MPJ: "MPJ",
    MLK: "MLK",
    "TELUGU / HINDI": "TELUGU/HINDI",
    "TELUGU/HINDI": "TELUGU/HINDI",
    CSM: "CSM",
    "SOCIAL PNCF": "SOCIAL PNCF",
    "ENGLISH PNCF": "ENGLISH PNCF",
    "FREE / STUDY": "—",
    "FREE/STUDY": "—",
    FREE: "—",
    "—": "—",
    HOLIDAY: "HOLIDAY",
  };
  const code = aliases[normalized];
  if (!code) throw new Error(`Unknown subject “${raw}”.`);
  return code;
}

function parseScheduleJson(raw: string): { timetable: Record<Day, string[]>; details: ScheduleDetails } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The JSON is not valid. Check commas, quotes, and brackets.");
  }
  if (!isRecord(parsed) || !isRecord(parsed.schedule)) {
    throw new Error("Add a top-level “schedule” object with Monday to Friday entries.");
  }

  const timetable = {} as Record<Day, string[]>;
  const details = {} as ScheduleDetails;
  for (const day of days) {
    const dayData = parsed.schedule[day];
    if (!isRecord(dayData) || !Array.isArray(dayData.periods)) {
      throw new Error(`${day} needs an “isHoliday” value and a “periods” array.`);
    }
    const isHoliday = dayData.isHoliday === true;
    if (!isHoliday && dayData.periods.length > periods.length) {
      throw new Error(`${day} has more than five periods.`);
    }

    const dayDetails: ClassPeriod[] = [];
    const dayClasses: string[] = [];
    for (let index = 0; index < periods.length; index += 1) {
      const source = dayData.periods[index];
      if (isHoliday) {
        dayDetails.push({ time: periods[index]?.time ?? "", subject: "HOLIDAY" });
        dayClasses.push("HOLIDAY");
        continue;
      }
      if (!isRecord(source)) {
        dayDetails.push({ time: periods[index]?.time ?? "", subject: "—" });
        dayClasses.push("—");
        continue;
      }
      const time = typeof source.time === "string" ? source.time : periods[index]?.time ?? "";
      if (source.isSplit === true) {
        if (!Array.isArray(source.splitPeriods) || source.splitPeriods.length === 0) {
          throw new Error(`${day} period ${index + 1} needs splitPeriods.`);
        }
        const splitPeriods: SplitPeriod[] = source.splitPeriods.map((item, splitIndex) => {
          if (!isRecord(item) || typeof item.time !== "string" || typeof item.subject !== "string") {
            throw new Error(`${day} split period ${splitIndex + 1} is missing time or subject.`);
          }
          return { time: item.time, subject: mapSubject(item.subject) };
        });
        dayDetails.push({ time, subject: splitPeriods[0]?.subject ?? "—", isSplit: true, splitPeriods });
        dayClasses.push(splitPeriods[0]?.subject ?? "—");
      } else {
        if (typeof source.subject !== "string") throw new Error(`${day} period ${index + 1} needs a subject.`);
        const subject = mapSubject(source.subject);
        dayDetails.push({ time, subject });
        dayClasses.push(subject);
      }
    }
    timetable[day] = dayClasses;
    details[day] = dayDetails;
  }
  return { timetable, details };
}

const initialParsed = parseScheduleJson(sampleJson);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Desk — Student Planner" },
      { name: "description", content: "Plan your school week, upcoming exams, study sessions, and focus time." },
      { property: "og:title", content: "Study Desk — Student Planner" },
      { property: "og:description", content: "Plan your school week, upcoming exams, study sessions, and focus time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("classes");
  const [timetable, setTimetable] = useState(initialParsed.timetable);
  const [scheduleDetails, setScheduleDetails] = useState(initialParsed.details);
  const [selectedDay, setSelectedDay] = useState<Day>("Monday");
  const [exams, setExams] = useState<Exam[]>([]);
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>([]);
  const [examSubject, setExamSubject] = useState("Physics");
  const [examDate, setExamDate] = useState("2026-09-22");
  const [examSyllabus, setExamSyllabus] = useState("");
  const [focusSubject, setFocusSubject] = useState("PRT");
  const [focusHours, setFocusHours] = useState("1 hour");
  const [focusNote, setFocusNote] = useState("");
  const [jsonInput, setJsonInput] = useState(sampleJson);
  const [jsonError, setJsonError] = useState("");

  const currentClasses = timetable[selectedDay] ?? [];
  const studyPlan = useMemo<PlanItem[]>(() => exams.flatMap((exam) => {
    const topics = exam.syllabus.split(/[\n,]+/).map((topic) => topic.trim()).filter(Boolean);
    return topics.map((topic, index) => ({ exam, topic, day: index + 1 }));
  }), [exams]);

  function updateClass(day: Day, index: number, value: string) {
    setTimetable((current) => ({ ...current, [day]: (current[day] ?? []).map((subject, subjectIndex) => subjectIndex === index ? value : subject) }));
    setScheduleDetails((current) => ({
      ...current,
      [day]: (current[day] ?? []).map((period, periodIndex) => periodIndex === index ? { ...period, subject: value, isSplit: false, splitPeriods: undefined } : period),
    }));
  }

  function importJson() {
    try {
      const next = parseScheduleJson(jsonInput);
      setTimetable(next.timetable);
      setScheduleDetails(next.details);
      setSelectedDay("Monday");
      setJsonError("");
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Could not read this timetable.");
    }
  }

  function addExam() {
    if (!examSubject || !examDate) return;
    setExams((current) => [...current, { id: Date.now(), subject: examSubject, date: examDate, syllabus: examSyllabus }]);
    setExamSyllabus("");
  }

  function addFocusLog() {
    setFocusLogs((current) => [...current, { id: Date.now(), subject: focusSubject, hours: focusHours, note: focusNote }]);
    setFocusNote("");
  }

  return (
    <main className="min-h-screen bg-ground">
      <header className="border-b hairline">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 lg:px-10">
          <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center border border-ink text-sm font-semibold">SD</span><span className="mono-label text-secondary-ink">Study desk / 01</span></div>
          <span className="mono-label hidden text-muted md:block">School week · 08:00 — 16:30</span>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 pb-20 lg:px-10">
        <section className="grid gap-10 border-b hairline py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-16">
          <div><p className="mono-label mb-5 text-pigment">A quieter way to keep up</p><h1 className="display-title max-w-3xl text-6xl leading-[0.9] text-ink sm:text-7xl lg:text-8xl">Your week, <em className="text-pigment">held together.</em></h1></div>
          <div className="max-w-md lg:justify-self-end"><p className="text-sm leading-7 text-secondary-ink">Keep classes in view, turn exam syllabi into a study rhythm, and leave a small record of the hours you showed up.</p><div className="mt-7 flex items-center gap-3 mono-label text-muted"><span className="h-px w-10 bg-pigment" />Five periods / one desk</div></div>
        </section>
        <nav aria-label="Planner sections" className="grid border-b hairline sm:grid-cols-4">
          <TabButton active={activeTab === "classes"} icon={<CalendarDays />} onClick={() => setActiveTab("classes")} label="Class timetable" number="01" />
          <TabButton active={activeTab === "exams"} icon={<BookOpen />} onClick={() => setActiveTab("exams")} label="Exam timetable" number="02" />
          <TabButton active={activeTab === "study"} icon={<ListChecks />} onClick={() => setActiveTab("study")} label="Home timetable" number="03" />
          <TabButton active={activeTab === "focus"} icon={<Timer />} onClick={() => setActiveTab("focus")} label="Focus session" number="04" />
        </nav>
        <section className="pt-10">
          {activeTab === "classes" && <ClassTimetable timetable={timetable} details={scheduleDetails} selectedDay={selectedDay} setSelectedDay={setSelectedDay} updateClass={updateClass} jsonInput={jsonInput} setJsonInput={setJsonInput} jsonError={jsonError} importJson={importJson} />}
          {activeTab === "exams" && <ExamTimetable exams={exams} examSubject={examSubject} setExamSubject={setExamSubject} examDate={examDate} setExamDate={setExamDate} examSyllabus={examSyllabus} setExamSyllabus={setExamSyllabus} addExam={addExam} removeExam={(id) => setExams((current) => current.filter((exam) => exam.id !== id))} />}
          {activeTab === "study" && <StudyPlan exams={exams} plan={studyPlan} setActiveTab={setActiveTab} timetable={timetable} />}
          {activeTab === "focus" && <FocusSession days={days} selectedDay={selectedDay} setSelectedDay={setSelectedDay} currentClasses={currentClasses} subjectName={subjectName} focusSubject={focusSubject} setFocusSubject={setFocusSubject} focusHours={focusHours} setFocusHours={setFocusHours} focusNote={focusNote} setFocusNote={setFocusNote} addFocusLog={addFocusLog} focusLogs={focusLogs} />}
        </section>
      </div>
    </main>
  );
}

function TabButton({ active, icon, onClick, label, number }: { active: boolean; icon: ReactNode; onClick: () => void; label: string; number: string }) {
  return <button onClick={onClick} className={`group flex min-h-20 items-center justify-between border-b-2 px-0 py-4 text-left transition-colors sm:px-3 ${active ? "border-pigment text-pigment" : "border-transparent text-secondary-ink hover:text-pigment"}`}><span className="flex items-center gap-3"><span className="text-pigment [&_svg]:h-4 [&_svg]:w-4">{icon}</span><span className="mono-label text-[10px]">{label}</span></span><span className="mono-label text-muted">{number}</span></button>;
}

function ClassTimetable({ timetable, details, selectedDay, setSelectedDay, updateClass, jsonInput, setJsonInput, jsonError, importJson }: { timetable: Record<Day, string[]>; details: ScheduleDetails; selectedDay: Day; setSelectedDay: (day: Day) => void; updateClass: (day: Day, index: number, value: string) => void; jsonInput: string; setJsonInput: (value: string) => void; jsonError: string; importJson: () => void }) {
  return <div>
    <SectionHeading eyebrow="Your week at a glance" title="Class timetable" description="Paste your weekly JSON below, import it, and the timetable will keep the supplied times and split lessons. You can still change any period with its dropdown." />
    <div className="mt-8 border-y hairline py-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="mono-label text-pigment">JSON timetable</p><p className="mt-2 text-xs text-muted">Use the schedule format shown here. Monday to Friday entries are required.</p></div><Button type="button" variant="outline" onClick={importJson}><Check /> Import JSON</Button></div>
      <textarea aria-label="JSON timetable" value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} className="mt-5 min-h-56 w-full resize-y border border-line bg-secondary-ground/40 p-4 font-mono text-xs leading-6 text-ink outline-none focus:border-pigment" spellCheck={false} />
      {jsonError && <p role="alert" className="mt-3 border-l-2 border-pigment pl-3 text-xs leading-6 text-pigment">{jsonError}</p>}
    </div>
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_260px]">
      <div className="overflow-x-auto border-y hairline">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[112px_repeat(5,minmax(130px,1fr))] border-b hairline bg-secondary-ground"><div className="p-4 mono-label text-muted">period</div>{days.map((day) => <button key={day} onClick={() => setSelectedDay(day)} className={`border-l hairline p-4 text-left mono-label transition-colors ${selectedDay === day ? "text-pigment" : "text-muted hover:text-ink"}`}>{day.slice(0, 3)}</button>)}</div>
          {periods.map((period, index) => <div key={period.label} className="grid grid-cols-[112px_repeat(5,minmax(130px,1fr))] border-b hairline last:border-b-0"><div className="flex flex-col justify-center gap-1 p-4"><span className="display-title text-2xl text-ink">{period.label}</span><span className="mono-label text-[9px] text-muted">{period.time}</span></div>{days.map((day) => {
            const code = timetable[day]?.[index] ?? "—";
            const off = holidayIndex(timetable[day] ?? []);
            const pastOff = off !== null && index > off;
            const isHolidayCell = off === index;
            const detail = details[day]?.[index];
            return <div key={day} className={`border-l hairline p-3 ${selectedDay === day ? "bg-secondary-ground/60" : ""} ${pastOff ? "opacity-40" : ""}`}>
              {pastOff ? <span className="block py-2 font-mono text-xs tracking-[0.08em] text-muted">—</span> : <select aria-label={`${day} period ${period.label}`} value={code} onChange={(event) => updateClass(day, index, event.target.value)} className="w-full cursor-pointer border-b border-line bg-transparent py-2 font-mono text-xs tracking-[0.08em] text-ink outline-none focus:border-pigment">{subjects.map((subject) => <option key={subject.code} value={subject.code}>{subject.code}</option>)}</select>}
              <span className="mt-2 block text-xs text-muted">{pastOff ? "Off — day ends early" : subjectName(code)}</span>
              {detail?.isSplit && detail.splitPeriods && !pastOff && <span className="mt-2 block border-t hairline pt-2 mono-label text-[9px] leading-5 text-pigment">{detail.splitPeriods.map((split) => `${split.subject} · ${split.time}`).join(" / ")}</span>}
              {code === "MPJ" && !detail?.isSplit && !pastOff && <span className="mt-2 block border-t hairline pt-2 mono-label text-[9px] text-pigment">split · MPJ 45′ + BIO KP 45′</span>}
              {isHolidayCell && <span className="mt-2 block border-t hairline pt-2 mono-label text-[9px] text-pigment">{index === 0 ? "full holiday · 3h home study" : "half day from here · 3h home study"}</span>}
            </div>;
          })}</div>)}
          <div className="grid grid-cols-[112px_1fr] bg-secondary-ground"><div className="p-4 mono-label text-muted">pause</div><p className="p-4 text-xs text-secondary-ink">10 min between periods · lunch 12:45 — 13:25 · 5 min flex at close</p></div>
        </div>
      </div>
      <aside className="border-t hairline pt-5 lg:border-l lg:border-t-0 lg:pl-7"><p className="mono-label text-pigment">Selected day</p><h2 className="display-title mt-3 text-4xl">{selectedDay}</h2><div className="mt-7 space-y-0 border-y hairline">{(timetable[selectedDay] ?? []).map((code, index) => <div key={`${code}-${index}`} className="border-b hairline py-3 last:border-b-0"><div className="flex items-center justify-between gap-3"><span className="mono-label text-muted">{periods[index]?.label} / {periods[index]?.time.split(" ")[0]}</span><span className="text-right text-sm text-ink">{(() => { const off = holidayIndex(timetable[selectedDay] ?? []); if (off !== null && index > off) return "Off — half day"; if (code === "HOLIDAY") return index === 0 ? "Holiday (full day)" : "Holiday — half day starts"; if (code === "MPJ") return "Mental ability / Biology (split)"; return subjectName(code); })()}</span></div><span className="mt-2 block text-[10px] text-muted">{details[selectedDay]?.[index]?.time}</span></div>)}</div>{dayIsOff(timetable[selectedDay] ?? []) && <p className="mt-4 border-t hairline pt-4 mono-label text-[10px] text-pigment">{dayIsOff(timetable[selectedDay] ?? []) === "full" ? "Full holiday — 3 hours of study at home" : "Half day — 3 hours of study at home"}</p>}<p className="mt-6 text-xs leading-6 text-muted">MPJ periods run as 45 min mental ability + 45 min BIO KP. A standalone BIO KP period stays a full class.</p></aside>
    </div>
  </div>;
}

function ExamTimetable({ exams, examSubject, setExamSubject, examDate, setExamDate, examSyllabus, setExamSyllabus, addExam, removeExam }: { exams: Exam[]; examSubject: string; setExamSubject: (value: string) => void; examDate: string; setExamDate: (value: string) => void; examSyllabus: string; setExamSyllabus: (value: string) => void; addExam: () => void; removeExam: (id: number) => void }) {
  return <div><SectionHeading eyebrow="What is coming up" title="Exam timetable" description="Add an exam date and list the syllabus as comma-separated chapters or one topic per line." /><div className="mt-10 grid gap-10 lg:grid-cols-[0.78fr_1.22fr]"><form onSubmit={(event) => { event.preventDefault(); addExam(); }} className="border-t hairline pt-5"><p className="mono-label text-pigment">New exam</p><div className="mt-6 space-y-5"><Field label="Subject"><select value={examSubject} onChange={(event) => setExamSubject(event.target.value)} className="field-control">{subjects.filter((subject) => subject.code !== "—" && subject.code !== "HOLIDAY").map((subject) => <option key={subject.name}>{subject.name}</option>)}</select></Field><Field label="Date"><input required type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} className="field-control" /></Field><Field label="Syllabus"><textarea value={examSyllabus} onChange={(event) => setExamSyllabus(event.target.value)} placeholder="Current electricity, ray optics, semiconductors" className="field-control min-h-32 resize-y" /></Field><Button type="submit" variant="outline" className="mt-2"><Plus /> Add exam</Button></div></form><div className="border-t hairline pt-5"><p className="mono-label text-pigment">Upcoming exams <span className="text-muted">/ {String(exams.length).padStart(2, "0")}</span></p>{exams.length === 0 ? <EmptyState icon={<CalendarDays />} title="No exams on the desk yet" description="Add the next exam to turn its chapters into a home timetable." /> : <div className="mt-6 divide-y hairline">{exams.map((exam) => <div key={exam.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_140px_34px] sm:items-start"><div><h3 className="display-title text-3xl">{exam.subject}</h3><p className="mt-2 text-xs text-muted">{exam.syllabus || "Syllabus not added yet"}</p></div><div className="mono-label text-pigment">{formatDate(exam.date)}</div><button aria-label={`Remove ${exam.subject} exam`} onClick={() => removeExam(exam.id)} className="text-muted transition-colors hover:text-pigment"><Trash2 className="h-4 w-4" /></button></div>)}</div>}</div></div></div>;
}

function StudyPlan({ exams, plan, setActiveTab, timetable }: { exams: Exam[]; plan: PlanItem[]; setActiveTab: (tab: Tab) => void; timetable: Record<Day, string[]> }) {
  const [selectedCell, setSelectedCell] = useState<{ day: Day; cell: HomeCell } | null>(null);
  const homeSchedule = useMemo<Record<Day, HomeCell[]>>(() => {
    let topicIndex = 0;
    const result = {} as Record<Day, HomeCell[]>;
    for (const day of days) {
      result[day] = homeSlots.map((slot) => {
        const topic = plan[topicIndex];
        if (topic) topicIndex += 1;
        return { slot, topics: topic ? [topic] : [], note: dayIsOff(timetable[day] ?? []) ? "3 hours home study" : undefined };
      });
    }
    return result;
  }, [plan, timetable]);
  const offDays = days.filter((day) => dayIsOff(timetable[day] ?? []));

  return <div><SectionHeading eyebrow="From chapters to action" title="Home timetable" description="Your study window is 05:00–06:30, then 19:30–22:30. Click any cell to see the chapters assigned there." />
    {offDays.length > 0 && <div className="mt-8 border-y hairline py-5"><p className="mono-label text-pigment">Home study / 3 hours</p><p className="mt-3 text-xs leading-6 text-secondary-ink">{offDays.map((day) => `${day} · ${dayIsOff(timetable[day] ?? []) === "full" ? "full holiday" : "half day"}`).join("  /  ")}</p></div>}
    {exams.length === 0 && <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-y hairline py-5"><div><p className="mono-label text-pigment">No chapters assigned</p><p className="mt-2 text-xs leading-6 text-muted">Add an exam to place its chapters into these study windows.</p></div><Button variant="outline" onClick={() => setActiveTab("exams")}>Add an exam <ArrowRight /></Button></div>}
    <div className="mt-10 overflow-x-auto border-y hairline"><div className="min-w-[880px]"><div className="grid grid-cols-[150px_repeat(5,minmax(145px,1fr))] border-b hairline bg-secondary-ground"><div className="p-4 mono-label text-muted">study window</div>{days.map((day) => <div key={day} className="border-l hairline p-4"><p className="mono-label text-muted">{day.slice(0, 3)}</p>{dayIsOff(timetable[day] ?? []) && <p className="mt-2 mono-label text-[9px] text-pigment">3h home study</p>}</div>)}</div>{homeSlots.map((slot, slotIndex) => <div key={slot} className="grid grid-cols-[150px_repeat(5,minmax(145px,1fr))] border-b hairline last:border-b-0"><div className="flex items-center p-4"><span className="mono-label text-[9px] text-muted">{slot}</span></div>{days.map((day) => { const cell = homeSchedule[day]?.[slotIndex] ?? { slot, topics: [] }; return <div key={day} className="border-l hairline p-2"><Button type="button" variant="ghost" onClick={() => setSelectedCell({ day, cell })} className="min-h-24 w-full flex-col items-start justify-start whitespace-normal p-3 text-left hover:bg-secondary-ground"><span className="text-xs text-ink">{cell.topics[0]?.topic ?? "Open study"}</span><span className="mt-2 mono-label text-[9px] text-muted">{cell.topics[0]?.exam.subject ?? cell.note ?? "No chapter assigned"}</span></Button></div>; })}</div>)}</div></div>
    {selectedCell && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-5" onClick={() => setSelectedCell(null)}><div role="dialog" aria-modal="true" aria-labelledby="chapter-window-title" className="w-full max-w-md border border-line bg-ground p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="mono-label text-pigment">{selectedCell.day} · {selectedCell.cell.slot}</p><h2 id="chapter-window-title" className="display-title mt-2 text-4xl">Chapters</h2></div><Button type="button" variant="ghost" size="icon" aria-label="Close chapters" onClick={() => setSelectedCell(null)}><X /></Button></div>{selectedCell.cell.topics.length > 0 ? <ul className="mt-6 divide-y hairline border-y hairline">{selectedCell.cell.topics.map((item) => <li key={`${item.exam.id}-${item.topic}`} className="py-4"><p className="text-sm text-ink">{item.topic}</p><p className="mt-2 mono-label text-[9px] text-muted">{item.exam.subject} · lesson {item.day}</p></li>)}</ul> : <p className="mt-6 border-y hairline py-6 text-sm leading-7 text-muted">No chapter is assigned to this study window yet. You can use it for revision or practice.</p>}{selectedCell.cell.note && <p className="mt-5 mono-label text-[10px] text-pigment">{selectedCell.cell.note}</p>}</div></div>}
  </div>;
}

function FocusSession({ days, selectedDay, setSelectedDay, currentClasses, subjectName, focusSubject, setFocusSubject, focusHours, setFocusHours, focusNote, setFocusNote, addFocusLog, focusLogs }: { days: Day[]; selectedDay: Day; setSelectedDay: (day: Day) => void; currentClasses: string[]; subjectName: (code: string) => string; focusSubject: string; setFocusSubject: (value: string) => void; focusHours: string; setFocusHours: (value: string) => void; focusNote: string; setFocusNote: (value: string) => void; addFocusLog: () => void; focusLogs: FocusLog[] }) {
  return <div><SectionHeading eyebrow="Time well spent" title="Focus session" description="Choose the day and class you focused on, then leave a short note about what moved forward." /><div className="mt-10 grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><form onSubmit={(event) => { event.preventDefault(); addFocusLog(); }} className="border-t hairline pt-5"><p className="mono-label text-pigment">Log a session</p><div className="mt-6 space-y-5"><Field label="Class day"><select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value as Day)} className="field-control">{days.map((day) => <option key={day}>{day}</option>)}</select></Field><Field label="Class"><select value={focusSubject} onChange={(event) => setFocusSubject(event.target.value)} className="field-control">{currentClasses.filter((code, index) => code !== "—" && code !== "HOLIDAY" && (holidayIndex(currentClasses) === null || index <= (holidayIndex(currentClasses) ?? 0))).map((code, index) => <option key={`${code}-${index}`} value={code}>{subjectName(code)} · {code}</option>)}</select></Field><Field label="Hours focused"><select value={focusHours} onChange={(event) => setFocusHours(event.target.value)} className="field-control">{["30 minutes", "1 hour", "1.5 hours", "2 hours", "3 hours"].map((hours) => <option key={hours}>{hours}</option>)}</select></Field><Field label="Note"><textarea value={focusNote} onChange={(event) => setFocusNote(event.target.value)} placeholder="What did you understand or finish?" className="field-control min-h-28 resize-y" /></Field><Button type="submit" variant="outline"><Check /> Save session</Button></div></form><div className="border-t hairline pt-5"><div className="flex items-start justify-between"><div><p className="mono-label text-pigment">Recent focus</p><h3 className="display-title mt-3 text-4xl">{focusLogs.length} sessions</h3></div><Target className="h-5 w-5 text-pigment" /></div>{focusLogs.length === 0 ? <EmptyState icon={<Clock3 />} title="Nothing logged yet" description="Your focus sessions will collect here as a quiet record of the work." /> : <div className="mt-6 divide-y hairline">{focusLogs.map((log) => <div key={log.id} className="py-5"><div className="flex items-baseline justify-between gap-4"><h4 className="display-title text-3xl">{subjectName(log.subject)}</h4><span className="mono-label text-pigment">{log.hours}</span></div><p className="mt-2 text-xs leading-6 text-muted">{log.note || "No note added"}</p></div>)}</div>}</div></div></div>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="max-w-2xl"><p className="mono-label text-pigment">{eyebrow}</p><h2 className="display-title mt-3 text-5xl leading-none sm:text-6xl">{title}</h2><p className="mt-5 max-w-xl text-sm leading-7 text-secondary-ink">{description}</p></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mono-label mb-2 block text-muted">{label}</span>{children}</label>; }
function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) { return <div className="mt-8 border-y hairline py-12"><div className="text-pigment [&_svg]:h-5 [&_svg]:w-5">{icon}</div><h3 className="display-title mt-5 text-4xl">{title}</h3><p className="mt-3 max-w-md text-sm leading-7 text-muted">{description}</p>{action && <div className="mt-6">{action}</div>}</div>; }
function subjectName(code: string) { return subjects.find((subject) => subject.code === code)?.name ?? code; }
function formatDate(date: string) { return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`)); }