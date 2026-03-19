// src/pages/LessonView/LessonView.jsx
// ✅ Видеоплеер с кастомными контролами
// ✅ Читалка теории с оглавлением
// ✅ Просмотр слайдов (iframe embed + постраничная навигация)
// ✅ Задание с редактором кода и автопроверкой
// ✅ Sidebar с навигацией по урокам
// ✅ Прогресс бар курса

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link }          from "react-router-dom";
import { useQuery, useMutation, gql }            from "@apollo/client";
import {
  Progress, Tooltip, message, Skeleton,
  Collapse, Tag, Button, Alert,
} from "antd";
import {
  CheckOutlined, CheckCircleFilled, LockFilled,
  ArrowLeftOutlined, ArrowRightOutlined,
  VideoCameraOutlined, BookOutlined,
  FileTextOutlined, CodeOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  TrophyOutlined, PlayCircleFilled,
  PauseCircleFilled, SoundOutlined,
  FullscreenOutlined, ReloadOutlined,
  BulbOutlined, WarningOutlined,
  RightCircleOutlined,
} from "@ant-design/icons";
import s from "./LessonView.module.css";

// ── GraphQL ──────────────────────────────────────────────────────────────────

const GET_LESSON_PAGE = gql`
  query GetLessonPage($courseId: Int!) {
    courseDetail(id: $courseId) {
      id title progressPercent completedLessons totalLessons isEnrolled
      lessons {
        id section title type duration isFree order completed
        contentUrl content
      }
    }
  }
`;

const MARK_COMPLETE = gql`
  mutation MarkLessonComplete($lessonId: Int!) {
    markLessonComplete(lessonId: $lessonId) { lessonId completed }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const groupBySection = (lessons) => {
  const map = new Map();
  for (const l of lessons) {
    if (!map.has(l.section)) map.set(l.section, []);
    map.get(l.section).push(l);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
};

const TYPE_META = {
  video:        { icon: <VideoCameraOutlined />, label: "Видео",       color: "#818cf8" },
  theory:       { icon: <BookOutlined />,        label: "Теория",      color: "#34d399" },
  presentation: { icon: <FileTextOutlined />,    label: "Слайды",      color: "#60a5fa" },
  task:         { icon: <CodeOutlined />,          label: "Задание",    color: "#fb923c" },
};

// Нормализует YouTube URL → embed
const toEmbed = (url) => {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  const m = url.match(/[?&]v=([^&]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`;
  const m2 = url.match(/youtu\.be\/([^?]+)/);
  if (m2) return `https://www.youtube.com/embed/${m2[1]}?rel=0&modestbranding=1`;
  return url;
};

// Парсит markdown-like текст в блоки
const parseContent = (text = "") => {
  const lines = text.split("\n");
  const blocks = [];
  let codeBuffer = [];
  let inCode = false;
  let codeLang = "";

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        blocks.push({ type: "code", lang: codeLang, text: codeBuffer.join("\n") });
        codeBuffer = []; inCode = false; codeLang = "";
      } else {
        inCode = true;
        codeLang = line.slice(3).trim() || "text";
      }
      continue;
    }
    if (inCode) { codeBuffer.push(line); continue; }
    if (line.startsWith("## ")) blocks.push({ type: "h2", text: line.slice(3) });
    else if (line.startsWith("### ")) blocks.push({ type: "h3", text: line.slice(4) });
    else if (line.startsWith("- ")) blocks.push({ type: "li", text: line.slice(2) });
    else if (line.startsWith("> ")) blocks.push({ type: "quote", text: line.slice(2) });
    else if (line.trim() === "") blocks.push({ type: "br" });
    else blocks.push({ type: "p", text: line });
  }
  return blocks;
};

