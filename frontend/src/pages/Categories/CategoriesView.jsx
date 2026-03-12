// src/pages/Categories/CategoriesPage.jsx
// Страница категорий — все курсы сгруппированы по категориям
// Клик на категорию → показывает курсы этой категории

import { useState, useMemo } from "react";
import { useNavigate }       from "react-router-dom";
import { useQuery, gql }     from "@apollo/client";
import { Tag }               from "antd";
import {
  StarFilled, ClockCircleOutlined, TeamOutlined,
  AppstoreOutlined, ArrowRightOutlined,
} from "@ant-design/icons";
import Header  from "@/widgets/Header";
import Footer  from "@/widgets/Footer";
import { toSlug } from "@/pages/CoursesView/courseUtils";
import s from "./CategoriesView.module.css";

const GET_ALL_COURSES = gql`
  query {
    allCourses {
      id title instructor avatar level category thumb isFree price
      rating students duration tag tagColor
    }
  }
`;

// Иконки и цвета для категорий
const CATEGORY_META = {
  "Programming":   { icon: "💻", color: "#6c63ff", bg: "rgba(108,99,255,.12)"  },
  "Machine Learning": { icon: "🤖", color: "#06b6d4", bg: "rgba(6,182,212,.12)"   },
  "Web Development":  { icon: "🌐", color: "#f59e0b", bg: "rgba(245,158,11,.12)"  },
  "Data Science":  { icon: "📊", color: "#10b981", bg: "rgba(16,185,129,.12)"  },
  "Design":        { icon: "🎨", color: "#ec4899", bg: "rgba(236,72,153,.12)"  },
  "Business":      { icon: "📈", color: "#f97316", bg: "rgba(249,115,22,.12)"  },
  "DevOps":        { icon: "⚙️",  color: "#64748b", bg: "rgba(100,116,139,.12)" },
  "Mobile":        { icon: "📱", color: "#8b5cf6", bg: "rgba(139,92,246,.12)"  },
};

const getCatMeta = (name) =>
  CATEGORY_META[name] ?? { icon: "📚", color: "var(--accent)", bg: "var(--accent-soft)" };

const CourseMini = ({ course, onClick }) => (
  <div className={s.courseMini} onClick={onClick}>
    <div className={s.courseMiniThumb}>
      <img src={course.thumb} alt={course.title} />
      {course.tag && (
        <span className={s.courseTag} style={{ background: course.tagColor }}>
          {course.tag}
        </span>
      )}
    </div>
    <div className={s.courseMiniBody}>
      <h4 className={s.courseMiniTitle}>{course.title}</h4>
      <p className={s.courseMiniInstructor}>{course.instructor} · {course.level}</p>
      <div className={s.courseMiniMeta}>
        <span><StarFilled style={{ color: "#fbbf24", fontSize: 11 }} /> {course.rating}</span>
        <span><ClockCircleOutlined style={{ fontSize: 10 }} /> {course.duration}</span>
        <span className={s.courseMiniPrice}>{course.isFree ? "Free" : course.price}</span>
      </div>
    </div>
  </div>
);

const CategoriesView = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  const { data, loading } = useQuery(GET_ALL_COURSES, { fetchPolicy: "cache-and-network" });
  const allCourses = data?.allCourses ?? [];

  // Группировка по категориям
  const categories = useMemo(() => {
    const map = new Map();
    for (const c of allCourses) {
      const cat = c.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(c);
    }
    return Array.from(map.entries())
      .map(([name, courses]) => ({ name, courses }))
      .sort((a, b) => b.courses.length - a.courses.length);
  }, [allCourses]);

  const activeCat = active ? categories.find(c => c.name === active) : null;

  return (
    <div className={s.root}>
      <Header />
      <main className={s.main}>

        {/* ── Hero ── */}
        <div className={s.hero}>
          <div className={s.heroBg} />
          <div className={s.heroContent}>
            <p className={s.heroTag}>Explore</p>
            <h1 className={s.heroTitle}>Categories</h1>
            <p className={s.heroSub}>
              {loading ? "Loading…" : `${categories.length} categories · ${allCourses.length} courses`}
            </p>
          </div>
        </div>

        <div className={s.body}>

          {/* ── Category cards grid ── */}
          <div className={s.catsGrid}>
            {categories.map(({ name, courses }) => {
              const meta    = getCatMeta(name);
              const isActive = active === name;
              return (
                <div
                  key={name}
                  className={`${s.catCard} ${isActive ? s.catCardActive : ""}`}
                  onClick={() => setActive(isActive ? null : name)}
                  style={isActive ? { borderColor: meta.color, background: meta.bg } : {}}
                >
                  <div className={s.catIcon} style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className={s.catInfo}>
                    <span className={s.catName}>{name}</span>
                    <span className={s.catCount}>{courses.length} course{courses.length !== 1 ? "s" : ""}</span>
                  </div>
                  <ArrowRightOutlined
                    className={s.catArrow}
                    style={{ transform: isActive ? "rotate(90deg)" : "none", color: isActive ? meta.color : undefined }}
                  />
                </div>
              );
            })}
          </div>

          {/* ── Selected category courses ── */}
          {activeCat && (
            <div className={s.catSection}>
              <div className={s.catSectionHead}>
                <div className={s.catSectionTitle}>
                  <span style={{ fontSize: 24 }}>{getCatMeta(activeCat.name).icon}</span>
                  <h2>{activeCat.name}</h2>
                  <span className={s.catSectionCount}>{activeCat.courses.length} courses</span>
                </div>
                <button
                  className={s.seeAllBtn}
                  onClick={() => navigate(`/courses?category=${encodeURIComponent(activeCat.name)}`)}
                >
                  See all <ArrowRightOutlined />
                </button>
              </div>
              <div className={s.coursesGrid}>
                {activeCat.courses.map(course => (
                  <CourseMini
                    key={course.id}
                    course={course}
                    onClick={() => navigate(`/courses/${toSlug(course.title)}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Browse all ── */}
          {!activeCat && !loading && (
            <div className={s.browseAll}>
              <p className={s.browseAllText}>
                Выбери категорию выше чтобы посмотреть курсы, или просмотри все сразу
              </p>
              <button className={s.browseAllBtn} onClick={() => navigate("/courses")}>
                <AppstoreOutlined /> All Courses
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoriesView;