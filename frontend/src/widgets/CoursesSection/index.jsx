import { useState, useCallback } from "react";
import { useQuery, gql } from "@apollo/client";
import { Avatar } from "antd";
import { StarFilled, ClockCircleOutlined, TeamOutlined, ArrowRightOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import s from "./CoursesSection.module.css";

const GET_FEATURED_COURSES = gql`
  query {
    featuredCourses {
      id
      title
      instructor
      avatar
      rating
      students
      duration
      level
      tag
      tagColor
      thumb
      price
    }
  }
`;

const PAGE_SIZE = 6;

// ── Skeleton card ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className={s.card}>
    <div className={`${s.thumbWrap} ${s.skeletonThumb}`} />
    <div className={s.body}>
      <div className={`${s.skeletonLine} ${s.skeletonTitle}`} />
      <div className={`${s.skeletonLine} ${s.skeletonMeta}`} />
      <div className={`${s.skeletonLine} ${s.skeletonInfo}`} />
      <div className={s.skeletonFooter}>
        <div className={`${s.skeletonLine} ${s.skeletonPrice}`} />
        <div className={`${s.skeletonLine} ${s.skeletonBtn}`} />
      </div>
    </div>
  </div>
);

// ── Single course card ─────────────────────────────────────────────────────
const CourseCard = ({ course, index }) => (
  <div
    className={s.card}
    style={{ "--delay": `${index * 60}ms` }}
  >
    <div className={s.thumbWrap}>
      <img
        className={s.thumb}
        src={course.thumb}
        alt={course.title}
        loading="lazy"
      />
      <div className={s.thumbOverlay} />
      {course.tag && (
        <span className={s.courseTag} style={{ "--tag-color": course.tagColor }}>
          {course.tag}
        </span>
      )}
      <span className={`${s.levelBadge} ${s[`level_${course.level?.toLowerCase()}`]}`}>
        {course.level}
      </span>
    </div>

    <div className={s.body}>
      <h3 className={s.courseTitle}>{course.title}</h3>

      <div className={s.meta}>
        <Avatar
          size={26}
          className={s.avatar}
          style={{ flexShrink: 0 }}
        >
          {course.avatar}
        </Avatar>
        <span className={s.instructor}>{course.instructor}</span>
      </div>

      <div className={s.stats}>
        <div className={s.statItem}>
          <StarFilled className={s.starIcon} />
          <span className={s.ratingVal}>{course.rating?.toFixed(1)}</span>
        </div>
        <span className={s.statDot} />
        <div className={s.statItem}>
          <TeamOutlined className={s.statIcon} />
          <span>{(course.students ?? 0).toLocaleString()}</span>
        </div>
        <span className={s.statDot} />
        <div className={s.statItem}>
          <ClockCircleOutlined className={s.statIcon} />
          <span>{course.duration}</span>
        </div>
      </div>

      <div className={s.footer}>
        <span className={s.price}>{course.price}</span>
        <button className={s.enrollBtn}>
          Enroll Now
          <ArrowRightOutlined className={s.enrollArrow} />
        </button>
      </div>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const CoursesSection = () => {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useQuery(GET_FEATURED_COURSES, {
    fetchPolicy: "cache-and-network",
  });

  const courses = data?.featuredCourses ?? [];
  const totalPages = Math.ceil(courses.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const visible = courses.slice(start, start + PAGE_SIZE);

  const goTo = useCallback((p) => {
    setPage(p);
    // плавный скролл к секции при смене страницы
    document.getElementById("courses-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  // ── Render states ────────────────────────────────────────────────────────
  const renderContent = () => {
    if (error) {
      return (
        <div className={s.errorBox}>
          <span className={s.errorIcon}>⚠️</span>
          <p>Не удалось загрузить курсы</p>
          <span className={s.errorDetail}>{error.message}</span>
        </div>
      );
    }

    if (loading) {
      return (
        <div className={s.grid}>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (courses.length === 0) {
      return (
        <div className={s.emptyBox}>
          <span className={s.emptyIcon}>📚</span>
          <p>Курсы появятся совсем скоро</p>
        </div>
      );
    }

    return (
      <>
        <div className={s.grid}>
          {visible.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className={s.pagination}>
            {/* Prev */}
            <button
              className={`${s.pageBtn} ${s.pageBtnArrow}`}
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              aria-label="Предыдущая страница"
            >
              <ArrowLeftOutlined />
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              // показываем первую, последнюю и ±1 от текущей
              const show =
                p === 1 ||
                p === totalPages ||
                Math.abs(p - page) <= 1;

              // многоточие
              if (!show) {
                const prevShown =
                  p - 1 === 1 ||
                  p - 1 === totalPages ||
                  Math.abs(p - 1 - page) <= 1;
                if (!prevShown) return null;
                return (
                  <span key={`dots-${p}`} className={s.pageDots}>
                    …
                  </span>
                );
              }

              return (
                <button
                  key={p}
                  className={`${s.pageBtn} ${p === page ? s.pageBtnActive : ""}`}
                  onClick={() => goTo(p)}
                  aria-label={`Страница ${p}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              );
            })}

            {/* Next */}
            <button
              className={`${s.pageBtn} ${s.pageBtnArrow}`}
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              aria-label="Следующая страница"
            >
              <ArrowRightOutlined />
            </button>
          </div>
        )}

        {/* Counter */}
        <p className={s.counter}>
          Показано {start + 1}–{Math.min(start + PAGE_SIZE, courses.length)} из{" "}
          {courses.length} курсов
        </p>
      </>
    );
  };

  return (
    <section className={s.section} id="courses-section">
      <div className={s.header}>
        <div>
          <p className={s.eyebrow}>Hand-picked</p>
          <h2 className={s.title}>Featured Courses</h2>
        </div>

        {!loading && courses.length > 0 && (
          <span className={s.totalCount}>{courses.length} курсов</span>
        )}
      </div>

      {renderContent()}
    </section>
  );
};

export default CoursesSection;