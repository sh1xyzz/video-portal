// src/pages/Admin/Admin.jsx
// ✅ GET_COURSES — только поля которые ТОЧНО есть в схеме (без subtitle/description)
// ✅ Отображает ошибку GraphQL если запрос падает
// ✅ toSlug импортируется из courseUtils.js

import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  VideoCameraOutlined, BookOutlined, FileTextOutlined,
  CodeOutlined, CheckCircleFilled, CloseCircleFilled,
  SaveOutlined, EyeOutlined, CloseOutlined,
  LinkOutlined, GlobalOutlined,
  BookFilled, TrophyFilled,
} from "@ant-design/icons";
import s from "./Admin.module.css";
import { toSlug } from "../CoursesView/courseUtils";

// ── GraphQL ───────────────────────────────────────────────────────────────────
// ⚠️  Только поля гарантированно присутствующие в схеме.
//     Если после этого список всё ещё пустой — открой DevTools → Network →
//     найди запрос allCourses и посмотри что возвращает сервер.

const GET_COURSES = gql`
  query {
    allCourses {
      id
      title
      instructor
      avatar
      level
      category
      tag
      tagColor
      thumb
      isFree
      price
    }
  }
`;

const GET_COURSE_DETAIL = gql`
  query GetCourseDetail($id: Int!) {
    courseDetail(id: $id) {
      id
      title
      totalLessons
      lessons {
        id
        section
        title
        type
        duration
        isFree
        order
        contentUrl
        content
        completed
      }
    }
  }
`;

const CREATE_LESSON = gql`
  mutation CreateLesson($input: LessonInput!) {
    createLesson(input: $input) { id title section type order }
  }
`;

const CREATE_COURSE = gql`
  mutation CreateCourse($input: CourseInput!) {
    createCourse(input: $input) { id title instructor }
  }
`;

const UPDATE_LESSON = gql`
  mutation UpdateLesson($id: Int!, $input: LessonInput!) {
    updateLesson(id: $id, input: $input) { id title section type order contentUrl content }
  }
`;

const DELETE_LESSON = gql`
  mutation DeleteLesson($id: Int!) {
    deleteLesson(id: $id)
  }
`;

// ── Константы ─────────────────────────────────────────────────────────────────

const TYPE_META = {
  video:        { icon: <VideoCameraOutlined />, label: "Видео",       color: "#6c63ff" },
  theory:       { icon: <BookOutlined />,        label: "Теория",      color: "#43e97b" },
  presentation: { icon: <FileTextOutlined />,    label: "Презентация", color: "#60a5fa" },
  task:         { icon: <CodeOutlined />,         label: "Задание",     color: "#f59e0b" },
};

const EMPTY_LESSON = {
  section: "", title: "", type: "video",
  duration: "", contentUrl: "", content: "", isFree: false, order: 1,
};

const EMPTY_COURSE = {
  title: "", instructor: "", avatar: "", level: "Beginner",
  category: "", tag: "", tagColor: "#6c63ff", thumb: "",
  price: "$49", isFree: false,
};

// ── Превью контента ───────────────────────────────────────────────────────────

const ContentPreview = ({ type, url, content, onClose }) => (
  <div className={s.previewBackdrop} onClick={onClose}>
    <div className={s.previewBox} onClick={e => e.stopPropagation()}>
      <button className={s.previewClose} onClick={onClose}><CloseOutlined /></button>
      {(type === "video" || type === "presentation") && url ? (
        <iframe src={url} className={s.previewIframe} allow="autoplay; fullscreen" allowFullScreen title="preview" />
      ) : (
        <div className={s.previewText}><pre>{content || "Контент не добавлен"}</pre></div>
      )}
    </div>
  </div>
);

// ── Форма урока ───────────────────────────────────────────────────────────────

