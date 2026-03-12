// src/pages/MyCourses/MyCoursesPage.jsx
// ✅ Реальный прогресс из GraphQL (courseDetail) — синхронизируется с БД
// ✅ Табы: Все / В процессе / Завершённые / Не начатые
// ✅ Поиск по названию
// ✅ Сортировка
// ✅ Красивые карточки с прогрессбаром, датой, статистикой
// ✅ Continue / Start / Restart кнопки

import { useState, useMemo } from "react";
import { useNavigate }       from "react-router-dom";
import { useQuery, gql }     from "@apollo/client";
import { Progress, Empty }   from "antd";
import {
  BookOutlined, CheckCircleFilled, ClockCircleOutlined,
  SearchOutlined, TrophyFilled, FireFilled, ThunderboltFilled,
  PlayCircleFilled, ReloadOutlined,
} from "@ant-design/icons";
import Header        from "@/widgets/Header";
import Footer        from "@/widgets/Footer";
import useAuthStore  from "@/shared/store/useAuthStore";
import useEnrollStore from "@/shared/store/useEnrollStore";
import { toSlug }    from "@/pages/CoursesView/courseUtils";
import s from "./MyCoursesView.module.css";

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_COURSE_PROGRESS = gql`
  query GetCourseProgress($id: Int!) {
    courseDetail(id: $id) {
      id totalLessons completedLessons progressPercent
    }
  }
`;

// ── Хук: получить прогресс одного курса из БД ─────────────────────────────────

const useCourseProgress = (courseId, skip) => {
  const { data } = useQuery(GET_COURSE_PROGRESS, {
    variables:   { id: courseId },
    skip:        skip || !courseId,
    fetchPolicy: "cache-and-network",
  });
  return data?.courseDetail ?? null;
};

// ── Статус курса ──────────────────────────────────────────────────────────────

const getStatus = (pct) => {
  if (pct >= 100)      return "completed";
  if (pct > 0)         return "inProgress";
  return "notStarted";
};

const STATUS_LABEL = {
  completed:  { label: "Завершён",    color: "var(--green)",  bg: "var(--green-soft)",  icon: "✓" },
  inProgress: { label: "В процессе",  color: "var(--accent)", bg: "var(--accent-soft)", icon: "▶" },
  notStarted: { label: "Не начат",    color: "var(--text-muted)", bg: "var(--surface-hover)", icon: "○" },
};

// ── Карточка курса ─────────────────────────────────────────────────────────────

