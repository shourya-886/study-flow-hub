import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
type Tab = "classes" | "exams" | "study" | "focus";
type Exam = { id: number; subject: string; date: string; syllabus: string };
type FocusLog = { id: number; subject: string; hours: string; note: string };

const days: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = [
  { label: "01", time: "08:00 — 09:25" },
  { label: "02", time: "09:35 — 11:00" },
  { label: "03", time: "11:10 — 12:35" },
  { label: "04", time: "13:25 — 14:50" },
  { label: "05", time: "15:00 — 16:25" },
];
const subjects = [
  { code: "PRT", name: "Physics" },
  { code: "BIO KP", name: "Biology" },
  { code: "MPJ", name: "Mental ability" },
  { code: "MLK", name: "Maths" },
  { code: "TELUGU/HINDI", name: "Language" },
  { code: "CSM", name: "Chemistry" },
  { code: "SOCIAL PNCF", name: "Social" },
  { code: "ENGLISH PNCF", name: "English" },
  { code: "—", name: "Free period" },
];
const initialTimetable: Record<Day, string[]> = {
  Monday: ["PRT", "BIO KP", "MPJ", "MLK", "CSM"],
  Tuesday: ["MLK", "PRT", "TELUGU/HINDI", "BIO KP", "ENGLISH PNCF"],
  Wednesday: ["CSM", "MPJ", "MLK", "PRT", "SOCIAL PNCF"],
  Thursday: ["BIO KP", "CSM", "ENGLISH PNCF", "MLK", "PRT"],
  Friday: ["MPJ", "TELUGU/HINDI", "CSM", "BIO KP", "MLK"],
};

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
  const [timetable, setTimetable] = useState(initialTimetable);
  const [selectedDay, setSelectedDay] = useState<Day>("Monday");
  const [exams, setExams] = useState<Exam[]>([]);
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>([]);
  const [examSubject, setExamSubject] = useState("Physics");
  const [examDate, setExamDate] = useState("2026-09-22");
  const [examSyllabus, setExamSyllabus] = useState("");
  const [focusSubject, setFocusSubject] = useState("PRT");
  const [focusHours, setFocusHours] = useState("1 hour");
  const [focusNote, setFocusNote] = useState("");

  const currentClasses = timetable[selectedDay];
  const studyPlan = useMemo(() => {
    return exams.flatMap((exam) => {
      const topics = exam.syllabus.split(/[\n,]+/).map((topic) => topic.trim()).filter(Boolean);
      return topics.map((topic, index) => ({ exam, topic, day: index + 1 }));
    });
  }, [exams]);

  function updateClass(day: Day, index: number, value: string) {
    setTimetable((current) => ({
      ...current,
      [day]: current[day].map((subject, subjectIndex) => subjectIndex === index ? value : subject),
    }));
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
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-ink text-sm font-semibold">SD</span>
            <span className="mono-label text-secondary-ink">Study desk / 01</span>
          </div>
          <span className="mono-label hidden text-muted md:block">School week · 08:00 — 16:30</span>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-20 lg:px-10">
        <section className="grid gap-10 border-b hairline py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-16">
          <div>
            <p className="mono-label mb-5 text-pigment">A quieter way to keep up</p>
            <h1 className="display-title max-w-3xl text-6xl leading-[0.9] text-ink sm:text-7xl lg:text-8xl">
              Your week, <em className="text-pigment">held together.</em>
            </h1>
          </div>
          <div className="max-w-md lg:justify-self-end">
            <p className="text-sm leading-7 text-secondary-ink">Keep classes in view, turn exam syllabi into a study rhythm, and leave a small record of the hours you showed up.</p>
            <div className="mt-7 flex items-center gap-3 mono-label text-muted"><span className="h-px w-10 bg-pigment" />Five periods / one desk</div>
          </div>
        </section>

        <nav aria-label="Planner sections" className="grid border-b hairline sm:grid-cols-4">
          <TabButton active={activeTab === "classes"} icon={<CalendarDays />} onClick={() => setActiveTab("classes")} label="Class timetable" number="01" />
          <TabButton active={activeTab === "exams"} icon={<BookOpen />} onClick={() => setActiveTab("exams")} label="Exam timetable" number="02" />
          <TabButton active={activeTab === "study"} icon={<ListChecks />} onClick={() => setActiveTab("study")} label="Study plan" number="03" />
          <TabButton active={activeTab === "focus"} icon={<Timer />} onClick={() => setActiveTab("focus")} label="Focus session" number="04" />
        </nav>

        <section className="pt-10">
          {activeTab === "classes" && <ClassTimetable timetable={timetable} selectedDay={selectedDay} setSelectedDay={setSelectedDay} updateClass={updateClass} />}
          {activeTab === "exams" && <ExamTimetable exams={exams} examSubject={examSubject} setExamSubject={setExamSubject} examDate={examDate} setExamDate={setExamDate} examSyllabus={examSyllabus} setExamSyllabus={setExamSyllabus} addExam={addExam} removeExam={(id) => setExams((current) => current.filter((exam) => exam.id !== id))} />}
          {activeTab === "study" && <StudyPlan exams={exams} plan={studyPlan} setActiveTab={setActiveTab} />}
          {activeTab === "focus" && <FocusSession days={days} selectedDay={selectedDay} setSelectedDay={setSelectedDay} currentClasses={currentClasses} subjectName={subjectName} focusSubject={focusSubject} setFocusSubject={setFocusSubject} focusHours={focusHours} setFocusHours={setFocusHours} focusNote={focusNote} setFocusNote={setFocusNote} addFocusLog={addFocusLog} focusLogs={focusLogs} />}
        </section>
      </div>
    </main>
  );
}