const LessonForm = ({ courseId, initial, nextOrder, onSave, onCancel, isEdit = false }) => {
  const [form, setForm] = useState(
    initial ? { ...initial, isFree: initial.isFree ?? false }
            : { ...EMPTY_LESSON, order: nextOrder }
  );
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState(false);

  const [createLesson] = useMutation(CREATE_LESSON, {
    refetchQueries: [{ query: GET_COURSE_DETAIL, variables: { id: courseId } }],
  });
  const [updateLesson] = useMutation(UPDATE_LESSON, {
    refetchQueries: [{ query: GET_COURSE_DETAIL, variables: { id: courseId } }],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.section.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateLesson({ variables: { id: initial.id, input: { courseId, ...form } } });
      } else {
        await createLesson({ variables: { input: { courseId, ...form } } });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.lessonForm}>
      {preview && (
        <ContentPreview type={form.type} url={form.contentUrl} content={form.content}
          onClose={() => setPreview(false)} />
      )}

      <div className={s.formHeader}>
        <span className={s.formHeaderTitle}>{isEdit ? "✏️ Редактировать урок" : "✨ Новый урок"}</span>
        <button className={s.formHeaderClose} onClick={onCancel}><CloseOutlined /></button>
      </div>

      <div className={s.formRow}>
        <div className={s.formGroup} style={{ flex: 1 }}>
          <label className={s.formLabel}>Секция</label>
          <input className={s.formInput} placeholder="Getting Started"
            value={form.section} onChange={e => set("section", e.target.value)} />
        </div>
        <div className={s.formGroup} style={{ flex: 2 }}>
          <label className={s.formLabel}>Название урока</label>
          <input className={s.formInput} placeholder="Введение в React"
            value={form.title} onChange={e => set("title", e.target.value)} />
        </div>
      </div>

      <div className={s.formRow}>
        <div className={s.formGroup} style={{ flex: 3 }}>
          <label className={s.formLabel}>Тип урока</label>
          <div className={s.typeButtons}>
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <button key={type}
                className={`${s.typeBtn} ${form.type === type ? s.typeBtnActive : ""}`}
                style={form.type === type ? { borderColor: meta.color, color: meta.color, background: meta.color + "20" } : {}}
                onClick={() => set("type", type)}>
                {meta.icon} {meta.label}
              </button>
            ))}
          </div>
        </div>
        <div className={s.formGroup}>
          <label className={s.formLabel}>Длительность</label>
          <input className={s.formInput} placeholder="12:40"
            value={form.duration} onChange={e => set("duration", e.target.value)} />
        </div>
        <div className={s.formGroup} style={{ maxWidth: 90 }}>
          <label className={s.formLabel}>Порядок</label>
          <input className={s.formInput} type="number"
            value={form.order} onChange={e => set("order", parseInt(e.target.value) || 1)} />
        </div>
      </div>

      {form.type === "video" && (
        <div className={s.formGroup}>
          <label className={s.formLabel}><LinkOutlined /> YouTube Embed URL</label>
          <input className={s.formInput} placeholder="https://www.youtube.com/embed/VIDEO_ID"
            value={form.contentUrl} onChange={e => set("contentUrl", e.target.value)} />
          <p className={s.formHint}>
            YouTube → Поделиться → Встроить → скопируй src из iframe<br />
            Пример: <code>https://www.youtube.com/embed/8hly31xKli0</code>
          </p>
          {form.contentUrl && (
            <button className={s.previewBtn} onClick={() => setPreview(true)}>
              <EyeOutlined /> Предпросмотр
            </button>
          )}
        </div>
      )}

      {form.type === "presentation" && (
        <div className={s.formGroup}>
          <label className={s.formLabel}><GlobalOutlined /> Google Slides / PDF Embed URL</label>
          <input className={s.formInput}
            placeholder="https://docs.google.com/presentation/d/ID/embed"
            value={form.contentUrl} onChange={e => set("contentUrl", e.target.value)} />
          <div className={s.formHintBox}>
            <p className={s.formHintTitle}>📋 Как получить ссылку Google Slides:</p>
            <ol className={s.formHintList}>
              <li>Открой презентацию в Google Slides</li>
              <li>Файл → Поделиться → Опубликовать в интернете</li>
              <li>Вкладка «Встроить» → скопируй src из iframe</li>
            </ol>
          </div>
          {form.contentUrl && (
            <button className={s.previewBtn} onClick={() => setPreview(true)}>
              <EyeOutlined /> Предпросмотр
            </button>
          )}
        </div>
      )}

      {form.type === "theory" && (
        <div className={s.formGroup}>
          <label className={s.formLabel}><BookOutlined /> Текст урока</label>
          <textarea className={s.formTextarea} rows={8}
            placeholder="Введите текст теории..."
            value={form.content} onChange={e => set("content", e.target.value)} />
          <p className={s.formHint}>{form.content.length}/10000 символов</p>
        </div>
      )}

      {form.type === "task" && (
        <>
          <div className={s.formGroup}>
            <label className={s.formLabel}><CodeOutlined /> Описание задания</label>
            <textarea className={s.formTextarea} rows={6}
              placeholder="Опишите что нужно сделать студенту..."
              value={form.content} onChange={e => set("content", e.target.value)} />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Ссылка на ресурс (необязательно)</label>
            <input className={s.formInput} placeholder="https://github.com/..."
              value={form.contentUrl} onChange={e => set("contentUrl", e.target.value)} />
          </div>
        </>
      )}

      <label className={s.checkLabel}>
        <input type="checkbox" checked={form.isFree} onChange={e => set("isFree", e.target.checked)} />
        <span>Бесплатный превью (виден всем без записи)</span>
      </label>

      <div className={s.formActions}>
        <button className={s.cancelBtn} onClick={onCancel}>Отмена</button>
        <button className={s.saveBtn} onClick={handleSave}
          disabled={saving || !form.section.trim() || !form.title.trim()}>
          <SaveOutlined /> {saving ? "Сохраняем…" : isEdit ? "Обновить урок" : "Сохранить урок"}
        </button>
      </div>
    </div>
  );
};

