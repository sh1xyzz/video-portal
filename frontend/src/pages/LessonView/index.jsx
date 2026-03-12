// src/pages/LessonView/LessonView.jsx
// Полноценная страница урока: видео / теория / слайды / задание
// Роут: /courses/:courseId/lessons/:lessonId

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  CheckOutlined, CheckCircleFilled, LockFilled,
  ArrowLeftOutlined, ArrowRightOutlined,
  VideoCameraOutlined, BookOutlined,
  FileTextOutlined, CodeOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import s from "./LessonView.module.css";

// ── GraphQL ──────────────────────────────────────────────────────────────────

const GET_LESSON_PAGE = gql`
  query GetLessonPage($courseId: Int!) {
    courseDetail(id: $courseId) {
      id title progressPercent completedLessons totalLessons
      lessons {
        id section title type duration isFree order completed
        contentUrl content
      }
    }
  }
`;

const MARK_COMPLETE = gql`
  mutation MarkLessonComplete($lessonId: Int!) {
    markLessonComplete(lessonId: $lessonId)
  }
`;

// ── Метаданные типов ──────────────────────────────────────────────────────────

const TYPE = {
  video:        { icon: <VideoCameraOutlined />, label: "Видео",    color: "#818cf8" },
  theory:       { icon: <BookOutlined />,        label: "Теория",   color: "#34d399" },
  presentation: { icon: <FileTextOutlined />,    label: "Слайды",   color: "#60a5fa" },
  task:         { icon: <CodeOutlined />,         label: "Задание",  color: "#fb923c" },
};

// ── Хелперы ───────────────────────────────────────────────────────────────────