function TabButton({ active, icon, onClick, label, number }: { active: boolean; icon: ReactNode; onClick: () => void; label: string; number: string }) {
  return <button onClick={onClick} className={`group flex min-h-20 items-center justify-between border-b-2 px-0 py-4 text-left transition-colors sm:px-3 ${active ? "border-pigment text-pigment" : "border-transparent text-secondary-ink hover:text-pigment"}`}>
    <span className="flex items-center gap-3"><span className="text-pigment [&_svg]:h-4 [&_svg]:w-4">{icon}</span><span className="mono-label text-[10px]">{label}</span></span><span className="mono-label text-muted">{number}</span>
  </button>;
}

function ClassTimetable({ timetable, selectedDay, setSelectedDay, updateClass }: { timetable: Record<Day, string[]>; selectedDay: Day; setSelectedDay: (day: Day) => void; updateClass: (day: Day, index: number, value: string) => void }) {
  return <div>
    <SectionHeading eyebrow="Your week at a glance" title="Class timetable" description="Choose a day, then set the subject in each period. The times are shaped around your 08:00 to 16:30 school day." />
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_260px]">
      <div className="overflow-x-auto border-y hairline">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[112px_repeat(5,minmax(120px,1fr))] border-b hairline bg-secondary-ground">
            <div className="p-4 mono-label text-muted">period</div>
            {days.map((day) => <button key={day} onClick={() => setSelectedDay(day)} className={`border-l hairline p-4 text-left mono-label transition-colors ${selectedDay === day ? "text-pigment" : "text-muted hover:text-ink"}`}>{day.slice(0, 3)}</button>)}
          </div>
          {periods.map((period, index) => <div key={period.label} className="grid grid-cols-[112px_repeat(5,minmax(120px,1fr))] border-b hairline last:border-b-0">
            <div className="flex flex-col justify-center gap-1 p-4"><span className="display-title text-2xl text-ink">{period.label}</span><span className="mono-label text-[9px] text-muted">{period.time}</span></div>
            {days.map((day) => <div key={day} className={`border-l hairline p-3 ${selectedDay === day ? "bg-secondary-ground/60" : ""}`}><select aria-label={`${day} period ${period.label}`} value={timetable[day][index]} onChange={(event) => updateClass(day, index, event.target.value)} className="w-full cursor-pointer border-b border-line bg-transparent py-2 font-mono text-xs tracking-[0.08em] text-ink outline-none focus:border-pigment">{subjects.map((subject) => <option key={subject.code} value={subject.code}>{subject.code}</option>)}</select><span className="mt-2 block text-xs text-muted">{subjectName(timetable[day][index])}</span></div>)}
          </div>)}
          <div className="grid grid-cols-[112px_1fr] bg-secondary-ground"><div className="p-4 mono-label text-muted">pause</div><p className="p-4 text-xs text-secondary-ink">10 min between periods · lunch 12:45 — 13:25 · 5 min flex at close</p></div>
        </div>
      </div>
      <aside className="border-t hairline pt-5 lg:border-l lg:border-t-0 lg:pl-7">
        <p className="mono-label text-pigment">Selected day</p><h2 className="display-title mt-3 text-4xl">{selectedDay}</h2>
        <div className="mt-7 space-y-0 border-y hairline">{timetable[selectedDay].map((code, index) => <div key={`${code}-${index}`} className="flex items-center justify-between border-b hairline py-3 last:border-b-0"><span className="mono-label text-muted">{periods[index].label} / {periods[index].time.split(" ")[0]}</span><span className="text-sm text-ink">{subjectName(code)}</span></div>)}</div>
        <p className="mt-6 text-xs leading-6 text-muted">Your shorthand stays visible in the grid, while the full subject name keeps the list easy to scan.</p>
      </aside>
    </div>
  </div>;
}