// ── Форма создания курса ──────────────────────────────────────────────────────

const CourseForm = ({ onSave, onCancel }) => {
  const [form, setForm] = useState(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);

  const [createCourse] = useMutation(CREATE_COURSE, {
    refetchQueries: [{ query: GET_COURSES }],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.instructor.trim()) return;
    setSaving(true);
    try {
      await createCourse({ variables: { input: { ...form } } });
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.courseFormOverlay} onClick={onCancel}>
      <div className={s.courseFormBox} onClick={e => e.stopPropagation()}>
        <div className={s.formHeader}>
          <span className={s.formHeaderTitle}>🎓 Новый курс</span>
          <button className={s.formHeaderClose} onClick={onCancel}><CloseOutlined /></button>
        </div>
        <div className={s.courseFormScroll}>
          <div className={s.formRow}>
            <div className={s.formGroup} style={{ flex: 2 }}>
              <label className={s.formLabel}>Название курса *</label>
              <input className={s.formInput} placeholder="React & Next.js Mastery"
                value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Категория</label>
              <input className={s.formInput} placeholder="Web Development"
                value={form.category} onChange={e => set("category", e.target.value)} />
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Инструктор *</label>
              <input className={s.formInput} placeholder="Marcus Lee"
                value={form.instructor} onChange={e => set("instructor", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Аватар (инициалы)</label>
              <input className={s.formInput} placeholder="ML" maxLength={3}
                value={form.avatar} onChange={e => set("avatar", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Уровень</label>
              <select className={s.formSelect} value={form.level} onChange={e => set("level", e.target.value)}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup} style={{ flex: 2 }}>
              <label className={s.formLabel}>URL обложки</label>
              <input className={s.formInput} placeholder="https://images.unsplash.com/..."
                value={form.thumb} onChange={e => set("thumb", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Тег (бейдж)</label>
              <input className={s.formInput} placeholder="Bestseller"
                value={form.tag} onChange={e => set("tag", e.target.value)} />
            </div>
            <div className={s.formGroup} style={{ maxWidth: 120 }}>
              <label className={s.formLabel}>Цвет тега</label>
              <input type="color" className={`${s.formInput} ${s.formInputColor}`}
                value={form.tagColor} onChange={e => set("tagColor", e.target.value)} />
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Цена</label>
              <input className={s.formInput} placeholder="$49"
                value={form.price} onChange={e => set("price", e.target.value)} />
            </div>
          </div>
          <label className={s.checkLabel}>
            <input type="checkbox" checked={form.isFree} onChange={e => set("isFree", e.target.checked)} />
            <span>Бесплатный курс</span>
          </label>
        </div>
        <div className={s.formActions}>
          <button className={s.cancelBtn} onClick={onCancel}>Отмена</button>
          <button className={s.saveBtn} onClick={handleSave}
            disabled={saving || !form.title.trim() || !form.instructor.trim()}>
            <SaveOutlined /> {saving ? "Создаём…" : "Создать курс"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Редактор уроков ───────────────────────────────────────────────────────────

const CourseEditor = ({ courseId, courseTitle, onBack }) => {
  const [showForm, setShowForm]     = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [deleting, setDeleting]     = useState(null);

  const { data, loading } = useQuery(GET_COURSE_DETAIL, {
    variables: { id: courseId },
    fetchPolicy: "cache-and-network",
  });

  const [deleteLesson] = useMutation(DELETE_LESSON, {
    refetchQueries: [{ query: GET_COURSE_DETAIL, variables: { id: courseId } }],
  });

  const course    = data?.courseDetail;
  const lessons   = course?.lessons ?? [];
  const nextOrder = lessons.length + 1;

  const sections = (() => {
    const map = new Map();
    for (const l of [...lessons].sort((a, b) => a.order - b.order)) {
      if (!map.has(l.section)) map.set(l.section, []);
      map.get(l.section).push(l);
    }
    return Array.from(map.entries());
  })();

  const handleDelete = async (id) => {
    setDeleting(id);
    await deleteLesson({ variables: { id } });
    setDeleting(null);
  };

  return (
    <div className={s.editor}>
      <div className={s.editorHeader}>
        <button className={s.backLink} onClick={onBack}>← Все курсы</button>
        <div className={s.editorTitle}>
          <h2>{courseTitle}</h2>
          <span className={s.editorMeta}>{lessons.length} уроков</span>
        </div>
        <button className={s.addBtn} onClick={() => { setShowForm(v => !v); setEditLesson(null); }}>
          <PlusOutlined /> Добавить урок
        </button>
      </div>

      <div className={s.slugInfo}>
        <LinkOutlined />
        <span>URL курса: <code>/courses/{toSlug(courseTitle)}</code></span>
      </div>

      {showForm && !editLesson && (
        <LessonForm courseId={courseId} nextOrder={nextOrder}
          onSave={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
      )}
      {editLesson && (
        <LessonForm courseId={courseId} initial={editLesson} nextOrder={nextOrder} isEdit
          onSave={() => setEditLesson(null)} onCancel={() => setEditLesson(null)} />
      )}

      {loading && !course && (
        <div className={s.loading}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={s.skRow} />)}
        </div>
      )}

      {!loading && lessons.length === 0 && !showForm && (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📚</div>
          <p>Уроков пока нет. Добавь первый!</p>
          <button className={s.addBtn} onClick={() => setShowForm(true)}>
            <PlusOutlined /> Добавить первый урок
          </button>
        </div>
      )}

      <div className={s.sectionList}>
        {sections.map(([secName, secLessons]) => (
          <div key={secName} className={s.sectionBlock}>
            <div className={s.sectionHeader}>
              <span className={s.sectionName}>{secName}</span>
              <span className={s.sectionCount}>{secLessons.length} уроков</span>
            </div>
            {secLessons.map(lesson => {
              const meta = TYPE_META[lesson.type] ?? TYPE_META.theory;
              const hasContent = !!(lesson.contentUrl || lesson.content);
              return (
                <div key={lesson.id} className={s.lessonRow}>
                  <span className={s.lessonNum}>{lesson.order}</span>
                  <span className={s.lessonTypeIcon} style={{ color: meta.color, background: meta.color + "18" }}>
                    {meta.icon}
                  </span>
                  <div className={s.lessonInfo}>
                    <span className={s.lessonTitle}>{lesson.title}</span>
                    <span className={s.lessonMeta}>
                      {meta.label}
                      {lesson.duration && ` · ${lesson.duration}`}
                      {lesson.isFree && <span className={s.freeBadge}>Preview</span>}
                    </span>
                  </div>
                  <div className={s.lessonStatus}>
                    {hasContent
                      ? <span className={s.hasContent}><CheckCircleFilled /> Контент</span>
                      : <span className={s.noContent}><CloseCircleFilled /> Пусто</span>}
                  </div>
                  <div className={s.lessonActions}>
                    <button className={s.actionBtn}
                      onClick={() => { setEditLesson(lesson); setShowForm(false); }}>
                      <EditOutlined />
                    </button>
                    <button className={`${s.actionBtn} ${s.actionBtnDanger}`}
                      onClick={() => handleDelete(lesson.id)} disabled={deleting === lesson.id}>
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Карточка курса ────────────────────────────────────────────────────────────

const CourseCard = ({ course, onClick }) => (
  <div className={s.courseCard} onClick={onClick}>
    <div className={s.courseThumb}>
      <img
        src={course.thumb || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=70"}
        alt={course.title}
      />
      {course.tag && (
        <span className={s.courseTag} style={{ background: course.tagColor }}>{course.tag}</span>
      )}
    </div>
    <div className={s.courseInfo}>
      <span className={s.courseCat}>{course.category}</span>
      <h3 className={s.courseTitle}>{course.title}</h3>
      <p className={s.courseInstructor}>{course.instructor}</p>
    </div>
    <div className={s.courseActions}>
      <div className={s.courseActionLeft}>
        <span className={s.courseLevel}>{course.level}</span>
        <span className={s.courseSlug}>/courses/{toSlug(course.title)}</span>
      </div>
      <button className={s.editBtn}><EditOutlined /> Уроки</button>
    </div>
  </div>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar = ({ activeNav, setActiveNav }) => (
  <aside className={s.sidebar}>
    <div className={s.sidebarLogo}>
      <span className={s.logoIcon}>⚡</span>
      <span className={s.logoText}>EduAdmin</span>
    </div>
    <nav className={s.nav}>
      {[
        { key: "courses", icon: <BookFilled />,   label: "Курсы" },
        { key: "stats",   icon: <TrophyFilled />, label: "Статистика" },
      ].map(item => (
        <button key={item.key}
          className={`${s.navItem} ${activeNav === item.key ? s.navItemActive : ""}`}
          onClick={() => setActiveNav(item.key)}>
          {item.icon} {item.label}
        </button>
      ))}
    </nav>
    <div className={s.sidebarFooter}>
      <a href="/" className={s.siteLink}>← На сайт</a>
    </div>
  </aside>
);

// ── Главный компонент ─────────────────────────────────────────────────────────

const Admin = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [activeNav, setActiveNav]           = useState("courses");

  const { data, loading, error } = useQuery(GET_COURSES, {
    fetchPolicy: "cache-and-network",
  });
  const courses = data?.allCourses ?? [];

  if (selectedCourse) {
    return (
      <div className={s.root}>
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
        <main className={s.main}>
          <CourseEditor courseId={selectedCourse.id} courseTitle={selectedCourse.title}
            onBack={() => setSelectedCourse(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className={s.root}>
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
      <main className={s.main}>
        <div className={s.mainHeader}>
          <div>
            <h1 className={s.mainTitle}>Управление курсами</h1>
            <p className={s.mainSub}>Выбери курс чтобы добавить уроки</p>
          </div>
          <div className={s.headerRight}>
            <div className={s.stats}>
              <div className={s.stat}>
                <span className={s.statVal}>{courses.length}</span>
                <span className={s.statLabel}>Курсов</span>
              </div>
            </div>
            <button className={s.newCourseBtn} onClick={() => setShowCourseForm(true)}>
              <PlusOutlined /> Новый курс
            </button>
          </div>
        </div>

        {error && (
          <div className={s.errorBox}>
            <p>⚠️ GraphQL ошибка: <code>{error.message}</code></p>
            <p style={{ fontSize: 11, marginTop: 4, opacity: .6 }}>
              Открой DevTools → Console — там будет точная причина.
            </p>
          </div>
        )}

        {showCourseForm && (
          <CourseForm onSave={() => setShowCourseForm(false)} onCancel={() => setShowCourseForm(false)} />
        )}

        {loading && (
          <div className={s.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={s.skCard}>
                <div className={s.skThumb} />
                <div className={s.skBody}>
                  <div className={s.skLine} style={{ width: "40%" }} />
                  <div className={s.skLine} style={{ width: "75%", height: 16 }} />
                  <div className={s.skLine} style={{ width: "55%" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>📂</div>
            <p>Курсов пока нет. Создай первый!</p>
          </div>
        )}

        {!loading && courses.length > 0 && (
          <div className={s.grid}>
            {courses.map(course => (
              <CourseCard key={course.id} course={course}
                onClick={() => setSelectedCourse({ id: course.id, title: course.title })} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;