const groupBySection = (lessons) => {
  const map = new Map();
  for (const l of lessons) {
    if (!map.has(l.section)) map.set(l.section, []);
    map.get(l.section).push(l);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT RENDERERS
// ─────────────────────────────────────────────────────────────────────────────

// ── Видео ─────────────────────────────────────────────────────────────────────

const VideoLesson = ({ lesson }) => {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={s.videoBlock}>
      {lesson.contentUrl ? (
        <div className={s.videoOuter}>
          <div className={s.videoRatio}>
            {!playing ? (
              /* Превью с кнопкой play */
              <div className={s.videoPreview} onClick={() => setPlaying(true)}>
                <div className={s.videoPreviewOverlay} />
                <button className={s.playBtn} aria-label="Воспроизвести">
                  <span className={s.playTriangle} />
                </button>
                <div className={s.videoInfo}>
                  <span className={s.videoDur}>{lesson.duration}</span>
                </div>
              </div>
            ) : (
              <iframe
                src={`${lesson.contentUrl}?autoplay=1&rel=0&modestbranding=1`}
                className={s.videoFrame}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            )}
          </div>
        </div>
      ) : (
        <div className={s.noMedia}>
          <VideoCameraOutlined />
          <p>Видео появится скоро</p>
        </div>
      )}

      {/* Описание под видео */}
      {lesson.content && (
        <div className={s.videoDescription}>
          <h3 className={s.descTitle}>О видео</h3>
          <p className={s.descText}>{lesson.content}</p>
        </div>
      )}
    </div>
  );
};

// ── Теория ────────────────────────────────────────────────────────────────────

const TheoryLesson = ({ lesson }) => {
  const contentRef = useRef(null);

  // Парсим заголовки для оглавления (строки начинающиеся с ##)
  const paragraphs = (lesson.content || "").split("\n").filter(Boolean);
  const toc = paragraphs
    .filter(p => p.startsWith("## "))
    .map(p => p.replace("## ", "").trim());

  const scrollTo = (text) => {
    const el = contentRef.current?.querySelector(`[data-heading="${text}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={s.theoryBlock}>
      {toc.length > 1 && (
        <div className={s.toc}>
          <p className={s.tocTitle}>Содержание</p>
          {toc.map((h, i) => (
            <button key={i} className={s.tocItem} onClick={() => scrollTo(h)}>
              <span className={s.tocNum}>{i + 1}</span>
              {h}
            </button>
          ))}
        </div>
      )}

      <div className={s.theoryContent} ref={contentRef}>
        {lesson.content ? (
          paragraphs.map((para, i) => {
            if (para.startsWith("## ")) {
              const text = para.replace("## ", "");
              return (
                <h2 key={i} className={s.theoryH2} data-heading={text}>
                  {text}
                </h2>
              );
            }
            if (para.startsWith("### ")) {
              return <h3 key={i} className={s.theoryH3}>{para.replace("### ", "")}</h3>;
            }
            if (para.startsWith("- ")) {
              return <li key={i} className={s.theoryLi}>{para.replace("- ", "")}</li>;
            }
            if (para.startsWith("```")) {
              return null; // пропускаем маркеры блока кода
            }
            if (para.startsWith("> ")) {
              return (
                <blockquote key={i} className={s.theoryQuote}>
                  {para.replace("> ", "")}
                </blockquote>
              );
            }
            return <p key={i} className={s.theoryP}>{para}</p>;
          })
        ) : (
          <div className={s.noMedia}>
            <BookOutlined />
            <p>Текст урока появится скоро</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Презентация ───────────────────────────────────────────────────────────────

const PresentationLesson = ({ lesson }) => (
  <div className={s.slideBlock}>
    {lesson.contentUrl ? (
      <div className={s.slideOuter}>
        <div className={s.slideRatio}>
          <iframe
            src={lesson.contentUrl}
            className={s.slideFrame}
            allowFullScreen
            title={lesson.title}
          />
        </div>
      </div>
    ) : (
      <div className={s.noMedia}>
        <FileTextOutlined />
        <p>Слайды появятся скоро</p>
      </div>
    )}
    {lesson.content && (
      <div className={s.videoDescription}>
        <h3 className={s.descTitle}>Примечания</h3>
        <p className={s.descText}>{lesson.content}</p>
      </div>
    )}
  </div>
);

// ── Задание ───────────────────────────────────────────────────────────────────

const TaskLesson = ({ lesson }) => {
  const steps = (lesson.content || "")
    .split("\n")
    .filter(Boolean)
    .filter(l => l.startsWith("- ") || l.match(/^\d+\./))
    .map(l => l.replace(/^- |^\d+\. /, "").trim());

  const description = (lesson.content || "")
    .split("\n")
    .filter(Boolean)
    .filter(l => !l.startsWith("- ") && !l.match(/^\d+\./))
    .join(" ");

  return (
    <div className={s.taskBlock}>
      {/* Hero задания */}
      <div className={s.taskHero}>
        <div className={s.taskBadge}>
          <CodeOutlined /> Практическое задание
        </div>
        <h2 className={s.taskTitle}>{lesson.title}</h2>
        {description && <p className={s.taskDesc}>{description}</p>}
      </div>

      {/* Шаги */}
      {steps.length > 0 && (
        <div className={s.taskSteps}>
          <p className={s.stepsTitle}>Что нужно сделать:</p>
          {steps.map((step, i) => (
            <div key={i} className={s.taskStep}>
              <span className={s.stepNum}>{i + 1}</span>
              <span className={s.stepText}>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка открыть задание */}
      {lesson.contentUrl && (
        <a
          href={lesson.contentUrl}
          target="_blank"
          rel="noreferrer"
          className={s.taskOpenBtn}
        >
          Открыть задание <ArrowRightOutlined />
        </a>
      )}

      {/* Если нет контента */}
      {!lesson.content && !lesson.contentUrl && (
        <div className={s.noMedia}>
          <CodeOutlined />
          <p>Задание появится скоро</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const LessonPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completed, setCompleted] = useState(false);

  const { data, loading, refetch } = useQuery(GET_LESSON_PAGE, {
    variables: { courseId: parseInt(courseId) },
    skip: !courseId,
    fetchPolicy: "cache-and-network",
  });

  const [markComplete] = useMutation(MARK_COMPLETE, {
    onCompleted: () => { setCompleted(true); refetch(); },
  });

  const course  = data?.courseDetail;
  const lessons = course?.lessons
    ? [...course.lessons].sort((a, b) => a.order - b.order)
    : [];

  const currentLesson = lessons.find(l => l.id === parseInt(lessonId));
  const currentIdx    = lessons.findIndex(l => l.id === parseInt(lessonId));
  const prevLesson    = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson    = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;
  const sections      = groupBySection(lessons);

  // Синхронизируем completed с данными
  useEffect(() => {
    if (currentLesson) setCompleted(currentLesson.completed);
  }, [currentLesson?.id]);

  const goTo = (lesson) => {
    navigate(`/courses/${courseId}/lessons/${lesson.id}`);
    window.scrollTo(0, 0);
  };

  if (loading && !course) {
    return (
      <div className={s.root}>
        <div className={s.loadingScreen}>
          <div className={s.loadingDots}>
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className={s.root}>
        <div className={s.notFound}>
          <p>Урок не найден</p>
          <Link to={`/courses/${courseId}`} className={s.backLink}>← К курсу</Link>
        </div>
      </div>
    );
  }

  const meta = TYPE[currentLesson.type] ?? TYPE.theory;
  const allDone = course?.completedLessons === course?.totalLessons && course?.totalLessons > 0;

  return (
    <div className={`${s.root} ${sidebarOpen ? s.rootOpen : s.rootClosed}`}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className={`${s.sidebar} ${sidebarOpen ? s.sidebarVisible : ""}`}>

        {/* Course header */}
        <div className={s.sidebarTop}>
          <Link to={`/courses/${courseId}`} className={s.courseBackLink}>
            <ArrowLeftOutlined /> К курсу
          </Link>
          <div className={s.courseNameWrap}>
            <p className={s.courseName}>{course?.title}</p>
            <div className={s.courseProgress}>
              <div className={s.progressBar}>
                <div
                  className={s.progressFill}
                  style={{ width: `${course?.progressPercent ?? 0}%` }}
                />
              </div>
              <span className={s.progressText}>
                {course?.completedLessons}/{course?.totalLessons}
              </span>
            </div>
          </div>
        </div>

        {/* Lesson list */}
        <nav className={s.lessonList}>
          {sections.map((sec, si) => (
            <div key={si} className={s.sideSection}>
              <p className={s.sideSectionTitle}>{sec.name}</p>
              {sec.items.map(lesson => {
                const lmeta    = TYPE[lesson.type] ?? TYPE.theory;
                const isCurrent = lesson.id === parseInt(lessonId);
                return (
                  <button
                    key={lesson.id}
                    className={`${s.sideLesson} ${isCurrent ? s.sideLessonActive : ""} ${lesson.completed ? s.sideLessonDone : ""}`}
                    onClick={() => goTo(lesson)}
                  >
                    <span
                      className={s.sideLessonIcon}
                      style={isCurrent
                        ? { color: lmeta.color, background: lmeta.color + "20" }
                        : {}}
                    >
                      {lesson.completed
                        ? <CheckCircleFilled style={{ color: "#34d399" }} />
                        : lmeta.icon
                      }
                    </span>
                    <span className={s.sideLessonTitle}>{lesson.title}</span>
                    {lesson.duration && (
                      <span className={s.sideLessonDur}>{lesson.duration}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div className={s.main}>

        {/* Top bar */}
        <header className={s.topBar}>
          <button
            className={s.toggleBtn}
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          </button>

          {/* Breadcrumb */}
          <div className={s.breadcrumb}>
            <Link to={`/courses/${courseId}`} className={s.breadLink}>
              {course?.title}
            </Link>
            <span className={s.breadSep}>/</span>
            <span className={s.breadCurrent}>{currentLesson.section}</span>
          </div>

          {/* Nav prev/next */}
          <div className={s.navBtns}>
            <button
              className={s.navBtn}
              disabled={!prevLesson}
              onClick={() => prevLesson && goTo(prevLesson)}
            >
              <ArrowLeftOutlined /> Пред.
            </button>
            <button
              className={s.navBtn}
              disabled={!nextLesson}
              onClick={() => nextLesson && goTo(nextLesson)}
            >
              След. <ArrowRightOutlined />
            </button>
          </div>
        </header>

        {/* Lesson header */}
        <div className={s.lessonHeader}>
          <div className={s.lessonType} style={{ color: meta.color, background: meta.color + "15" }}>
            {meta.icon} {meta.label}
          </div>
          <h1 className={s.lessonTitle}>{currentLesson.title}</h1>
          {currentLesson.duration && (
            <span className={s.lessonDur}>{currentLesson.duration}</span>
          )}
        </div>

        {/* Content */}
        <div className={s.content}>
          {currentLesson.type === "video"        && <VideoLesson        lesson={currentLesson} />}
          {currentLesson.type === "theory"       && <TheoryLesson       lesson={currentLesson} />}
          {currentLesson.type === "presentation" && <PresentationLesson lesson={currentLesson} />}
          {currentLesson.type === "task"         && <TaskLesson         lesson={currentLesson} />}
        </div>

        {/* Bottom bar: mark complete + navigation */}
        <div className={s.bottomBar}>
          <div className={s.bottomLeft}>
            {prevLesson && (
              <button className={s.bottomNav} onClick={() => goTo(prevLesson)}>
                <ArrowLeftOutlined />
                <span>
                  <small>Предыдущий</small>
                  {prevLesson.title}
                </span>
              </button>
            )}
          </div>

          <div className={s.bottomCenter}>
            {completed || currentLesson.completed ? (
              <div className={s.doneChip}>
                <CheckCircleFilled /> Урок завершён
              </div>
            ) : (
              <button
                className={s.completeBtn}
                onClick={() => markComplete({ variables: { lessonId: currentLesson.id } })}
              >
                <CheckOutlined /> Отметить пройденным
              </button>
            )}
          </div>

          <div className={s.bottomRight}>
            {nextLesson ? (
              <button className={`${s.bottomNav} ${s.bottomNavNext}`} onClick={() => goTo(nextLesson)}>
                <span>
                  <small>Следующий</small>
                  {nextLesson.title}
                </span>
                <ArrowRightOutlined />
              </button>
            ) : allDone ? (
              <div className={s.finishChip}>
                <TrophyOutlined /> Курс завершён!
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;