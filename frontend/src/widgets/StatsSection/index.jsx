import s from "./StatsSection.module.css";

const STATS = [
  { value: "12K+",  label: "Video Lessons",      sub: "across all topics" },
  { value: "340K+", label: "Active Students",     sub: "from 90+ countries" },
  { value: "98%",   label: "Satisfaction Rate",   sub: "based on 50K reviews" },
  { value: "850+",  label: "Expert Instructors",  sub: "industry practitioners" },
  { value: "4.9★",  label: "Average Rating",      sub: "across all courses" },
];

const StatsSection = () => (
  <div className={s.root}>
    <div className={s.inner}>
      {STATS.map((s2, i) => (
        <div key={i} className={s.item}>
          <span className={s.value}>{s2.value}</span>
          <div className={s.textCol}>
            <span className={s.label}>{s2.label}</span>
            <span className={s.sub}>{s2.sub}</span>
          </div>
          {i < STATS.length - 1 && <div className={s.sep} />}
        </div>
      ))}
    </div>
  </div>
);

export default StatsSection;