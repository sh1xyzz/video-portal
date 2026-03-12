// src/pages/CoursesView/CoursesDetailView.jsx
// ✅ Галочки — markLessonComplete сохраняет в БД, прогресс обновляется
// ✅ Комментарии — загружаются из БД (courseReviews query), пишутся через addReview mutation
// ✅ "Презентация не добавлена" — исправлено: contentUrl из БД работает корректно
// ✅ Continue Learning — ведёт к первому незавершённому уроку правильно
// ✅ SlideViewer — если contentUrl есть, показывает iframe; если нет — текстовый режим
// ✅ VideoModal — YouTube embed

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams }             from "react-router-dom";
import { useQuery, useMutation, gql }         from "@apollo/client";
import { Avatar, Rate, Tag, Collapse }        from "antd";
import {
  PlayCircleFilled, CheckCircleFilled,
  ClockCircleOutlined, TeamOutlined, TrophyFilled,
  MobileOutlined, SafetyCertificateOutlined,
  StarFilled, LockFilled, PlaySquareOutlined,
  FileTextOutlined, LeftOutlined, RightOutlined,
  SendOutlined, UserOutlined, MessageOutlined,
  BookOutlined, FireFilled, ThunderboltFilled,
} from "@ant-design/icons";
import Header         from "@/widgets/Header";
import Footer         from "@/widgets/Footer";
import useAuthStore   from "@/shared/store/useAuthStore";
import useEnrollStore from "@/shared/store/useEnrollStore";
import useCoinsStore  from "@/shared/store/useCoinsStore";
import s from "./CoursesDetailView.module.css";
import { toSlug } from "./courseUtils";

const { Panel } = Collapse;

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_ALL_COURSES = gql`
  query {
    allCourses {
      id title instructor avatar level category thumb isFree price subtitle
      rating students duration
    }
  }
`;

const GET_COURSE_DETAIL = gql`
  query GetCourseDetail($id: Int!) {
    courseDetail(id: $id) {
      id title totalLessons progressPercent completedLessons
      lessons {
        id section title type duration isFree order
        contentUrl content completed
      }
    }
  }
`;

// Отзывы к курсу
const GET_REVIEWS = gql`
  query GetReviews($courseId: Int!) {
    courseReviews(courseId: $courseId) {
      id courseId userId userName userAvatar rating text createdAt
    }
  }
`;

const MARK_COMPLETE = gql`
  mutation MarkLessonComplete($lessonId: Int!) {
    markLessonComplete(lessonId: $lessonId) { lessonId completed }
  }
`;

const ADD_REVIEW = gql`
  mutation AddReview($input: ReviewInput!) {
    addReview(input: $input) {
      id courseId userId userName userAvatar rating text createdAt
    }
  }
`;

