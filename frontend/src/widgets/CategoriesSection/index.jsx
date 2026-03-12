import { useState } from "react";
import s from "./CategoriesSection.module.css";

const CATS = [
  { id: 1, icon: "💻", label: "Programming", count: 1240, color: "#6c63ff", bg: "rgba(108,99,255,0.1)" },
  { id: 2, icon: "📐", label: "Mathematics",  count: 870,  color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  { id: 3, icon: "🔬", label: "Science",      count: 650,  color: "#43e97b", bg: "rgba(67,233,123,0.1)" },
  { id: 4, icon: "🎨", label: "Design",       count: 430,  color: "#ff6584", bg: "rgba(255,101,132,0.1)" },
  { id: 5, icon: "📊", label: "Business",     count: 390,  color: "#ffd166", bg: "rgba(255,209,102,0.1)" },
  { id: 6, icon: "🌍", label: "Languages",    count: 720,  color: "#f472b6", bg: "rgba(244,114,182,0.1)" },
  { id: 7, icon: "🎵", label: "Music",        count: 280,  color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  { id: 8, icon: "📸", label: "Photography",  count: 190,  color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
];

const CategoriesSection = () => {
  const [active, setActive] = useState(null);

  return (
    <section className={s.root}>
      <div className={s.head}>
        <div>
          <p className={s.tag}>Explore</p>
          <h2 className={s.title}>Browse by Category</h2>
        </div>
        <button className={s.seeAll}>See all categories →</button>
      </div>

      <div className={s.track}>
        {CATS.map(cat => (
          <button
            key={cat.id}
            className={`${s.card} ${active === cat.id ? s.cardActive : ""}`}
            onClick={() => setActive(active === cat.id ? null : cat.id)}
            style={{ "--c": cat.color, "--bg": cat.bg }}
          >
            <div className={s.cardGlow} />
            <span className={s.cardIcon}>{cat.icon}</span>
            <span className={s.cardLabel}>{cat.label}</span>
            <span className={s.cardCount}>{cat.count.toLocaleString()} courses</span>
            <div className={s.cardArrow}>→</div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;