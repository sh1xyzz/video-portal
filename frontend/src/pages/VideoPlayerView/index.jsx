import { useState } from "react";
import { Button, Progress, Tooltip, Drawer } from "antd";
import {
  PlayCircleFilled,
  PauseCircleFilled,
  CheckCircleFilled,
  ArrowLeftOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
  FullscreenOutlined,
  SoundOutlined,
  SettingOutlined,
  MenuOutlined,
  CheckOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import s from "./VideoPlayerView.module.css";

const COURSE = {
  title: "Full-Stack React & Node.js",
  thumb: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=80",
};

const CURRICULUM = [
  {
    id: "s1",
    section: "Getting Started",
    lessons: [
      { id: 1,  title: "Course Overview",                duration: "5:12",  done: true  },
      { id: 2,  title: "Setting Up Your Environment",    duration: "12:40", done: true  },
      { id: 3,  title: "Project Architecture Deep Dive", duration: "18:05", done: false },
    ],
  },
  {
    id: "s2",
    section: "React Fundamentals",
    lessons: [
      { id: 4,  title: "JSX & Component Basics",  duration: "22:10", done: false },
      { id: 5,  title: "useState & useEffect",    duration: "35:00", done: false },
      { id: 6,  title: "Custom Hooks",            duration: "28:15", done: false },
      { id: 7,  title: "Context & useReducer",    duration: "41:20", done: false },
    ],
  },
  {
    id: "s3",
    section: "Node.js & Express",
    lessons: [
      { id: 8,  title: "Node.js Fundamentals",    duration: "30:00", done: false },
      { id: 9,  title: "Building REST APIs",      duration: "45:30", done: false },
      { id: 10, title: "Authentication with JWT", duration: "38:10", done: false },
    ],
  },
  {
    id: "s4",
    section: "Database & Deployment",
    lessons: [
      { id: 11, title: "PostgreSQL & Prisma ORM", duration: "52:00", done: false },
      { id: 12, title: "GraphQL Introduction",    duration: "44:20", done: false },
      { id: 13, title: "Docker & Deployment",     duration: "60:00", done: false },
    ],
  },
];

const ALL_LESSONS = CURRICULUM.flatMap(s => s.lessons);
const TOTAL       = ALL_LESSONS.length;

const VideoPlayerView = () => {
  const [activeId,    setActiveId]    = useState(3);
  const [playing,     setPlaying]     = useState(false);
  const [scrub,       setScrub]       = useState(30);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [doneLessons, setDoneLessons] = useState(
    new Set(ALL_LESSONS.filter(l => l.done).map(l => l.id))
  );

  const active   = ALL_LESSONS.find(l => l.id === activeId);
  const idx      = ALL_LESSONS.findIndex(l => l.id === activeId);
  const prev     = ALL_LESSONS[idx - 1];
  const next     = ALL_LESSONS[idx + 1];
  const cpct     = Math.round((doneLessons.size / TOTAL) * 100);

  const goTo = (lesson) => {
    if (!lesson) return;
    setActiveId(lesson.id);
    setPlaying(false);
    setScrub(0);
  };

  const toggleDone = (id) =>
    setDoneLessons(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const handleScrub = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setScrub(Math.round(((e.clientX - r.left) / r.width) * 100));
  };

  return (
    <div className={s.root}>

      {/* ─── TOP BAR ─── */}
      <header className={s.topbar}>
        <div className={s.topLeft}>
          <button className={s.backBtn}>
            <ArrowLeftOutlined /> <span>Back</span>
          </button>
          <div className={s.topbarDiv} />
          <span className={s.topLogo}>⚡</span>
          <div className={s.topMeta}>
            <span className={s.topTitle}>{COURSE.title}</span>
            <span className={s.topSub}>
              {idx + 1}/{TOTAL} — {active?.title}
            </span>
          </div>
        </div>

        <div className={s.topRight}>
          <button
            className={`${s.markBtn} ${doneLessons.has(activeId) ? s.markDone : ""}`}
            onClick={() => toggleDone(activeId)}
          >
            <CheckOutlined />
            <span>{doneLessons.has(activeId) ? "Completed" : "Mark done"}</span>
          </button>
          <button className={s.menuBtn} onClick={() => setDrawerOpen(true)}>
            <MenuOutlined />
            <span>Contents</span>
          </button>
        </div>
      </header>

      {/* ─── VIDEO ─── */}
      <div className={s.videoWrap}>
        <img
          key={activeId}
          className={s.thumb}
          src={COURSE.thumb}
          alt={active?.title}
        />

        {/* dim overlay */}
        <div className={s.dimOverlay} />

        {/* big play button */}
        <button className={s.bigPlay} onClick={() => setPlaying(v => !v)}>
          {playing
            ? <PauseCircleFilled className={s.bigPlayIcon} />
            : <PlayCircleFilled  className={s.bigPlayIcon} />
          }
        </button>

        {/* gradient + controls */}
        <div className={s.controlsWrap}>
          <div className={s.controls}>
            {/* scrub bar */}
            <div className={s.scrubRow}>
              <span className={s.timeLabel}>3:45</span>
              <div className={s.scrubTrack} onClick={handleScrub}>
                <div className={s.scrubFill} style={{ width: `${scrub}%` }}>
                  <div className={s.scrubThumb} />
                </div>
              </div>
              <span className={s.timeLabel}>{active?.duration}</span>
            </div>

            {/* buttons row */}
            <div className={s.btnRow}>
              <div className={s.ctrlLeft}>
                <Tooltip title="Previous lesson">
                  <button className={s.ctrlBtn} onClick={() => goTo(prev)} disabled={!prev}>
                    <StepBackwardOutlined />
                  </button>
                </Tooltip>
                <button className={`${s.ctrlBtn} ${s.ctrlPlay}`} onClick={() => setPlaying(v => !v)}>
                  {playing ? <PauseCircleFilled /> : <PlayCircleFilled />}
                </button>
                <Tooltip title="Next lesson">
                  <button className={s.ctrlBtn} onClick={() => goTo(next)} disabled={!next}>
                    <StepForwardOutlined />
                  </button>
                </Tooltip>
                <div className={s.ctrlTime}>
                  <ClockCircleOutlined />
                  <span>Lesson {idx + 1} of {TOTAL}</span>
                </div>
              </div>

              <div className={s.ctrlCenter}>
                <span className={s.ctrlTitle}>{active?.title}</span>
              </div>

              <div className={s.ctrlRight}>
                <button className={s.ctrlBtn}><SoundOutlined /></button>
                <button className={s.ctrlBtn}><SettingOutlined /></button>
                <button className={s.ctrlBtn}><FullscreenOutlined /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM: COURSE PROGRESS ─── */}
      <div className={s.bottom}>
        {/* chips row */}
        <div className={s.chipsWrap}>
          <div className={s.chips}>
            {ALL_LESSONS.map((lesson, i) => (
              <Tooltip key={lesson.id} title={`${lesson.title} · ${lesson.duration}`} placement="top">
                <button
                  className={`${s.chip}
                    ${lesson.id === activeId     ? s.chipActive : ""}
                    ${doneLessons.has(lesson.id) ? s.chipDone   : ""}
                  `}
                  onClick={() => goTo(lesson)}
                >
                  {doneLessons.has(lesson.id)
                    ? <CheckCircleFilled className={s.chipIcon} />
                    : <span className={s.chipNum}>{i + 1}</span>
                  }
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* progress bar + label */}
        <div className={s.bottomProgress}>
          <div className={s.progressTrack}>
            <div
              className={s.progressFill}
              style={{ width: `${cpct}%` }}
            />
          </div>
          <div className={s.progressInfo}>
            <span className={s.progressLabel}>
              Course progress
            </span>
            <span className={s.progressValue}>
              {doneLessons.size}/{TOTAL} lessons · <strong style={{ color: "var(--accent3)" }}>{cpct}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ─── DRAWER: curriculum ─── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="right"
        width={340}
        title={
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "var(--text)" }}>
            Course Contents
          </span>
        }
        styles={{
          body:   { padding: 0, background: "var(--bg2)", overflowY: "auto" },
          header: { background: "var(--bg2)", borderColor: "var(--border)" },
          mask:   { backdropFilter: "blur(6px)", background: "rgba(5,5,12,0.55)" },
        }}
      >
        {/* progress inside drawer */}
        <div className={s.drawerTop}>
          <Progress
            percent={cpct}
            showInfo={false}
            strokeColor="var(--accent3)"
            trailColor="var(--bg3)"
            size="small"
          />
          <span className={s.drawerMeta}>{doneLessons.size} of {TOTAL} completed · {cpct}%</span>
        </div>

        {CURRICULUM.map(sec => (
          <div key={sec.id} className={s.drawerSec}>
            <p className={s.drawerSecTitle}>{sec.section}</p>
            {sec.lessons.map((lesson, li) => (
              <button
                key={lesson.id}
                className={`${s.drawerItem} ${lesson.id === activeId ? s.drawerItemActive : ""}`}
                onClick={() => { goTo(lesson); setDrawerOpen(false); }}
              >
                <div className={s.drawerItemIcon}>
                  {doneLessons.has(lesson.id)
                    ? <CheckCircleFilled style={{ color: "var(--accent3)", fontSize: 14 }} />
                    : <span className={s.drawerNum}>{li + 1}</span>
                  }
                </div>
                <div className={s.drawerItemBody}>
                  <span className={s.drawerItemTitle}>{lesson.title}</span>
                  <span className={s.drawerItemDur}>{lesson.duration}</span>
                </div>
                {lesson.id === activeId && (
                  <PlayCircleFilled style={{ color: "var(--accent)", fontSize: 13, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        ))}
      </Drawer>

    </div>
  );
};

export default VideoPlayerView;