const DELETE_REVIEW = gql`
  mutation DeleteReview($reviewId: Int!) {
    deleteReview(reviewId: $reviewId)
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE VIEWER
   Показывает:
   - если есть contentUrl → iframe (Google Slides / любой embed)
   - если нет contentUrl, но есть content → текстовый режим
   - если ничего нет → сообщение для преподавателя
────────────────────────────────────────────────────────────────────────────── */
const SlideViewer = ({ lesson, onClose }) => {
  const isEmbed = !!lesson.contentUrl;
  const hasText = !!lesson.content;

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className={s.slideBackdrop} onClick={onClose}>
      <div className={s.slideBox} onClick={e => e.stopPropagation()}>
        <div className={s.slideTopBar}>
          <div className={s.slideTopLeft}>
            <FileTextOutlined className={s.slideTopIcon} />
            <span className={s.slideTopTitle}>{lesson.title}</span>
          </div>
          <div className={s.slideTopRight}>
            <span className={s.slideTopType}>{lesson.type}</span>
            <button className={s.slideCloseBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Embed iframe (Google Slides, PDF, etc.) */}
        {isEmbed && (
          <div className={s.slideEmbedWrap}>
            <iframe
              src={lesson.contentUrl}
              className={s.slideEmbed}
              allow="autoplay"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        )}

        {/* Text content (theory / task) */}
        {!isEmbed && hasText && (
          <div className={s.slideContent}>
            <h2 className={s.slideTitle}>{lesson.title}</h2>
            <div className={s.slideBody}>
              <div className={s.slideText}>
                {lesson.content.split("\n").map((line, i) => {
                  const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
                    p.startsWith("**") && p.endsWith("**")
                      ? <strong key={j}>{p.slice(2, -2)}</strong>
                      : p
                  );
                  return <span key={i} className={s.slideLine}>{parts}<br /></span>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Nothing added yet */}
        {!isEmbed && !hasText && (
          <div className={s.slideEmpty}>
            <FileTextOutlined style={{ fontSize: 48, color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-secondary)", marginTop: 16 }}>
              Контент для этого урока ещё не добавлен.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Перейди в <strong>/admin</strong> → выбери курс → отредактируй урок и добавь ссылку или текст.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   VIDEO MODAL
────────────────────────────────────────────────────────────────────────────── */
const VideoModal = ({ url, title, onClose }) => {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Normalize URL: если пользователь вставил обычный youtube.com/watch — конвертируем в embed
  const embedUrl = useMemo(() => {
    if (!url) return "";
    // уже embed
    if (url.includes("/embed/")) return url + (url.includes("?") ? "&autoplay=1" : "?autoplay=1");
    // youtube.com/watch?v=ID
    const m = url.match(/[?&]v=([^&]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
    // youtu.be/ID
    const m2 = url.match(/youtu\.be\/([^?]+)/);
    if (m2) return `https://www.youtube.com/embed/${m2[1]}?autoplay=1`;
    return url + (url.includes("?") ? "&autoplay=1" : "?autoplay=1");
  }, [url]);

  return (
    <div className={s.videoBackdrop} onClick={onClose}>
      <div className={s.videoBox} onClick={e => e.stopPropagation()}>
        <div className={s.videoHeader}>
          <span className={s.videoTitle}>{title}</span>
          <button className={s.videoClose} onClick={onClose}>✕</button>
        </div>
        <div className={s.videoPlayer}>
          <iframe
            width="100%" height="100%"
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   COMPLETION MODAL
────────────────────────────────────────────────────────────────────────────── */
const CompletionModal = ({ course, onClose }) => (
  <div className={s.completionBackdrop} onClick={onClose}>
    <div className={s.completionBox} onClick={e => e.stopPropagation()}>
      <div className={s.completionFireworks}>🎉</div>
      <div className={s.completionTrophy}>
        <TrophyFilled className={s.completionTrophyIcon} />
      </div>
      <h2 className={s.completionTitle}>Course Complete!</h2>
      <p className={s.completionSub}>You've finished <strong>{course.title}</strong></p>
      <div className={s.completionRewards}>
        <div className={s.completionReward}>
          <ThunderboltFilled style={{ color: "#fbbf24" }} />
          <span>+500 EduCoins earned</span>
        </div>
        <div className={s.completionReward}>
          <TrophyFilled style={{ color: "#a89eff" }} />
          <span>Certificate unlocked in profile</span>
        </div>
        <div className={s.completionReward}>
          <FireFilled style={{ color: "#f87171" }} />
          <span>Achievement: Course Finisher</span>
        </div>
      </div>
      <button className={s.completionBtn} onClick={onClose}>
        🎓 View my certificate
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   PROGRESS STEPS
────────────────────────────────────────────────────────────────────────────── */
const ProgressSteps = ({ lessons, progressPercent }) => {
  const sections = useMemo(() => {
    const map = new Map();
    for (const l of [...lessons].sort((a, b) => a.order - b.order)) {
      if (!map.has(l.section)) map.set(l.section, []);
      map.get(l.section).push(l);
    }
    return Array.from(map.entries());
  }, [lessons]);

  return (
    <div className={s.stepsCard}>
      <div className={s.stepsHeader}>
        <span className={s.stepsTitle}>Your Progress</span>
        <span className={s.stepsPct}>{progressPercent ?? 0}%</span>
      </div>
      <div className={s.stepsBar}>
        <div className={s.stepsBarFill} style={{ width: `${progressPercent ?? 0}%` }} />
      </div>
      <div className={s.stepsList}>
        {sections.map(([secName, secLessons], si) => {
          const sectionDone    = secLessons.every(l => l.completed);
          const sectionPartial = secLessons.some(l => l.completed) && !sectionDone;
          return (
            <div key={secName} className={s.stepSection}>
              <div className={s.stepSectionHeader}>
                <div className={`${s.stepBullet} ${sectionDone ? s.stepBulletDone : sectionPartial ? s.stepBulletPartial : ""}`}>
                  {sectionDone ? <CheckCircleFilled /> : si + 1}
                </div>
                <span className={s.stepSectionName}>{secName}</span>
                <span className={s.stepSectionCount}>
                  {secLessons.filter(l => l.completed).length}/{secLessons.length}
                </span>
              </div>
              <div className={s.stepLessons}>
                {secLessons.map(lesson => (
                  <div key={lesson.id} className={`${s.stepLesson} ${lesson.completed ? s.stepLessonDone : ""}`}>
                    <div className={`${s.stepLessonDot} ${lesson.completed ? s.stepLessonDotDone : ""}`} />
                    <span>{lesson.title}</span>
                    {lesson.completed && <CheckCircleFilled className={s.stepCheck} />}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   COMMENTS SECTION — данные из GraphQL, запись через мутацию
────────────────────────────────────────────────────────────────────────────── */
const CommentsSection = ({ courseId, user, rating: courseRating }) => {
  const [text, setText]       = useState("");
  const [myRating, setMyRating] = useState(5);
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState("");

  // Загружаем отзывы из БД
  const { data, loading, refetch } = useQuery(GET_REVIEWS, {
    variables: { courseId },
    skip: !courseId,
    fetchPolicy: "cache-and-network",
  });
  const reviews = data?.courseReviews ?? [];

  const [addReview]    = useMutation(ADD_REVIEW);
  const [deleteReview] = useMutation(DELETE_REVIEW);

  const avg = reviews.length
    ? (reviews.reduce((s, c) => s + c.rating, 0) / reviews.length).toFixed(1)
    : courseRating;

  const myReview = user ? reviews.find(r => r.userId === user.id) : null;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (text.length > 500) { setError("Максимум 500 символов"); return; }
    setSub(true);
    setError("");
    try {
      await addReview({
        variables: { input: { courseId, rating: myRating, text: text.trim() } },
      });
      setText("");
      await refetch();
    } catch (e) {
      setError(e.message || "Ошибка при отправке");
    } finally {
      setSub(false);
    }
  };

  const handleDelete = async (reviewId) => {
    await deleteReview({ variables: { reviewId } });
    await refetch();
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch { return ""; }
  };

  return (
    <div className={s.section}>
      <div className={s.sectionHeader} style={{ marginBottom: 20 }}>
        <h2 className={s.sectionTitle} style={{ margin: 0 }}>
          <MessageOutlined style={{ marginRight: 8, color: "var(--accent-text)" }} />
          Student reviews
        </h2>
        <span className={s.sectionMeta}>{reviews.length} reviews</span>
      </div>

      {/* Summary */}
      <div className={s.reviewSummary}>
        <div className={s.reviewBig}>
          <span className={s.reviewScore}>{avg}</span>
          <Rate disabled value={parseFloat(avg)} style={{ fontSize: 13 }} allowHalf />
          <span className={s.reviewTotal}>{reviews.length} reviews</span>
        </div>
        <div className={s.ratingBars}>
          {[5, 4, 3, 2, 1].map(star => {
            const pct = reviews.length
              ? Math.round(reviews.filter(c => Math.round(c.rating) === star).length / reviews.length * 100)
              : 0;
            return (
              <div key={star} className={s.ratingBarRow}>
                <span className={s.ratingBarLbl}>{star}★</span>
                <div className={s.ratingBarTrack}>
                  <div className={s.ratingBarFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={s.ratingBarPct}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write review */}
      {user ? (
        <div className={s.writeComment}>
          {myReview && (
            <div className={s.myReviewNote}>
              ✏️ У тебя уже есть отзыв — если напишешь снова, он обновится.
            </div>
          )}
          <div className={s.writeCommentTop}>
            <Avatar style={{ background: "var(--accent)", flexShrink: 0, fontSize: 11 }}>
              {(user.name || "?").slice(0, 2).toUpperCase()}
            </Avatar>
            <div className={s.writeCommentMeta}>
              <span className={s.writeCommentName}>{user.name}</span>
              <Rate value={myRating} onChange={setMyRating} style={{ fontSize: 14 }} />
            </div>
          </div>
          <textarea
            className={s.commentInput}
            placeholder="Share your experience with this course…"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
          />
          {error && <p className={s.commentError}>{error}</p>}
          <div className={s.writeCommentFoot}>
            <span className={s.commentChars}>{text.length}/500</span>
            <button
              className={s.commentSubmit}
              onClick={handleSubmit}
              disabled={!text.trim() || submitting || text.length > 500}
            >
              {submitting ? "Posting…" : <><SendOutlined /> Post review</>}
            </button>
          </div>
        </div>
      ) : (
        <div className={s.commentCta}>
          <UserOutlined style={{ fontSize: 22, color: "var(--text-secondary)" }} />
          <div>
            <p className={s.ctaTitle}>Sign in to leave a review</p>
            <p className={s.ctaSub}>Share your experience and help others choose the right course</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && <div className={s.reviewsLoading}>Loading reviews…</div>}

      {/* List */}
      <div className={s.commentList}>
        {reviews.map(r => {
          const isMe = user && r.userId === user.id;
          return (
            <div key={r.id} className={`${s.reviewCard} ${isMe ? s.reviewCardMe : ""}`}>
              <div className={s.reviewHeader}>
                <Avatar style={{ background: isMe ? "var(--green)" : "var(--accent)", fontSize: 11, flexShrink: 0 }}>
                  {r.userAvatar || r.userName?.slice(0, 2).toUpperCase()}
                </Avatar>
                <div className={s.reviewMeta}>
                  <span className={s.reviewName}>
                    {r.userName}
                    {isMe && <span className={s.meBadge}>You</span>}
                  </span>
                  <span className={s.reviewDate}>{formatDate(r.createdAt)}</span>
                </div>
                <Rate disabled value={r.rating} style={{ fontSize: 11, marginLeft: "auto" }} />
                {isMe && (
                  <button className={s.deleteReviewBtn} onClick={() => handleDelete(r.id)} title="Delete my review">
                    ✕
                  </button>
                )}
              </div>
              <p className={s.reviewText}>{r.text}</p>
            </div>
          );
        })}
        {!loading && reviews.length === 0 && (
          <div className={s.noReviews}>
            Отзывов пока нет. Будь первым! 🎯
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────────────────── */
const CourseDetailView = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const { user }                         = useAuthStore();
  const { enroll, unenroll, isEnrolled } = useEnrollStore();
  const { awardCoins }                   = useCoinsStore?.() ?? {};

  const [activeVideo,    setActiveVideo]    = useState(null);
  const [activeSlide,    setActiveSlide]    = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [markingId,      setMarkingId]      = useState(null); // id урока в процессе отметки

  const closeVideo      = useCallback(() => setActiveVideo(null),     []);
  const closeSlide      = useCallback(() => setActiveSlide(null),     []);
  const closeCompletion = useCallback(() => setShowCompletion(false), []);
  const completionShown = useRef(false);

  // 1. Все курсы → найти по slug
  const { data: allData } = useQuery(GET_ALL_COURSES);
  const allCourses = allData?.allCourses ?? [];

  const courseBase = useMemo(() => {
    if (!slug || !allCourses.length) return null;
    return allCourses.find(c => toSlug(c.title) === slug);
  }, [slug, allCourses]);

  // 2. Детали курса (уроки + прогресс)
  const { data: detailData, refetch } = useQuery(GET_COURSE_DETAIL, {
    variables:   { id: courseBase?.id },
    skip:        !courseBase?.id,
    fetchPolicy: "cache-and-network",
  });

  const [markComplete] = useMutation(MARK_COMPLETE, {
    onCompleted: () => refetch(),
    onError: (e) => console.error("markLessonComplete error:", e.message),
  });

  const detail  = detailData?.courseDetail;
  const lessons = detail?.lessons ?? [];
  const enrolled = isEnrolled(courseBase?.id);

  // Обновить title
  useEffect(() => {
    if (courseBase?.title) {
      document.title = `${courseBase.title} | EduStream`;
      return () => { document.title = "EduStream"; };
    }
  }, [courseBase?.title]);

  // Проверка завершения курса
  useEffect(() => {
    if (!detail || !enrolled || completionShown.current) return;
    if (detail.progressPercent === 100 && detail.completedLessons > 0) {
      completionShown.current = true;
      setShowCompletion(true);
      if (awardCoins && user) awardCoins(500, `Completed: ${courseBase?.title}`);
    }
  }, [detail?.progressPercent]);

  const handleEnroll = () => {
    if (!user || !courseBase) return;
    enroll({
      id:           courseBase.id,
      title:        courseBase.title,
      thumb:        courseBase.thumb,
      instructor:   courseBase.instructor,
      category:     courseBase.category,
      level:        courseBase.level,
      totalLessons: detail?.totalLessons ?? 0,
    });
  };

  // ── Клик по уроку ─────────────────────────────────────────────────────────
  const handleLessonClick = (lesson) => {
    const accessible = enrolled || lesson.isFree;
    if (!accessible) return;

    if (lesson.type === "video") {
      if (lesson.contentUrl) {
        setActiveVideo({ url: lesson.contentUrl, title: lesson.title });
      } else {
        // Нет URL — показываем слайд с сообщением
        setActiveSlide(lesson);
      }
    } else {
      // presentation, theory, task — всё открывается в SlideViewer
      setActiveSlide(lesson);
    }
  };

  // ── Отметить урок выполненным ──────────────────────────────────────────────
  const handleMarkComplete = async (lessonId, e) => {
    e.stopPropagation();
    if (!user || !enrolled || markingId) return;
    setMarkingId(lessonId);
    try {
      await markComplete({ variables: { lessonId } });
    } finally {
      setMarkingId(null);
    }
  };

  // ── Continue Learning — первый незавершённый урок ──────────────────────────
  const handleContinue = () => {
    const sorted = [...lessons].sort((a, b) => a.order - b.order);
    const first  = sorted.find(l => !l.completed) ?? sorted[0];
    if (first) {
      handleLessonClick(first);
    }
  };

  // Группировка по секциям
  const sections = useMemo(() => {
    const map = new Map();
    for (const l of [...lessons].sort((a, b) => a.order - b.order)) {
      if (!map.has(l.section)) map.set(l.section, []);
      map.get(l.section).push(l);
    }
    return Array.from(map.entries());
  }, [lessons]);

  const totalLessons = detail?.totalLessons ?? lessons.length;

  // Курс не найден
  if (!courseBase && allCourses.length > 0) {
    return (
      <div className={s.root}>
        <Header />
        <div className={s.notFound}>
          <h2>Course not found</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
            Slug: <code>{slug}</code>
          </p>
          <button className={s.backBtn} onClick={() => navigate("/courses")}>← All courses</button>
        </div>
        <Footer />
      </div>
    );
  }

  const course = courseBase ?? {};

  return (
    <div className={s.root}>
      <Header />

      {/* Modals */}
      {activeVideo    && <VideoModal    url={activeVideo.url} title={activeVideo.title} onClose={closeVideo} />}
      {activeSlide    && <SlideViewer  lesson={activeSlide}  onClose={closeSlide} />}
      {showCompletion && courseBase && <CompletionModal course={courseBase} onClose={closeCompletion} />}

      <main className={s.main}>
        {/* ── Hero ── */}
        <div className={s.hero}>
          <div className={s.heroBg}>
            {course.thumb && <img src={course.thumb} alt="" className={s.heroBgImg} />}
            <div className={s.heroBgOverlay} />
          </div>
          <div className={s.heroContent}>
            <button className={s.heroBackBtn} onClick={() => navigate("/courses")}>← All courses</button>
            <div className={s.heroTags}>
              {course.category && <Tag className={s.heroTag}>{course.category}</Tag>}
              {course.level    && <Tag className={s.heroTagLevel}>{course.level}</Tag>}
            </div>
            <h1 className={s.heroTitle}>{course.title || "Loading…"}</h1>
            {course.subtitle && <p className={s.heroSubtitle}>{course.subtitle}</p>}
            <div className={s.heroMeta}>
              {course.rating && (
                <div className={s.heroRating}>
                  <StarFilled style={{ color: "#fbbf24" }} />
                  <span className={s.ratingVal}>{course.rating}</span>
                </div>
              )}
              {course.students && (
                <><div className={s.heroDot} /><TeamOutlined /><span>{course.students?.toLocaleString()} students</span></>
              )}
              {course.duration && (
                <><div className={s.heroDot} /><ClockCircleOutlined /><span>{course.duration}</span></>
              )}
            </div>
            {course.instructor && (
              <div className={s.heroInstructor}>
                <Avatar style={{ background: "var(--accent)" }}>
                  {course.avatar || course.instructor?.slice(0, 2)}
                </Avatar>
                <span>by <strong>{course.instructor}</strong></span>
              </div>
            )}
            {enrolled && (
              <div className={s.enrolledBadge}>
                ✓ Enrolled · {detail?.progressPercent ?? 0}% complete
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className={s.body}>
          <div className={s.contentCol}>

            {/* Curriculum */}
            <div className={s.section}>
              <div className={s.sectionHeader}>
                <h2 className={s.sectionTitle}>Course curriculum</h2>
                <span className={s.sectionMeta}>{totalLessons} lessons</span>
              </div>
              <div className={s.curriculumWrap}>
                <Collapse ghost expandIconPosition="end" className={s.curriculum} defaultActiveKey={["0"]}>
                  {sections.map(([secName, secLessons], si) => (
                    <Panel
                      key={si}
                      header={
                        <div className={s.panelHeader}>
                          <span className={s.panelTitle}>{secName}</span>
                          <span className={s.panelMeta}>
                            {secLessons.filter(l => l.completed).length}/{secLessons.length} done
                          </span>
                        </div>
                      }
                      className={s.panel}
                    >
                      {secLessons.map(lesson => {
                        const accessible = enrolled || lesson.isFree;
                        const isMarking  = markingId === lesson.id;
                        return (
                          <div
                            key={lesson.id}
                            className={`${s.lesson} ${!accessible ? s.lessonLocked : s.lessonClickable} ${lesson.completed ? s.lessonDone : ""}`}
                            onClick={() => handleLessonClick(lesson)}
                          >
                            {accessible
                              ? <PlayCircleFilled className={lesson.completed ? s.lessonIconDone : s.lessonIcon} />
                              : <LockFilled className={s.lessonIconLocked} />
                            }
                            <div className={s.lessonInfo}>
                              <span className={s.lessonTitle}>{lesson.title}</span>
                              {lesson.duration && <span className={s.lessonDur}>{lesson.duration}</span>}
                            </div>
                            <div className={s.lessonBadges}>
                              {lesson.isFree && <span className={s.freeTag}>Preview</span>}
                              {accessible && lesson.type === "video"        && <span className={s.watchTag}><PlaySquareOutlined /> Watch</span>}
                              {accessible && lesson.type === "presentation" && <span className={s.slidesTag}><FileTextOutlined /> Slides</span>}
                              {accessible && (lesson.type === "theory" || lesson.type === "task") && <span className={s.theoryTag}><BookOutlined /> Read</span>}
                            </div>

                            {/* Галочка — отметить как выполненный */}
                            {accessible && enrolled && !lesson.completed && (
                              <button
                                className={`${s.doneBtn} ${isMarking ? s.doneBtnLoading : ""}`}
                                onClick={e => handleMarkComplete(lesson.id, e)}
                                title="Mark as complete"
                                disabled={isMarking}
                              >
                                {isMarking ? "…" : "✓"}
                              </button>
                            )}
                            {lesson.completed && <CheckCircleFilled className={s.doneCheck} />}
                          </div>
                        );
                      })}
                    </Panel>
                  ))}
                </Collapse>

                {!enrolled && (
                  <div className={s.lockOverlay}>
                    <div className={s.lockBox}>
                      <div className={s.lockIco}>🔒</div>
                      <h3 className={s.lockTitle}>Content Locked</h3>
                      <p className={s.lockSub}>Enroll to unlock all lessons, slides, and your certificate.</p>
                      <button className={s.lockEnrollBtn} onClick={handleEnroll}>
                        Enroll — {course.isFree ? "Free" : course.price}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments — из БД */}
            <CommentsSection courseId={course.id} user={user} rating={course.rating ?? 4.8} />
          </div>

          {/* ── Sidebar ── */}
          <div className={s.sideCol}>
            {/* Enroll card */}
            <div className={s.enrollCard}>
              <div className={s.enrollThumb}>
                {course.thumb && <img src={course.thumb} alt={course.title} />}
              </div>
              <div className={s.enrollBody}>
                {!enrolled ? (
                  <>
                    {!course.isFree && (
                      <div className={s.priceRow}>
                        <span className={s.price}>{course.price}</span>
                      </div>
                    )}
                    {user
                      ? <button className={s.enrollBtn} onClick={handleEnroll}>Enroll in this course</button>
                      : <div className={s.loginCta}>Sign in to enroll</div>
                    }
                  </>
                ) : (
                  <>
                    <div className={s.enrolledState}>
                      <div className={s.enrolledCheck}>✓</div>
                      <div>
                        <p className={s.enrolledTitle}>You're enrolled!</p>
                        <p className={s.enrolledSub}>{detail?.progressPercent ?? 0}% complete</p>
                      </div>
                    </div>
                    {/* ── Continue Learning — открывает первый незавершённый урок ── */}
                    <button className={s.startBtn} onClick={handleContinue}>
                      ▶ Continue learning
                    </button>
                    <button className={s.unenrollBtn} onClick={() => unenroll(course.id)}>
                      Unenroll
                    </button>
                  </>
                )}
                <div className={s.enrollPerks}>
                  {[
                    { icon: <MobileOutlined />,            text: "Access on all devices" },
                    { icon: <TrophyFilled />,              text: "Certificate on completion" },
                    { icon: <SafetyCertificateOutlined />, text: "30-day money back" },
                    { icon: <ThunderboltFilled />,         text: "+500 EduCoins on finish" },
                  ].map((p, i) => (
                    <div key={i} className={s.enrollPerk}>
                      <span className={s.perkIcon}>{p.icon}</span>
                      <span>{p.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            {enrolled && lessons.length > 0 && (
              <ProgressSteps lessons={lessons} progressPercent={detail?.progressPercent ?? 0} />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetailView;