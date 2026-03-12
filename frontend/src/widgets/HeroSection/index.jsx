import { useState } from "react";
import { Input, Tag, Avatar } from "antd";
import { SearchOutlined, FireFilled, PlayCircleFilled, ArrowRightOutlined } from "@ant-design/icons";
import s from "./HeroSection.module.css";

const HINTS = ["React", "Python", "ML", "Figma", "SQL"];

const FLOATING_CARDS = [
  { avatar: "AP", name: "Alex Petrov", lesson: "React Hooks Deep Dive",  progress: 68, color: "#6c63ff" },
  { avatar: "MC", name: "Maria Chen",  lesson: "Neural Networks 101",    progress: 34, color: "#ff6584" },
];

const HeroSection = () => {
  const [search, setSearch] = useState("");

  return (
    <section className={s.root}>
      {/* atmospheric blobs */}
      <div className={s.blob1} />
      <div className={s.blob2} />
      <div className={s.blob3} />
      <div className={s.dots} />

      <div className={s.inner}>

        {/* ── LEFT ── */}
        <div className={s.left}>
          <div className={s.badge}>
            <FireFilled style={{ color: "#ff6584", fontSize: 11 }} />
            <span>12,000+ lessons · 340K students</span>
            <span className={s.badgeDot} />
          </div>

          <h1 className={s.title}>
            <span className={s.t1}>Master</span>
            <span className={s.t2}>any <em className={s.em}>skill</em></span>
            <span className={s.t3}>online.</span>
          </h1>

          <p className={s.sub}>
            World-class video courses in programming, design &amp; data science.
            Learn at your pace — build things that matter.
          </p>

          {/* search */}
          <div className={s.searchBox}>
            <div className={s.searchRow}>
              <SearchOutlined className={s.searchIco} />
              <Input
                className={s.searchInput}
                placeholder="What do you want to learn?"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className={s.searchBtn}>
                Search <ArrowRightOutlined />
              </button>
            </div>
            <div className={s.hints}>
              <span className={s.hintsLabel}>Trending:</span>
              {HINTS.map(h => (
                <button key={h} className={s.hint} onClick={() => setSearch(h)}>{h}</button>
              ))}
            </div>
          </div>

          {/* social proof */}
          <div className={s.proof}>
            <div className={s.avatarStack}>
              {["#6c63ff","#ff6584","#43e97b","#ffd166"].map((bg, i) => (
                <div key={i} className={s.proofAvatar} style={{ background: bg, "--i": i }} />
              ))}
            </div>
            <span className={s.proofText}><strong>340K+</strong> learners enrolled</span>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className={s.right}>
          {/* big video card */}
          <div className={s.videoCard}>
            <div className={s.thumbWrap}>
              <img
                className={s.thumb}
                src="https://images.unsplash.com/photo-1581276879432-15e50529f34b?w=900&q=80"
                alt="course"
              />
              <div className={s.thumbDim} />
              <button className={s.playBtn}>
                <PlayCircleFilled className={s.playIco} />
                <span className={s.playRipple} />
              </button>
              <div className={s.thumbBadge}>
                <span className={s.liveDot} />
                <span>LIVE</span>
                <span className={s.viewers}>1,240 watching</span>
              </div>
            </div>
            <div className={s.cardFoot}>
              <Avatar size={38} style={{ background: "#6c63ff", fontWeight: 700, flexShrink: 0 }}>AP</Avatar>
              <div className={s.cardFootText}>
                <span className={s.cardFootTitle}>React Hooks Deep Dive</span>
                <span className={s.cardFootSub}>Alex Petrov · Lesson 14 / 42</span>
              </div>
              <button className={s.cardFootPlay}>▶</button>
            </div>
          </div>

          {/* floating progress pills */}
          {FLOATING_CARDS.map((c, i) => (
            <div key={i} className={`${s.pill} ${i === 0 ? s.pill0 : s.pill1}`}>
              <Avatar size={30} style={{ background: c.color, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{c.avatar}</Avatar>
              <div className={s.pillInfo}>
                <span className={s.pillName}>{c.name}</span>
                <span className={s.pillLesson}>{c.lesson}</span>
                <div className={s.pillBar}>
                  <div className={s.pillFill} style={{ width: `${c.progress}%`, background: c.color }} />
                </div>
              </div>
              <span className={s.pillPct} style={{ color: c.color }}>{c.progress}%</span>
            </div>
          ))}

          {/* big decorative number */}
          <div className={s.decoNum}>42<span className={s.decoSub}>courses</span></div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;