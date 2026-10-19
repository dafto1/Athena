import { BookOpen, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, FileText, Plus, Search, Users } from "lucide-react";
import styles from "./landing.module.css";

const tasks = [
  { title: "Revise binary trees", course: "Data Structures", due: "Today", color: "rose" },
  { title: "Finish lab report", course: "Web Technology", due: "Tomorrow", color: "amber" },
  { title: "Read chapter 06", course: "Database Systems", due: "Oct 18", color: "green" },
];

export function WorkspacePreview() {
  return <section className={styles.previewFrame} data-gsap="frame" id="workspace" aria-label="Athena workspace preview">
    <aside className={styles.sidebar} data-gsap="sidebar">
      <div className={styles.account}><span className={styles.accountIcon}>a</span><span><b>Athena</b><small>My workspace</small></span><ChevronDown size={14} /></div>
      <div className={styles.search}><Search size={14} /><span>Quick find</span><kbd>⌘ K</kbd></div>
      <p className={styles.sideLabel}>WORKSPACE</p>
      <div className={`${styles.sideItem} ${styles.sideActive}`}><span>⌂</span> Home</div>
      <div className={styles.sideItem}><Check size={15} /> Tasks <span className={styles.count}>3</span></div>
      <div className={styles.sideItem}><Clock3 size={15} /> Focus timer</div>
      <div className={styles.sideItem}><FileText size={15} /> Resources</div>
      <div className={styles.sideItem}><Users size={15} /> Study groups</div>
      <div className={styles.sideItem}><CalendarDays size={15} /> Calendar</div>
      <div className={styles.sidebarBottom}><CircleHelp size={15} /> Help & feedback</div>
    </aside>
    <div className={styles.workspace}>
      <div className={styles.workspaceTop}><span>Home <span className={styles.crumb}>/</span> Overview</span><span className={styles.workspaceDate}>MONDAY, OCTOBER 12</span><span className={styles.userDot}>S</span></div>
      <div className={styles.greeting} data-gsap="greeting"><span className={styles.greetingLabel}>MONDAY, OCTOBER 12</span><h2>Good morning, Shreyas <span>✳</span></h2><p>Here’s what’s on your plate today.</p></div>
      <div className={styles.workspaceGrid}>
        <div className={styles.taskList}><div className={styles.widgetHeading}><div><span className={styles.widgetIcon}><Check size={14} /></span><b>Up next</b></div><span>3 tasks <span className={styles.mutedDot}>·</span> View all ↗</span></div>
          {tasks.map((task) => <div className={styles.taskRow} data-gsap="task" key={task.title}><span className={`${styles.taskCheck} ${styles[task.color]}`}><Check size={10} /></span><div><b>{task.title}</b><small><BookOpen size={11} /> {task.course}</small></div><span className={styles.due}>{task.due}</span></div>)}
          <div className={styles.addTask}><Plus size={13} /> Add a task</div>
        </div>
        <div className={styles.focusCard} data-gsap="focus"><div className={styles.widgetHeading}><div><span className={styles.widgetIcon}><Clock3 size={14} /></span><b>Focus</b></div><span>Open ↗</span></div><div className={styles.clockFace}><span>25</span><small>MIN</small></div><p>One thing at a time.</p><div className={styles.focusButton}>Start a session <span>→</span></div></div>
      </div>
      <div className={styles.resourceBar} data-gsap="resource"><div className={styles.widgetIcon}><FileText size={14} /></div><div><b>Recently opened</b><small>Data Structures · Lecture 08.pdf</small></div><span>PDF</span></div>
    </div>
  </section>;
}