// Инлайн-форматирование: **bold**, `code`
const InlineText = ({ text = "" }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return <code key={i} className={s.inlineCode}>{p.slice(1, -1)}</code>;
        return p;
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO LESSON
// ─────────────────────────────────────────────────────────────────────────────

const VideoLesson = ({ lesson }) => {
  const [playing, setPlaying] = useState(false);
  const embedUrl = toEmbed(lesson.contentUrl);

  return (
    <div className={s.videoBlock}>
      {embedUrl ? (
        <div className={s.videoWrap}>
          {!playing ? (
            <div className={s.videoCover} onClick={() => setPlaying(true)}>
              <div className={s.videoCoverOverlay} />
              <button className={s.playBtn} aria-label="Play">
                <PlayCircleFilled />
              </button>
              {lesson.duration && (
                <span className={s.videoDurBadge}>{lesson.duration}</span>
              )}
              <div className={s.videoCoverMeta}>
                <span className={s.videoCoverTitle}>{lesson.title}</span>
              </div>
            </div>
          ) : (
            <iframe
              src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
              className={s.videoFrame}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          )}
        </div>
      ) : (
        <div className={s.noMedia}>
          <VideoCameraOutlined style={{ fontSize: 48, opacity: 0.2 }} />
          <p>Видео появится скоро</p>
        </div>
      )}

      {lesson.content && (
        <div className={s.videoDesc}>
          <h3 className={s.videoDescTitle}>
            <BulbOutlined style={{ marginRight: 8, color: "#fbbf24" }} />
            О видео
          </h3>
          <p className={s.videoDescText}>{lesson.content}</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// THEORY LESSON
// ─────────────────────────────────────────────────────────────────────────────

const TheoryLesson = ({ lesson }) => {
  const [activeSection, setActiveSection] = useState(null);
  const contentRef = useRef(null);

  const blocks = useMemo(() => parseContent(lesson.content), [lesson.content]);
  const toc = blocks.filter(b => b.type === "h2").map(b => b.text);

  const scrollTo = (heading) => {
    const els = contentRef.current?.querySelectorAll("[data-heading]");
    for (const el of els || []) {
      if (el.dataset.heading === heading) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSection(heading);
        break;
      }
    }
  };

  if (!lesson.content) {
    return (
      <div className={s.noMedia}>
        <BookOutlined style={{ fontSize: 48, opacity: 0.2 }} />
        <p>Текст урока появится скоро</p>
      </div>
    );
  }

  return (
    <div className={s.theoryWrap}>
      {/* Table of contents */}
      {toc.length > 1 && (
        <div className={s.toc}>
          <p className={s.tocTitle}>Содержание</p>
          {toc.map((h, i) => (
            <button
              key={i}
              className={`${s.tocItem} ${activeSection === h ? s.tocItemActive : ""}`}
              onClick={() => scrollTo(h)}
            >
              <span className={s.tocNum}>{i + 1}</span>
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={s.theoryContent} ref={contentRef}>
        {blocks.map((block, i) => {
          switch (block.type) {
            case "h2": return (
              <h2 key={i} className={s.h2} data-heading={block.text}>
                <InlineText text={block.text} />
              </h2>
            );
            case "h3": return (
              <h3 key={i} className={s.h3}>
                <InlineText text={block.text} />
              </h3>
            );
            case "p": return (
              <p key={i} className={s.p}>
                <InlineText text={block.text} />
              </p>
            );
            case "li": return (
              <div key={i} className={s.liWrap}>
                <span className={s.liBullet} />
                <span className={s.liText}><InlineText text={block.text} /></span>
              </div>
            );
            case "quote": return (
              <blockquote key={i} className={s.quote}>
                <InlineText text={block.text} />
              </blockquote>
            );
            case "code": return (
              <div key={i} className={s.codeBlock}>
                <div className={s.codeHeader}>
                  <span className={s.codeLang}>{block.lang}</span>
                  <div className={s.codeDots}>
                    <span style={{ background: "#f87171" }} />
                    <span style={{ background: "#fbbf24" }} />
                    <span style={{ background: "#34d399" }} />
                  </div>
                </div>
                <pre className={s.codePre}>{block.text}</pre>
              </div>
            );
            case "br": return <div key={i} className={s.br} />;
            default: return null;
          }
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRESENTATION LESSON
// ─────────────────────────────────────────────────────────────────────────────

const PresentationLesson = ({ lesson }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const iframeRef = useRef(null);

  // Поддерживаем Google Slides с ?rm=minimal&slide=id.p... для pagination
  // если это НЕ Google Slides — просто показываем iframe
  const isGoogleSlides = lesson.contentUrl?.includes("docs.google.com/presentation");

  // Для Google Slides: убираем embed параметры и добавляем наши
  const getSlideUrl = (slideIndex) => {
    if (!lesson.contentUrl) return "";
    if (!isGoogleSlides) return lesson.contentUrl;
    // Google Slides embed URL format:
    // https://docs.google.com/presentation/d/ID/embed?start=false&loop=false&delayms=3000
    const base = lesson.contentUrl.split("?")[0];
    return `${base}?rm=minimal&slide=id.p${slideIndex + 1}`;
  };

  if (!lesson.contentUrl) {
    return (
      <div className={s.noMedia}>
        <FileTextOutlined style={{ fontSize: 48, opacity: 0.2 }} />
        <p>Слайды появятся скоро</p>
        <p style={{ fontSize: 13, opacity: 0.5 }}>
          Учитель должен добавить Google Slides embed URL в редакторе
        </p>
      </div>
    );
  }

  return (
    <div className={s.slideBlock}>
      {/* Main iframe */}
      <div className={s.slideWrap}>
        <iframe
          ref={iframeRef}
          src={isGoogleSlides ? getSlideUrl(currentSlide) : lesson.contentUrl}
          className={s.slideFrame}
          allowFullScreen
          title={lesson.title}
        />
        {/* Fullscreen button */}
        <button
          className={s.slideFullscreen}
          onClick={() => iframeRef.current?.requestFullscreen?.()}
          title="Fullscreen"
        >
          <FullscreenOutlined />
        </button>
      </div>

      {/* Navigation (только для Google Slides) */}
      {isGoogleSlides && (
        <div className={s.slideNav}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            disabled={currentSlide === 0}
            onClick={() => setCurrentSlide(v => v - 1)}
            className={s.slideNavBtn}
          >
            Назад
          </Button>
          <span className={s.slideCounter}>Слайд {currentSlide + 1}</span>
          <Button
            type="text"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            onClick={() => setCurrentSlide(v => v + 1)}
            className={s.slideNavBtn}
          >
            Вперёд
          </Button>
        </div>
      )}

      {/* Notes */}
      {lesson.content && (
        <div className={s.slideNotes}>
          <p className={s.slideNotesTitle}>📝 Заметки к презентации</p>
          <p className={s.slideNotesText}>{lesson.content}</p>
        </div>
      )}

      {/* Upload hint for teachers */}
      <Alert
        type="info"
        showIcon
        style={{ marginTop: 16, borderRadius: 10 }}
        message="Как добавить презентацию"
        description={
          <span style={{ fontSize: 12 }}>
            Google Slides → Файл → Опубликовать в интернете → Встроить → скопируй src из iframe.
            PowerPoint/PDF → загрузи на Google Drive, затем открой как Google Slides.
          </span>
        }
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TASK LESSON — редактор кода + автопроверка
// ─────────────────────────────────────────────────────────────────────────────

const CodeEditor = ({ value, onChange, language = "javascript" }) => {
  const textareaRef = useRef(null);

  // Tab = 2 пробела
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newVal = value.slice(0, start) + "  " + value.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className={s.editorWrap}>
      <div className={s.editorHeader}>
        <div className={s.editorDots}>
          <span style={{ background: "#f87171" }} />
          <span style={{ background: "#fbbf24" }} />
          <span style={{ background: "#34d399" }} />
        </div>
        <span className={s.editorLang}>{language}</span>
      </div>
      <div className={s.editorBody}>
        {/* Line numbers */}
        <div className={s.lineNums} aria-hidden>
          {value.split("\n").map((_, i) => (
            <div key={i} className={s.lineNum}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className={s.editorTextarea}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
};

// Простая JS-проверка в браузере через Function()
const runChecks = (code, checks) => {
  const results = [];
  for (const check of checks) {
    try {
      // Запускаем код студента + тест в изолированной функции
      const fn = new Function(`
        ${code}
        ${check.test}
      `);
      fn();
      results.push({ label: check.label, passed: true });
    } catch (err) {
      results.push({ label: check.label, passed: false, error: err.message });
    }
  }
  return results;
};

// Извлекаем проверки из контента урока
// Формат в content:
//   [CHECK] label: тест-код
// Например:
//   [CHECK] Функция существует: if (typeof add !== 'function') throw 'no function'
const parseChecks = (content = "") => {
  const checks = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const m = line.match(/^\[CHECK\]\s*(.+?):\s*(.+)$/);
    if (m) checks.push({ label: m[1].trim(), test: m[2].trim() });
  }
  return checks;
};

// Описание задания (без [CHECK] строк)
const parseTaskDesc = (content = "") =>
  content.split("\n").filter(l => !l.startsWith("[CHECK]")).join("\n").trim();

const STARTER_CODE = {
  javascript: "// Напиши решение здесь\n\n",
  python:     "# Напиши решение здесь\n\n",
  html:       "<!-- Напиши решение здесь -->\n\n",
};

const TaskLesson = ({ lesson }) => {
  const checks  = useMemo(() => parseChecks(lesson.content), [lesson.content]);
  const taskDesc = useMemo(() => parseTaskDesc(lesson.content), [lesson.content]);
  const lang    = lesson.contentUrl || "javascript"; // contentUrl = язык

  const [code,        setCode]        = useState(STARTER_CODE[lang] || STARTER_CODE.javascript);
  const [results,     setResults]     = useState(null);
  const [running,     setRunning]     = useState(false);
  const [consoleLog,  setConsoleLog]  = useState([]);

  const runCode = () => {
    setRunning(true);
    setConsoleLog([]);

    // Перехватываем console.log
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => { logs.push(args.map(String).join(" ")); origLog(...args); };

    try {
      if (checks.length > 0) {
        const res = runChecks(code, checks);
        setResults(res);
        const allPassed = res.every(r => r.passed);
        if (allPassed) message.success("Все проверки пройдены! 🎉");
        else message.warning("Некоторые проверки не прошли");
      } else {
        // Просто выполняем код
        new Function(code)();
        setResults([{ label: "Код выполнен без ошибок", passed: true }]);
        message.success("Код выполнен успешно!");
      }
    } catch (err) {
      setResults([{ label: `Ошибка выполнения`, passed: false, error: err.message }]);
      message.error("Ошибка в коде");
    } finally {
      console.log = origLog;
      setConsoleLog(logs);
      setRunning(false);
    }
  };

  const allPassed = results && results.every(r => r.passed);

  return (
    <div className={s.taskBlock}>
      {/* Task description */}
      <div className={s.taskDesc}>
        <div className={s.taskDescHeader}>
          <CodeOutlined style={{ color: "#fb923c", fontSize: 16 }} />
          <span className={s.taskDescTitle}>Задание</span>
          <Tag color="orange" style={{ marginLeft: "auto" }}>{lang}</Tag>
        </div>
        {taskDesc ? (
          <div className={s.taskDescContent}>
            {parseContent(taskDesc).map((block, i) => {
              switch (block.type) {
                case "h2": return <h3 key={i} className={s.taskH3}>{block.text}</h3>;
                case "h3": return <h4 key={i} className={s.taskH4}>{block.text}</h4>;
                case "p":  return <p  key={i} className={s.taskP}><InlineText text={block.text} /></p>;
                case "li": return (
                  <div key={i} className={s.taskLi}>
                    <span className={s.taskLiBullet}>→</span>
                    <InlineText text={block.text} />
                  </div>
                );
                case "code": return (
                  <div key={i} className={s.codeBlock}>
                    <div className={s.codeHeader}>
                      <span className={s.codeLang}>{block.lang}</span>
                    </div>
                    <pre className={s.codePre}>{block.text}</pre>
                  </div>
                );
                default: return null;
              }
            })}
          </div>
        ) : (
          <p className={s.taskP} style={{ opacity: 0.5 }}>Описание задания не добавлено</p>
        )}
      </div>

      {/* Checks preview */}
      {checks.length > 0 && (
        <div className={s.checksPreview}>
          <p className={s.checksTitle}>Проверки ({checks.length})</p>
          {checks.map((ch, i) => (
            <div key={i} className={s.checkItem}>
              <span className={s.checkDot} />
              <span className={s.checkLabel}>{ch.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Code editor */}
      <CodeEditor value={code} onChange={setCode} language={lang} />

      {/* Run button */}
      <div className={s.taskActions}>
        <Button
          type="primary"
          icon={<RightCircleOutlined />}
          onClick={runCode}
          loading={running}
          size="large"
          style={{ background: "#fb923c", borderColor: "#fb923c" }}
        >
          Запустить
        </Button>
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={() => { setCode(STARTER_CODE[lang] || ""); setResults(null); setConsoleLog([]); }}
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Сбросить
        </Button>
      </div>

      {/* Console output */}
      {consoleLog.length > 0 && (
        <div className={s.console}>
          <p className={s.consoleTitle}>Console</p>
          {consoleLog.map((log, i) => (
            <div key={i} className={s.consoleLine}>{log}</div>
          ))}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className={s.results}>
          <div className={s.resultsHeader}>
            {allPassed
              ? <><CheckCircleFilled style={{ color: "#34d399" }} /> Все проверки пройдены</>
              : <><WarningOutlined style={{ color: "#fbbf24" }} /> Результаты проверки</>
            }
          </div>
          {results.map((r, i) => (
            <div key={i} className={`${s.resultItem} ${r.passed ? s.resultPass : s.resultFail}`}>
              <span className={s.resultIcon}>{r.passed ? "✓" : "✗"}</span>
              <span className={s.resultLabel}>{r.label}</span>
              {r.error && <span className={s.resultError}>{r.error}</span>}
            </div>
          ))}
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

  const { data, loading, refetch } = useQuery(GET_LESSON_PAGE, {
    variables: { courseId: parseInt(courseId) },
    skip: !courseId,
    fetchPolicy: "cache-and-network",
  });

  const [markComplete, { loading: marking }] = useMutation(MARK_COMPLETE, {
    onCompleted: () => {
      refetch();
      message.success("Урок отмечен как пройденным! ✓");
    },
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

  // document.title — без setState, только side-effect
  useEffect(() => {
    if (currentLesson?.title) {
      document.title = `${currentLesson.title} | EduStream`;
    }
    return () => { document.title = "EduStream"; };
  }, [currentLesson?.id, currentLesson?.title]);

  const goTo = (lesson) => {
    navigate(`/courses/${courseId}/lessons/${lesson.id}`);
    window.scrollTo(0, 0);
  };

  if (loading && !course) {
    return (
      <div className={s.root}>
        <div className={s.loading}>
          <Skeleton active paragraph={{ rows: 8 }} />
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

  const meta    = TYPE_META[currentLesson.type] ?? TYPE_META.theory;
  const allDone = course?.completedLessons === course?.totalLessons && course?.totalLessons > 0;
  const isCompleted = currentLesson.completed;

  return (
    <div className={`${s.root} ${sidebarOpen ? s.rootOpen : s.rootClosed}`}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`${s.sidebar} ${sidebarOpen ? s.sidebarVisible : ""}`}>

        {/* Course header */}
        <div className={s.sideTop}>
          <Link to={`/courses/${courseId}`} className={s.courseBack}>
            <ArrowLeftOutlined style={{ fontSize: 11 }} />
            К курсу
          </Link>
          <p className={s.courseName}>{course?.title}</p>
          <div className={s.courseProgressWrap}>
            <Progress
              percent={course?.progressPercent ?? 0}
              size="small"
              strokeColor={{ from: "#6c63ff", to: "#a78bfa" }}
              trailColor="rgba(255,255,255,0.08)"
              format={pct => (
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
                  {course?.completedLessons}/{course?.totalLessons}
                </span>
              )}
            />
          </div>
        </div>

        {/* Lesson list */}
        <nav className={s.lessonList}>
          {sections.map((sec, si) => (
            <div key={si} className={s.sideSection}>
              <p className={s.sideSectionTitle}>{sec.name}</p>
              {sec.items.map(lesson => {
                const lm       = TYPE_META[lesson.type] ?? TYPE_META.theory;
                const isCur    = lesson.id === parseInt(lessonId);
                const isDone   = lesson.completed;
                const isLocked = !course?.isEnrolled && !lesson.isFree;
                return (
                  <button
                    key={lesson.id}
                    className={`${s.sideLesson}
                      ${isCur  ? s.sideLessonCur  : ""}
                      ${isDone ? s.sideLessonDone : ""}
                      ${isLocked ? s.sideLessonLocked : ""}
                    `}
                    onClick={() => !isLocked && goTo(lesson)}
                    disabled={isLocked}
                  >
                    <span
                      className={s.sideLessonIco}
                      style={isCur ? { color: lm.color, background: lm.color + "22" } : {}}
                    >
                      {isLocked
                        ? <LockFilled style={{ fontSize: 10, opacity: 0.4 }} />
                        : isDone
                          ? <CheckCircleFilled style={{ color: "#34d399" }} />
                          : lm.icon
                      }
                    </span>
                    <div className={s.sideLessonInfo}>
                      <span className={s.sideLessonTitle}>{lesson.title}</span>
                      {lesson.duration && (
                        <span className={s.sideLessonDur}>{lesson.duration}</span>
                      )}
                    </div>
                    {lesson.isFree && !isCur && (
                      <Tag color="green" style={{ fontSize: 9, padding: "0 4px", lineHeight: "16px" }}>
                        Free
                      </Tag>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className={s.main}>

        {/* Top bar */}
        <header className={s.topBar}>
          <button className={s.toggleBtn} onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          </button>

          <div className={s.breadcrumb}>
            <Link to={`/courses/${courseId}`} className={s.breadLink}>
              {course?.title}
            </Link>
            <span className={s.breadSep}>/</span>
            <span className={s.breadCurrent}>{currentLesson.section}</span>
          </div>

          <div className={s.topNav}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              disabled={!prevLesson}
              onClick={() => prevLesson && goTo(prevLesson)}
              className={s.topNavBtn}
            >
              Пред.
            </Button>
            <Button
              type="text"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              disabled={!nextLesson}
              onClick={() => nextLesson && goTo(nextLesson)}
              className={s.topNavBtn}
            >
              След.
            </Button>
          </div>
        </header>

        {/* Lesson header */}
        <div className={s.lessonHeader}>
          <div className={s.lessonTypeBadge} style={{ color: meta.color, background: meta.color + "18" }}>
            {meta.icon}
            <span>{meta.label}</span>
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

        {/* Bottom bar */}
        <div className={s.bottomBar}>
          <div className={s.bottomPrev}>
            {prevLesson && (
              <button className={s.bottomNavBtn} onClick={() => goTo(prevLesson)}>
                <ArrowLeftOutlined />
                <div>
                  <small>Предыдущий</small>
                  <span>{prevLesson.title}</span>
                </div>
              </button>
            )}
          </div>

          <div className={s.bottomCenter}>
            {isCompleted ? (
              <div className={s.doneChip}>
                <CheckCircleFilled style={{ color: "#34d399" }} />
                Урок пройден
              </div>
            ) : (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="large"
                loading={marking}
                onClick={() => markComplete({ variables: { lessonId: currentLesson.id } })}
                style={{ background: "#6c63ff", borderColor: "#6c63ff", borderRadius: 10 }}
              >
                Отметить пройденным
              </Button>
            )}
          </div>

          <div className={s.bottomNext}>
            {nextLesson ? (
              <button className={`${s.bottomNavBtn} ${s.bottomNavBtnNext}`} onClick={() => goTo(nextLesson)}>
                <div>
                  <small>Следующий</small>
                  <span>{nextLesson.title}</span>
                </div>
                <ArrowRightOutlined />
              </button>
            ) : allDone ? (
              <div className={s.finishChip}>
                <TrophyOutlined style={{ color: "#f59e0b" }} />
                Курс завершён!
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;