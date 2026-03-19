// src/pages/CoursesView/Courses.jsx

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Input, Select, Avatar, Empty } from "antd";
import {
  SearchOutlined, StarFilled, ClockCircleOutlined,
  AppstoreOutlined, UnorderedListOutlined, ThunderboltFilled,
} from "@ant-design/icons";
import Header from "@/widgets/Header";
import Footer from "@/widgets/Footer";
import s from "./Courses.module.css";
import { toSlug } from "./courseUtils";

const { Option } = Select;

const GET_ALL_COURSES = gql`
  query {
    allCourses {
      id title instructor avatar
      rating students duration level
      tag tagColor thumb price isFree coinPrice category subtitle
    }
  }
`;

const SORT_OPTIONS = [
  { value: "popular",    label: "Most Popular"       },
  { value: "rating",     label: "Highest Rated"      },
  { value: "newest",     label: "Newest"             },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced"];

const SkeletonGrid = () => (
  <div className={s.grid}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className={s.skCard}>
        <div className={s.skThumb} />
        <div className={s.skBody}>
          <div className={s.skLine} style={{ width: "40%" }} />
          <div className={s.skLine} style={{ width: "85%", height: 15 }} />
          <div className={s.skLine} style={{ width: "60%" }} />
          <div className={s.skFooter}>
            <div className={s.skLine} style={{ width: 50, height: 20 }} />
            <div className={s.skLine} style={{ width: 70, height: 28, borderRadius: 7 }} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ✅ Форматирует цену в EduCoins
const PriceTag = ({ course, className }) => {
  if (course.isFree || course.coinPrice === 0) {
    return <span className={className} style={{ color: "var(--green)" }}>Free</span>;
  }
  return (
    <span className={className} style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <ThunderboltFilled style={{ color: "#6c63ff", fontSize: "0.85em" }} />
      {course.coinPrice} 🪙
    </span>
  );
};

const Courses = () => {
  const navigate = useNavigate();
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [level,    setLevel]    = useState("All");
  const [sort,     setSort]     = useState("popular");
  const [freeOnly, setFreeOnly] = useState(false);
  const [view,     setView]     = useState("grid");

  const { data, loading, error } = useQuery(GET_ALL_COURSES, {
    fetchPolicy: "cache-and-network",
  });

  const allCourses = data?.allCourses ?? [];

  const categories = useMemo(() => {
    const cats = [...new Set(allCourses.map(c => c.category).filter(Boolean))].sort();
    return ["All", ...cats];
  }, [allCourses]);

  const levels = useMemo(() => {
    const present = new Set(allCourses.map(c => c.level).filter(Boolean));
    return ["All", ...LEVEL_ORDER.filter(l => present.has(l))];
  }, [allCourses]);

  const filtered = useMemo(() => {
    let list = [...allCourses];
    if (search)             list = list.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== "All") list = list.filter(c => c.category === category);
    if (level    !== "All") list = list.filter(c => c.level    === level);
    if (freeOnly)           list = list.filter(c => c.isFree || c.coinPrice === 0);

    switch (sort) {
      case "rating":     list.sort((a, b) => b.rating    - a.rating);    break;
      case "newest":     list.sort((a, b) => b.id        - a.id);        break;
      case "price_asc":  list.sort((a, b) => (a.coinPrice || 0) - (b.coinPrice || 0)); break;
      case "price_desc": list.sort((a, b) => (b.coinPrice || 0) - (a.coinPrice || 0)); break;
      case "popular":
      default:           list.sort((a, b) => b.students  - a.students);  break;
    }
    return list;
  }, [allCourses, search, category, level, sort, freeOnly]);

  const goToCourse = (course) => navigate(`/courses/${toSlug(course.title)}`);

  return (
    <div className={s.root}>
      <Header />
      <main className={s.main}>
        <div className={s.pageHeader}>
          <div className={s.pageHeaderBg} />
          <div className={s.pageHeaderContent}>
            <p className={s.pageTag}>Explore</p>
            <h1 className={s.pageTitle}>All Courses</h1>
            <p className={s.pageSubtitle}>
              {loading
                ? "Loading courses…"
                : `${allCourses.length} courses from world-class instructors`}
            </p>
          </div>
        </div>

        <div className={s.layout}>
          <aside className={s.sidebar}>
            <div className={s.filterBlock}>
              <p className={s.filterTitle}>Category</p>
              <div className={s.filterList}>
                {categories.map(cat => (
                  <button key={cat}
                    className={`${s.filterItem} ${category === cat ? s.filterItemActive : ""}`}
                    onClick={() => setCategory(cat)}>
                    {cat}
                    <span className={s.filterCount}>
                      {cat === "All" ? allCourses.length : allCourses.filter(c => c.category === cat).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className={s.filterBlock}>
              <p className={s.filterTitle}>Level</p>
              <div className={s.filterList}>
                {levels.map(lv => (
                  <button key={lv}
                    className={`${s.filterItem} ${level === lv ? s.filterItemActive : ""}`}
                    onClick={() => setLevel(lv)}>
                    {lv}
                    <span className={s.filterCount}>
                      {lv === "All" ? allCourses.length : allCourses.filter(c => c.level === lv).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className={s.filterBlock}>
              <p className={s.filterTitle}>Price</p>
              <button
                className={`${s.filterItem} ${freeOnly ? s.filterItemActive : ""}`}
                onClick={() => setFreeOnly(v => !v)}>
                Free only
                <span className={s.filterCount}>
                  {allCourses.filter(c => c.isFree || c.coinPrice === 0).length}
                </span>
              </button>
            </div>
          </aside>

          <div className={s.content}>
            <div className={s.toolbar}>
              <div className={s.searchWrap}>
                <SearchOutlined className={s.searchIcon} />
                <Input placeholder="Search courses…" value={search}
                  onChange={e => setSearch(e.target.value)} className={s.searchInput} />
              </div>
              <div className={s.toolbarRight}>
                <span className={s.resultCount}>{filtered.length} results</span>
                <Select value={sort} onChange={setSort} className={s.sortSelect}>
                  {SORT_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                </Select>
                <div className={s.viewToggle}>
                  <button className={`${s.viewBtn} ${view === "grid" ? s.viewBtnActive : ""}`}
                    onClick={() => setView("grid")}><AppstoreOutlined /></button>
                  <button className={`${s.viewBtn} ${view === "list" ? s.viewBtnActive : ""}`}
                    onClick={() => setView("list")}><UnorderedListOutlined /></button>
                </div>
              </div>
            </div>

            {error && (
              <div className={s.empty}>
                <p style={{ color: "#f87171" }}>⚠️ {error.message}</p>
              </div>
            )}
            {loading && <SkeletonGrid />}
            {!loading && !error && filtered.length === 0 && (
              <div className={s.empty}>
                <Empty description={<span style={{ color: "var(--muted)" }}>No courses found</span>} />
              </div>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className={view === "grid" ? s.grid : s.list}>
                {filtered.map(course =>
                  view === "grid"
                    ? <GridCard key={course.id} course={course} onClick={() => goToCourse(course)} />
                    : <ListCard key={course.id} course={course} onClick={() => goToCourse(course)} />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const GridCard = ({ course: c, onClick }) => (
  <div className={s.gridCard} onClick={onClick} role="button" tabIndex={0}
    onKeyDown={e => e.key === "Enter" && onClick()}>
    <div className={s.cardThumbWrap}>
      <img className={s.cardThumb} src={c.thumb} alt={c.title} loading="lazy" />
      {c.tag && <span className={s.cardTag} style={{ background: c.tagColor }}>{c.tag}</span>}
    </div>
    <div className={s.cardBody}>
      <p className={s.cardCategory}>{c.category}</p>
      <h3 className={s.cardTitle}>{c.title}</h3>
      <div className={s.cardMeta}>
        <Avatar size={20} style={{ background: "var(--accent)", fontSize: 9, flexShrink: 0 }}>
          {c.avatar}
        </Avatar>
        <span className={s.cardInstructor}>{c.instructor}</span>
        <span className={s.cardLevel}>{c.level}</span>
      </div>
      <div className={s.cardStats}>
        <span className={s.cardStat}><StarFilled style={{ color: "#fbbf24" }} /> {c.rating}</span>
        <span className={s.cardStat}><ClockCircleOutlined /> {c.duration}</span>
      </div>
      <div className={s.cardFooter}>
        <PriceTag course={c} className={s.cardPrice} />
        <button className={s.cardBtn} onClick={e => { e.stopPropagation(); onClick(); }}>
          Enroll
        </button>
      </div>
    </div>
  </div>
);

const ListCard = ({ course: c, onClick }) => (
  <div className={s.listCard} onClick={onClick} role="button" tabIndex={0}
    onKeyDown={e => e.key === "Enter" && onClick()}>
    <div className={s.listThumbWrap}>
      <img className={s.listThumb} src={c.thumb} alt={c.title} loading="lazy" />
      {c.tag && <span className={s.cardTag} style={{ background: c.tagColor }}>{c.tag}</span>}
    </div>
    <div className={s.listBody}>
      <p className={s.cardCategory}>{c.category} · {c.level}</p>
      <h3 className={s.listTitle}>{c.title}</h3>
      <div className={s.cardMeta}>
        <Avatar size={20} style={{ background: "var(--accent)", fontSize: 9 }}>{c.avatar}</Avatar>
        <span className={s.cardInstructor}>{c.instructor}</span>
        <span className={s.cardStat}><StarFilled style={{ color: "#fbbf24" }} /> {c.rating}</span>
        <span className={s.cardStat}><ClockCircleOutlined /> {c.duration}</span>
      </div>
    </div>
    <div className={s.listRight}>
      <PriceTag course={c} className={s.cardPrice} />
      <button className={s.cardBtn} onClick={e => { e.stopPropagation(); onClick(); }}>Enroll</button>
    </div>
  </div>
);

export default Courses;