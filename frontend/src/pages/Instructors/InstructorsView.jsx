// src/pages/Instructors/InstructorsPage.jsx
// Страница преподавателей — карточки инструкторов + их курсы при клике

import { useState, useMemo } from "react";
import { useNavigate }       from "react-router-dom";
import { useQuery, gql }     from "@apollo/client";
import {
  StarFilled, BookOutlined, TeamOutlined,
  SearchOutlined, ArrowRightOutlined,
} from "@ant-design/icons";
import Header  from "@/widgets/Header";
import Footer  from "@/widgets/Footer";
import { toSlug } from "@/pages/CoursesView/courseUtils";
import s from "./InstructorsView.module.css";

const GET_ALL_COURSES = gql`
  query {
    allCourses {
      id title instructor avatar level category thumb isFree price rating students duration
    }
  }
`;

// Цвета для аватаров
const AVATAR_COLORS = [
  "#6c63ff","#06b6d4","#10b981","#f59e0b",
  "#ec4899","#f97316","#8b5cf6","#ef4444",
];
const getColor = (name) =>
  AVATAR_COLORS[Math.abs([...name].reduce((a,c)=>a+c.charCodeAt(0),0)) % AVATAR_COLORS.length];

const InstructorsView = () => {
  const navigate = useNavigate();
  const [search, setSearch]   = useState("");
  const [active, setActive]   = useState(null);

  const { data, loading } = useQuery(GET_ALL_COURSES, { fetchPolicy: "cache-and-network" });
  const allCourses = data?.allCourses ?? [];

  // Группируем по инструктору
  const instructors = useMemo(() => {
    const map = new Map();
    for (const c of allCourses) {
      if (!map.has(c.instructor)) {
        map.set(c.instructor, {
          name:    c.instructor,
          avatar:  c.avatar,
          courses: [],
        });
      }
      map.get(c.instructor).courses.push(c);
    }
    return Array.from(map.values()).map(inst => {
      const courses   = inst.courses;
      const avgRating = courses.reduce((s,c) => s + c.rating, 0) / courses.length;
      const students  = courses.reduce((s,c) => s + c.students, 0);
      return { ...inst, avgRating: avgRating.toFixed(1), students, courseCount: courses.length };
    }).sort((a, b) => b.students - a.students);
  }, [allCourses]);

  const filtered = useMemo(() => {
    if (!search) return instructors;
    return instructors.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [instructors, search]);

  const activeInst = active ? instructors.find(i => i.name === active) : null;

  return (
    <div className={s.root}>
      <Header />
      <main className={s.main}>

        {/* Hero */}
        <div className={s.hero}>
          <div className={s.heroBg} />
          <div className={s.heroContent}>
            <p className={s.heroTag}>Our Team</p>
            <h1 className={s.heroTitle}>Instructors</h1>
            <p className={s.heroSub}>
              {loading ? "Loading…" : `${instructors.length} world-class instructors`}
            </p>
          </div>
        </div>

        <div className={s.body}>
          {/* Search */}
          <div className={s.searchWrap}>
            <SearchOutlined className={s.searchIco} />
            <input
              className={s.searchInput}
              placeholder="Search instructors…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Instructors grid */}
          <div className={s.grid}>
            {filtered.map(inst => {
              const isActive = active === inst.name;
              const color    = getColor(inst.name);
              return (
                <div
                  key={inst.name}
                  className={`${s.card} ${isActive ? s.cardActive : ""}`}
                  onClick={() => setActive(isActive ? null : inst.name)}
                  style={isActive ? { borderColor: color } : {}}
                >
                  {/* Avatar */}
                  <div className={s.cardAvatar} style={{ background: color }}>
                    {inst.avatar || inst.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className={s.cardInfo}>
                    <h3 className={s.cardName}>{inst.name}</h3>
                    <div className={s.cardMeta}>
                      <span><StarFilled style={{ color: "#fbbf24", fontSize: 12 }} /> {inst.avgRating}</span>
                      <span><BookOutlined style={{ fontSize: 11 }} /> {inst.courseCount} course{inst.courseCount !== 1 ? "s" : ""}</span>
                      <span><TeamOutlined style={{ fontSize: 11 }} /> {inst.students?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className={s.cardCategories}>
                    {[...new Set(inst.courses.map(c => c.category).filter(Boolean))].slice(0, 2).map(cat => (
                      <span key={cat} className={s.catPill}>{cat}</span>
                    ))}
                  </div>

                  <ArrowRightOutlined
                    className={s.cardArrow}
                    style={{ transform: isActive ? "rotate(90deg)" : "none", color: isActive ? color : undefined }}
                  />
                </div>
              );
            })}
          </div>

          {/* Instructor's courses */}
          {activeInst && (
            <div className={s.instSection}>
              <div className={s.instSectionHead}>
                <div className={s.instAvatar} style={{ background: getColor(activeInst.name) }}>
                  {activeInst.avatar || activeInst.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className={s.instName}>{activeInst.name}</h2>
                  <div className={s.instStats}>
                    <span><StarFilled style={{ color: "#fbbf24" }} /> {activeInst.avgRating} avg rating</span>
                    <span>·</span>
                    <span><TeamOutlined /> {activeInst.students?.toLocaleString()} students</span>
                    <span>·</span>
                    <span><BookOutlined /> {activeInst.courseCount} courses</span>
                  </div>
                </div>
              </div>

              <div className={s.instCourses}>
                {activeInst.courses.map(c => (
                  <div
                    key={c.id}
                    className={s.instCourseRow}
                    onClick={() => navigate(`/courses/${toSlug(c.title)}`)}
                  >
                    <img src={c.thumb} alt={c.title} className={s.instCourseThumb} />
                    <div className={s.instCourseInfo}>
                      <span className={s.instCourseCat}>{c.category} · {c.level}</span>
                      <h4 className={s.instCourseTitle}>{c.title}</h4>
                      <div className={s.instCourseMeta}>
                        <span><StarFilled style={{ color: "#fbbf24", fontSize: 11 }} /> {c.rating}</span>
                        <span><TeamOutlined style={{ fontSize: 11 }} /> {c.students?.toLocaleString()}</span>
                        <span><BookOutlined style={{ fontSize: 11 }} /> {c.duration}</span>
                      </div>
                    </div>
                    <div className={s.instCourseRight}>
                      <span className={s.instCoursePrice}>{c.isFree ? "Free" : c.price}</span>
                      <ArrowRightOutlined style={{ color: "var(--text-muted)", fontSize: 13 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InstructorsView;