function ExamTimetable({ exams, examSubject, setExamSubject, examDate, setExamDate, examSyllabus, setExamSyllabus, addExam, removeExam }: { exams: Exam[]; examSubject: string; setExamSubject: (value: string) => void; examDate: string; setExamDate: (value: string) => void; examSyllabus: string; setExamSyllabus: (value: string) => void; addExam: () => void; removeExam: (id: number) => void }) {
  return <div><SectionHeading eyebrow="What is coming up" title="Exam timetable" description="Add an exam date and list the syllabus as comma-separated chapters or one topic per line." />
    <div className="mt-10 grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
      <form onSubmit={(event) => { event.preventDefault(); addExam(); }} className="border-t hairline pt-5">
        <p className="mono-label text-pigment">New exam</p>
        <div className="mt-6 space-y-5"><Field label="Subject"><select value={examSubject} onChange={(event) => setExamSubject(event.target.value)} className="field-control">{subjects.filter((subject) => subject.code !== "—").map((subject) => <option key={subject.name}>{subject.name}</option>)}</select></Field><Field label="Date"><input required type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} className="field-control" /></Field><Field label="Syllabus"><textarea value={examSyllabus} onChange={(event) => setExamSyllabus(event.target.value)} placeholder="Current electricity, ray optics, semiconductors" className="field-control min-h-32 resize-y" /></Field><Button type="submit" variant="outline" className="mt-2"><Plus /> Add exam</Button></div>
      </form>
      <div className="border-t hairline pt-5"><p className="mono-label text-pigment">Upcoming exams <span className="text-muted">/ {String(exams.length).padStart(2, "0")}</span></p>{exams.length === 0 ? <EmptyState icon={<CalendarDays />} title="No exams on the desk yet" description="Add the next exam to turn its chapters into a study plan." /> : <div className="mt-6 divide-y hairline">{exams.map((exam) => <div key={exam.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_140px_34px] sm:items-start"><div><h3 className="display-title text-3xl">{exam.subject}</h3><p className="mt-2 text-xs text-muted">{exam.syllabus || "Syllabus not added yet"}</p></div><div className="mono-label text-pigment">{formatDate(exam.date)}</div><button aria-label={`Remove ${exam.subject} exam`} onClick={() => removeExam(exam.id)} className="text-muted transition-colors hover:text-pigment"><Trash2 className="h-4 w-4" /></button></div>)}</div>}</div>
    </div>
  </div>;
}

function StudyPlan({ exams, plan, setActiveTab }: { exams: Exam[]; plan: { exam: Exam; topic: string; day: number }[]; setActiveTab: (tab: Tab) => void }) {
  return <div><SectionHeading eyebrow="From chapters to action" title="Study plan" description="Each syllabus topic becomes a small daily lesson. Revise the last topic before the exam date." />
    {exams.length === 0 ? <EmptyState icon={<Sparkles />} title="Your plan will appear here" description="Start by adding an exam with its syllabus. The desk will space the topics into daily sessions." action={<Button variant="outline" onClick={() => setActiveTab("exams")}>Add an exam <ArrowRight /></Button>} /> : <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_280px]"><div className="border-y hairline">{plan.map((item, index) => <div key={`${item.exam.id}-${item.topic}`} className="grid gap-4 border-b hairline py-5 last:border-b-0 sm:grid-cols-[72px_1fr_150px]"><span className="display-title text-3xl text-pigment">{String(index + 1).padStart(2, "0")}</span><div><p className="text-sm text-ink">{item.topic}</p><p className="mt-2 mono-label text-muted">{item.exam.subject} / lesson {item.day}</p></div><span className="mono-label text-muted">{item.day === 1 ? "Start today" : `Day ${item.day}`}</span></div>)}</div><aside className="border-t hairline pt-5"><p className="mono-label text-pigment">Method</p><div className="mt-5 space-y-5 text-xs leading-6 text-secondary-ink"><p><span className="text-pigment">01</span> One chapter becomes one clear session.</p><p><span className="text-pigment">02</span> The final topic is marked for revision.</p><p><span className="text-pigment">03</span> Log the time you actually gave it.</p></div></aside></div>}
  </div>;
}

function FocusSession({ days, selectedDay, setSelectedDay, currentClasses, subjectName, focusSubject, setFocusSubject, focusHours, setFocusHours, focusNote, setFocusNote, addFocusLog, focusLogs }: { days: Day[]; selectedDay: Day; setSelectedDay: (day: Day) => void; currentClasses: string[]; subjectName: (code: string) => string; focusSubject: string; setFocusSubject: (value: string) => void; focusHours: string; setFocusHours: (value: string) => void; focusNote: string; setFocusNote: (value: string) => void; addFocusLog: () => void; focusLogs: FocusLog[] }) {
  return <div><SectionHeading eyebrow="Time well spent" title="Focus session" description="Choose the day and class you focused on, then leave a short note about what moved forward." />
    <div className="mt-10 grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
      <form onSubmit={(event) => { event.preventDefault(); addFocusLog(); }} className="border-t hairline pt-5"><p className="mono-label text-pigment">Log a session</p><div className="mt-6 space-y-5"><Field label="Class day"><select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value as Day)} className="field-control">{days.map((day) => <option key={day}>{day}</option>)}</select></Field><Field label="Class"><select value={focusSubject} onChange={(event) => setFocusSubject(event.target.value)} className="field-control">{currentClasses.filter((code) => code !== "—").map((code, index) => <option key={`${code}-${index}`} value={code}>{subjectName(code)} · {code}</option>)}</select></Field><Field label="Hours focused"><select value={focusHours} onChange={(event) => setFocusHours(event.target.value)} className="field-control">{["30 minutes", "1 hour", "1.5 hours", "2 hours", "3 hours"].map((hours) => <option key={hours}>{hours}</option>)}</select></Field><Field label="Note"><textarea value={focusNote} onChange={(event) => setFocusNote(event.target.value)} placeholder="What did you understand or finish?" className="field-control min-h-28 resize-y" /></Field><Button type="submit" variant="outline"><Check /> Save session</Button></div></form>
      <div className="border-t hairline pt-5"><div className="flex items-start justify-between"><div><p className="mono-label text-pigment">Recent focus</p><h3 className="display-title mt-3 text-4xl">{focusLogs.length} sessions</h3></div><Target className="h-5 w-5 text-pigment" /></div>{focusLogs.length === 0 ? <EmptyState icon={<Clock3 />} title="Nothing logged yet" description="Your focus sessions will collect here as a quiet record of the work." /> : <div className="mt-6 divide-y hairline">{focusLogs.map((log) => <div key={log.id} className="py-5"><div className="flex items-baseline justify-between gap-4"><h4 className="display-title text-3xl">{subjectName(log.subject)}</h4><span className="mono-label text-pigment">{log.hours}</span></div><p className="mt-2 text-xs leading-6 text-muted">{log.note || "No note added"}</p></div>)}</div>}</div>
    </div>
  </div>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="max-w-2xl"><p className="mono-label text-pigment">{eyebrow}</p><h2 className="display-title mt-3 text-5xl leading-none sm:text-6xl">{title}</h2><p className="mt-5 max-w-xl text-sm leading-7 text-secondary-ink">{description}</p></div>; }

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mono-label mb-2 block text-muted">{label}</span>{children}</label>; }

function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) { return <div className="mt-8 border-y hairline py-12"><div className="text-pigment [&_svg]:h-5 [&_svg]:w-5">{icon}</div><h3 className="display-title mt-5 text-4xl">{title}</h3><p className="mt-3 max-w-md text-sm leading-7 text-muted">{description}</p>{action && <div className="mt-6">{action}</div>}</div>; }

function subjectName(code: string) { return subjects.find((subject) => subject.code === code)?.name ?? code; }
function formatDate(date: string) { return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`)); }