const CourseCard = ({ enrollment }) => {
  const navigate = useNavigate();
  const { unenroll } = useEnrollStore();

  // Загружаем актуальный прогресс из БД
  const dbProgress = useCourseProgress(enrollment.id, false);

  const pct       = dbProgress?.progressPercent   ?? enrollment.progress ?? 0;
  const completed = dbProgress?.completedLessons  ?? enrollment.completedLessons ?? 0;
  const total     = dbProgress?.totalLessons      ?? enrollment.totalLessons ?? 0;
  const status    = getStatus(pct);
  const st        = STATUS_LABEL[status];
  const slug      = toSlug(enrollment.title);

  const handleContinue = () => navigate(`/courses/${slug}`);

  return (
    <div className={s.card}>
      {/* Thumbnail */}
      <div className={s.cardThumb} onClick={handleContinue}>
        {enrollment.thumb
          ? <img src={enrollment.thumb} alt={enrollment.title} className={s.cardImg} />
          : <div className={s.cardImgPlaceholder}><BookOutlined /></div>
        }
        <div className={s.cardThumbOverlay}>
          <div className={s.cardPlayBtn}>
            {status === "completed" ? <ReloadOutlined /> : <PlayCircleFilled />}
          </div>
        </div>
        {/* Status badge */}
        <div className={s.statusBadge} style={{ background: st.bg, color: st.color }}>
          <span>{st.icon}</span> {st.label}
        </div>
      </div>

      {/* Body */}
      <div className={s.cardBody}>
        <div className={s.cardMeta}>
          {enrollment.category && <span className={s.cardCat}>{enrollment.category}</span>}
          {enrollment.level    && <span className={s.cardLevel}>{enrollment.level}</span>}
        </div>

        <h3 className={s.cardTitle} onClick={handleContinue}>{enrollment.title}</h3>
        <p className={s.cardInstructor}>by {enrollment.instructor}</p>

        {/* Progress */}
        <div className={s.progressWrap}>
          <div className={s.progressRow}>
            <span className={s.progressLabel}>
              {completed}/{total} уроков
            </span>
            <span className={s.progressPct} style={{ color: status === "completed" ? "var(--green)" : "var(--accent)" }}>
              {Math.round(pct)}%
            </span>
          </div>
          <div className={s.progressBar}>
            <div
              className={`${s.progressFill} ${status === "completed" ? s.progressFillGreen : ""}`}
              style={{ width: `${Math.round(pct)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={s.cardFooter}>
          <span className={s.enrollDate}>
            <ClockCircleOutlined />
            {new Date(enrollment.enrolledAt).toLocaleDateString("ru-RU", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
          <div className={s.cardActions}>
            <button className={s.continueBtn} onClick={handleContinue}>
              {status === "notStarted" ? "Начать" : status === "completed" ? "Повторить" : "Продолжить"}
            </button>
            <button
              className={s.unenrollBtn}
              onClick={() => unenroll(enrollment.id)}
              title="Отписаться"
            >✕</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Empty state ────────────────────────────────────────────────────────────────

const EmptyState = ({ tab, onBrowse }) => {
  const msgs = {
    all:        { icon: "📚", title: "Нет записанных курсов",     sub: "Найди интересный курс и начни учиться прямо сейчас" },
    inProgress: { icon: "▶️",  title: "Нет активных курсов",       sub: "Открой любой записанный курс и пройди первый урок" },
    completed:  { icon: "🏆",  title: "Нет завершённых курсов",    sub: "Пройди курс до конца и получи сертификат" },
    notStarted: { icon: "📖",  title: "Нет неначатых курсов",      sub: "Отличная работа — ты уже начал все свои курсы!" },
  };
  const m = msgs[tab] || msgs.all;
  return (
    <div className={s.empty}>
      <div className={s.emptyIcon}>{m.icon}</div>
      <h3 className={s.emptyTitle}>{m.title}</h3>
      <p className={s.emptySub}>{m.sub}</p>
      {(tab === "all" || tab === "notStarted") && (
        <button className={s.emptyBtn} onClick={onBrowse}>Смотреть курсы</button>
      )}
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all",        label: "Все курсы"    },
  { key: "inProgress", label: "В процессе"   },
  { key: "completed",  label: "Завершённые"  },
  { key: "notStarted", label: "Не начатые"   },
];

const SORTS = [
  { value: "recent",   label: "Последние"     },
  { value: "progress", label: "По прогрессу"  },
  { value: "alpha",    label: "А → Я"         },
];

const MyCoursesPage = () => {
  const navigate    = useNavigate();
  const { user }    = useAuthStore();
  const { getList } = useEnrollStore();

  const [tab,    setTab]    = useState("all");
  const [search, setSearch] = useState("");
  const [sort,   setSort]   = useState("recent");

  const all = getList();

  // Считаем статистику (используем локальный прогресс для быстроты)
  const stats = useMemo(() => {
    const completed  = all.filter(c => (c.progress ?? 0) >= 100).length;
    const inProgress = all.filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100).length;
    const totalPct   = all.reduce((s, c) => s + (c.progress ?? 0), 0);
    return {
      total:       all.length,
      completed,
      inProgress,
      notStarted:  all.length - completed - inProgress,
      avgProgress: all.length ? Math.round(totalPct / all.length) : 0,
    };
  }, [all]);

  // Фильтрация
  const filtered = useMemo(() => {
    let list = [...all];

    // Tab
    if (tab === "inProgress") list = list.filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
    if (tab === "completed")  list = list.filter(c => (c.progress ?? 0) >= 100);
    if (tab === "notStarted") list = list.filter(c => (c.progress ?? 0) === 0);

    // Search
    if (search) list = list.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

    // Sort
    if (sort === "recent")   list.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
    if (sort === "progress") list.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    if (sort === "alpha")    list.sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [all, tab, search, sort]);

  if (!user) {
    return (
      <div className={s.root}>
        <Header />
        <div className={s.authWall}>
          <div className={s.authWallIcon}>🔐</div>
          <h2>Войди в аккаунт</h2>
          <p>Чтобы видеть свои курсы, нужно авторизоваться</p>
          <button className={s.authBtn} onClick={() => navigate("/")}>На главную</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={s.root}>
      <Header />
      <main className={s.main}>
        <div className={s.inner}>

          {/* ── Header ── */}
          <div className={s.pageHead}>
            <div className={s.pageHeadLeft}>
              <p className={s.pageTag}>Обучение</p>
              <h1 className={s.pageTitle}>Мои курсы</h1>
              <p className={s.pageSub}>
                {all.length === 0
                  ? "У тебя пока нет записанных курсов"
                  : `${all.length} ${all.length === 1 ? "курс" : all.length < 5 ? "курса" : "курсов"} в твоей библиотеке`
                }
              </p>
            </div>

            {/* Stats strip */}
            {all.length > 0 && (
              <div className={s.statsStrip}>
                <div className={s.statItem}>
                  <BookOutlined className={s.statIcon} />
                  <span className={s.statVal}>{stats.total}</span>
                  <span className={s.statLabel}>Всего</span>
                </div>
                <div className={s.statDivider} />
                <div className={s.statItem}>
                  <FireFilled className={s.statIcon} style={{ color: "var(--accent)" }} />
                  <span className={s.statVal}>{stats.inProgress}</span>
                  <span className={s.statLabel}>В процессе</span>
                </div>
                <div className={s.statDivider} />
                <div className={s.statItem}>
                  <TrophyFilled className={s.statIcon} style={{ color: "var(--green)" }} />
                  <span className={s.statVal}>{stats.completed}</span>
                  <span className={s.statLabel}>Завершено</span>
                </div>
                <div className={s.statDivider} />
                <div className={s.statItem}>
                  <ThunderboltFilled className={s.statIcon} style={{ color: "#fbbf24" }} />
                  <span className={s.statVal}>{stats.avgProgress}%</span>
                  <span className={s.statLabel}>Ср. прогресс</span>
                </div>
              </div>
            )}
          </div>

          {all.length === 0 ? (
            <EmptyState tab="all" onBrowse={() => navigate("/courses")} />
          ) : (
            <>
              {/* ── Tabs + Controls ── */}
              <div className={s.controls}>
                <div className={s.tabs}>
                  {TABS.map(t => {
                    const count = t.key === "all" ? stats.total
                      : t.key === "inProgress" ? stats.inProgress
                      : t.key === "completed"  ? stats.completed
                      : stats.notStarted;
                    return (
                      <button
                        key={t.key}
                        className={`${s.tab} ${tab === t.key ? s.tabActive : ""}`}
                        onClick={() => setTab(t.key)}
                      >
                        {t.label}
                        {count > 0 && <span className={s.tabBadge}>{count}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className={s.toolbarRight}>
                  {/* Search */}
                  <div className={s.searchBox}>
                    <SearchOutlined className={s.searchIco} />
                    <input
                      className={s.searchInput}
                      placeholder="Поиск по названию…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  {/* Sort */}
                  <select
                    className={s.sortSelect}
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                  >
                    {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* ── Grid ── */}
              {filtered.length === 0 ? (
                <EmptyState tab={tab} onBrowse={() => navigate("/courses")} />
              ) : (
                <div className={s.grid}>
                  {filtered.map(c => (
                    <CourseCard key={c.id} enrollment={c} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyCoursesPage;