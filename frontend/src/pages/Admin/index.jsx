// src/pages/Admin/Admin.jsx — fully antd

import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  VideoCameraOutlined, BookOutlined, FileTextOutlined,
  CodeOutlined, CheckCircleFilled, CloseCircleFilled,
  SaveOutlined, EyeOutlined, CloseOutlined,
  LinkOutlined, GlobalOutlined,
  BookFilled, TrophyFilled, ThunderboltFilled,
  TeamOutlined, UserOutlined, CrownFilled,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  Select, Input, InputNumber, Tag, Button, Checkbox,
  Tooltip, Badge, Spin, Empty, Switch,
} from "antd";
import s from "./Admin.module.css";
import useAuthStore from "@/shared/store/useAuthStore";
import { toSlug } from "../CoursesView/courseUtils";

const { Option } = Select;
const { TextArea } = Input;

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_COURSES = gql`
  query { allCourses { id title instructor avatar level category tag tagColor thumb isFree price coinPrice ownerId } }
`;

const GET_COURSE_DETAIL = gql`
  query GetCourseDetail($id: Int!) {
    courseDetail(id: $id) {
      id title totalLessons
      lessons { id section title type duration isFree order contentUrl content completed }
    }
  }
`;

const GET_ALL_USERS = gql`
  query { allUsers { id name email role avatar createdAt isBanned } }
`;

const SET_USER_ROLE = gql`
  mutation SetUserRole($userId: Int!, $role: String!) {
    setUserRole(userId: $userId, role: $role) { userId role }
  }
`;

const CREATE_LESSON = gql`
  mutation CreateLesson($input: LessonInput!) {
    createLesson(input: $input) { id title section type order }
  }
`;

const CREATE_COURSE = gql`
  mutation CreateCourse($input: CourseInput!) {
    createCourse(input: $input) { id title instructor coinPrice }
  }
`;

const UPDATE_LESSON = gql`
  mutation UpdateLesson($id: Int!, $input: LessonInput!) {
    updateLesson(id: $id, input: $input) { id title section type order contentUrl content }
  }
`;

const DELETE_LESSON = gql`
  mutation DeleteLesson($id: Int!) { deleteLesson(id: $id) }
`;

const DELETE_COURSE = gql`
  mutation DeleteCourse($courseId: Int!) { deleteCourse(courseId: $courseId) }
`;

const BAN_USER = gql`
  mutation BanUser($userId: Int!) { banUser(userId: $userId) { userId isBanned } }
`;

const UNBAN_USER = gql`
  mutation UnbanUser($userId: Int!) { unbanUser(userId: $userId) { userId isBanned } }
`;

const DELETE_USER = gql`
  mutation DeleteUser($userId: Int!) { deleteUser(userId: $userId) }
`;

// ── Константы ─────────────────────────────────────────────────────────────────

const TYPE_META = {
  video:        { icon: <VideoCameraOutlined />, label: "Видео",       color: "#818cf8", tagColor: "purple"  },
  theory:       { icon: <BookOutlined />,        label: "Теория",      color: "#34d399", tagColor: "green"   },
  presentation: { icon: <FileTextOutlined />,    label: "Презентация", color: "#60a5fa", tagColor: "blue"    },
  task:         { icon: <CodeOutlined />,         label: "Задание",    color: "#fb923c", tagColor: "orange"  },
};

const ROLES = [
  { value: "student",   label: "Student",   color: "#64748b", tagColor: "default" },
  { value: "assistant", label: "Assistant", color: "#60a5fa", tagColor: "blue"    },
  { value: "teacher",   label: "Teacher",   color: "#a89eff", tagColor: "purple"  },
  { value: "admin",     label: "Admin",     color: "#f87171", tagColor: "red"     },
];
const getRoleMeta = (role) => ROLES.find(r => r.value === role) ?? ROLES[0];

const EMPTY_LESSON  = { section: "", title: "", type: "video", duration: "", contentUrl: "", content: "", isFree: false, order: 1 };
const EMPTY_COURSE  = { title: "", instructor: "", avatar: "", level: "Beginner", category: "", tag: "", tagColor: "#6c63ff", thumb: "", isFree: false, coinPrice: 0 };

// ── Preview ───────────────────────────────────────────────────────────────────

const ContentPreview = ({ type, url, content, onClose }) => (
  <div className={s.previewBackdrop} onClick={onClose}>
    <div className={s.previewBox} onClick={e => e.stopPropagation()}>
      <Button type="text" icon={<CloseOutlined />} className={s.previewClose} onClick={onClose} />
      {(type === "video" || type === "presentation") && url
        ? <iframe src={url} className={s.previewIframe} allow="autoplay; fullscreen" allowFullScreen title="preview" />
        : <div className={s.previewText}><pre>{content || "Контент не добавлен"}</pre></div>
      }
    </div>
  </div>
);

// ── Lesson Form ───────────────────────────────────────────────────────────────

const LessonForm = ({ courseId, initial, nextOrder, onSave, onCancel, isEdit = false }) => {
  const [form, setForm] = useState(
    initial ? { ...initial, isFree: initial.isFree ?? false }
            : { ...EMPTY_LESSON, order: nextOrder }
  );
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const [createLesson] = useMutation(CREATE_LESSON, { refetchQueries: [{ query: GET_COURSE_DETAIL, variables: { id: courseId } }] });
  const [updateLesson] = useMutation(UPDATE_LESSON, { refetchQueries: [{ query: GET_COURSE_DETAIL, variables: { id: courseId } }] });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.section.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      if (isEdit) await updateLesson({ variables: { id: initial.id, input: { courseId, ...form } } });
      else        await createLesson({ variables: { input: { courseId, ...form } } });
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className={s.lessonForm}>
      {preview && <ContentPreview type={form.type} url={form.contentUrl} content={form.content} onClose={() => setPreview(false)} />}

      <div className={s.formHeader}>
        <span className={s.formHeaderTitle}>{isEdit ? "✏️ Редактировать урок" : "✨ Новый урок"}</span>
        <Button type="text" icon={<CloseOutlined />} onClick={onCancel} size="small" />
      </div>

      <div className={s.formBody}>
        {/* Row 1: section + title */}
        <div className={s.formRow}>
          <div className={s.formGroup} style={{ flex: 1 }}>
            <label className={s.formLabel}>Секция</label>
            <Input placeholder="Getting Started" value={form.section} onChange={e => set("section", e.target.value)} />
          </div>
          <div className={s.formGroup} style={{ flex: 2 }}>
            <label className={s.formLabel}>Название урока</label>
            <Input placeholder="Введение в React" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>
        </div>

        {/* Row 2: type + duration + order */}
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
            <Input placeholder="12:40" value={form.duration} onChange={e => set("duration", e.target.value)} />
          </div>
          <div className={s.formGroup} style={{ maxWidth: 100 }}>
            <label className={s.formLabel}>Порядок</label>
            <InputNumber min={1} value={form.order} onChange={v => set("order", v || 1)} style={{ width: "100%" }} />
          </div>
        </div>

        {/* Type-specific fields */}
        {form.type === "video" && (
          <div className={s.formGroup}>
            <label className={s.formLabel}><LinkOutlined /> YouTube Embed URL</label>
            <Input placeholder="https://www.youtube.com/embed/VIDEO_ID" value={form.contentUrl} onChange={e => set("contentUrl", e.target.value)} />
            <p className={s.formHint}>YouTube → Поделиться → Встроить → скопируй src из iframe</p>
            {form.contentUrl && (
              <Button icon={<EyeOutlined />} size="small" onClick={() => setPreview(true)} style={{ marginTop: 6 }}>Предпросмотр</Button>
            )}
          </div>
        )}

        {form.type === "presentation" && (
          <div className={s.formGroup}>
            <label className={s.formLabel}><GlobalOutlined /> Google Slides / PDF Embed URL</label>
            <Input placeholder="https://docs.google.com/presentation/d/ID/embed" value={form.contentUrl} onChange={e => set("contentUrl", e.target.value)} />
            <p className={s.formHint}>Google Slides → Файл → Опубликовать → Встроить → скопируй src из iframe</p>
            {form.contentUrl && (
              <Button icon={<EyeOutlined />} size="small" onClick={() => setPreview(true)} style={{ marginTop: 6 }}>Предпросмотр</Button>
            )}
          </div>
        )}

        {form.type === "theory" && (
          <div className={s.formGroup}>
            <label className={s.formLabel}><BookOutlined /> Текст урока (поддерживает markdown)</label>
            <TextArea rows={8} placeholder="## Введение&#10;Текст теории..." value={form.content} onChange={e => set("content", e.target.value)} showCount maxLength={10000} />
            <p className={s.formHint}>Поддерживается: ## заголовки, **bold**, `код`, {'>'} цитаты, - списки, ```блоки кода```</p>
          </div>
        )}

        {form.type === "task" && (
          <>
            <div className={s.formGroup}>
              <label className={s.formLabel}><CodeOutlined /> Описание задания + авто-проверки</label>
              <TextArea rows={10}
                placeholder={`Напиши функцию add(a, b) которая возвращает сумму двух чисел.\n\n## Пример\nadd(2, 3) должна вернуть 5\n\n[CHECK] Функция существует: if (typeof add !== 'function') throw new Error('Нет функции add')\n[CHECK] Возвращает сумму: if (add(2, 3) !== 5) throw new Error('add(2,3) должна вернуть 5')\n[CHECK] Отрицательные числа: if (add(-1, 1) !== 0) throw new Error('add(-1,1) должна вернуть 0')`}
                value={form.content}
                onChange={e => set("content", e.target.value)}
              />
              <div className={s.taskHintBox}>
                <p className={s.taskHintTitle}>💡 Как добавить авто-проверки</p>
                <p className={s.taskHintText}>Добавь в конец описания строки в формате:</p>
                <code className={s.taskHintCode}>[CHECK] Название теста: JS-код который бросает ошибку если тест не прошёл</code>
                <p className={s.taskHintText} style={{ marginTop: 8 }}>Пример:</p>
                <code className={s.taskHintCode}>{"[CHECK] Функция объявлена: if (typeof add !== 'function') throw new Error('нет')"}</code>
                <code className={s.taskHintCode}>{"[CHECK] add(2,3) === 5: if (add(2,3) !== 5) throw new Error('неверно')"}</code>
              </div>
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Язык программирования</label>
              <Select value={form.contentUrl || "javascript"} onChange={v => set("contentUrl", v)} style={{ width: 200 }}>
                <Option value="javascript">JavaScript</Option>
                <Option value="python">Python</Option>
                <Option value="html">HTML</Option>
              </Select>
              <p className={s.formHint}>Определяет язык в редакторе студента и синтаксис проверок</p>
            </div>
          </>
        )}

        <Checkbox checked={form.isFree} onChange={e => set("isFree", e.target.checked)}>
          Бесплатный превью (виден всем без записи)
        </Checkbox>
      </div>

      <div className={s.formActions}>
        <Button onClick={onCancel}>Отмена</Button>
        <Button type="primary" icon={<SaveOutlined />} loading={saving}
          disabled={!form.section.trim() || !form.title.trim()}
          onClick={handleSave}
          style={{ background: "#6c63ff", borderColor: "#6c63ff" }}>
          {isEdit ? "Обновить урок" : "Сохранить урок"}
        </Button>
      </div>
    </div>
  );
};

// ── Course Form ───────────────────────────────────────────────────────────────

const CourseForm = ({ onSave, onCancel }) => {
  const [form, setForm] = useState(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);

  const [createCourse] = useMutation(CREATE_COURSE, { refetchQueries: [{ query: GET_COURSES }] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.instructor.trim()) return;
    setSaving(true);
    try {
      await createCourse({ variables: { input: {
        title: form.title, instructor: form.instructor,
        avatar: form.avatar || null, level: form.level,
        category: form.category || null, tag: form.tag || null,
        tagColor: form.tagColor, thumb: form.thumb || null,
        isFree: form.isFree,
        coinPrice: form.isFree ? 0 : parseInt(form.coinPrice) || 0,
        price: form.isFree ? "Free" : `${form.coinPrice} 🪙`,
      }}});
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className={s.courseFormOverlay} onClick={onCancel}>
      <div className={s.courseFormBox} onClick={e => e.stopPropagation()}>
        <div className={s.formHeader}>
          <span className={s.formHeaderTitle}>🎓 Новый курс</span>
          <Button type="text" icon={<CloseOutlined />} onClick={onCancel} size="small" />
        </div>
        <div className={s.courseFormScroll}>
          <div className={s.formRow}>
            <div className={s.formGroup} style={{ flex: 2 }}>
              <label className={s.formLabel}>Название курса *</label>
              <Input placeholder="React & Next.js Mastery" value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Категория</label>
              <Input placeholder="Web Development" value={form.category} onChange={e => set("category", e.target.value)} />
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Инструктор *</label>
              <Input placeholder="Marcus Lee" value={form.instructor} onChange={e => set("instructor", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Аватар (инициалы)</label>
              <Input placeholder="ML" maxLength={3} value={form.avatar} onChange={e => set("avatar", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Уровень</label>
              <Select value={form.level} onChange={v => set("level", v)} style={{ width: "100%" }}>
                <Option value="Beginner">Beginner</Option>
                <Option value="Intermediate">Intermediate</Option>
                <Option value="Advanced">Advanced</Option>
              </Select>
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup} style={{ flex: 2 }}>
              <label className={s.formLabel}>URL обложки</label>
              <Input placeholder="https://images.unsplash.com/..." value={form.thumb} onChange={e => set("thumb", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Тег (бейдж)</label>
              <Input placeholder="Bestseller" value={form.tag} onChange={e => set("tag", e.target.value)} />
            </div>
            <div className={s.formGroup} style={{ maxWidth: 120 }}>
              <label className={s.formLabel}>Цвет тега</label>
              <input type="color" className={`${s.formInputColor}`} value={form.tagColor} onChange={e => set("tagColor", e.target.value)} />
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup} style={{ flex: 1 }}>
              <label className={s.formLabel}><ThunderboltFilled style={{ color: "#6c63ff", marginRight: 6 }} />Цена в EduCoins</label>
              <Input.Group compact>
                <InputNumber min={0} step={10} placeholder="0" value={form.coinPrice}
                  onChange={v => set("coinPrice", v)}
                  disabled={form.isFree}
                  style={{ width: "calc(100% - 100px)", opacity: form.isFree ? 0.4 : 1 }} />
                <Input value="🪙 EduCoins" disabled style={{ width: 100 }} />
              </Input.Group>
              <p className={s.formHint}>
                {form.isFree ? "Курс бесплатный" : form.coinPrice > 0 ? `Студент потратит ${form.coinPrice} EduCoins` : "0 = бесплатный доступ"}
              </p>
            </div>
          </div>
          <Checkbox checked={form.isFree} onChange={e => { set("isFree", e.target.checked); if (e.target.checked) set("coinPrice", 0); }}>
            Бесплатный курс (coinPrice = 0)
          </Checkbox>
        </div>
        <div className={s.formActions}>
          <Button onClick={onCancel}>Отмена</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving}
            disabled={!form.title.trim() || !form.instructor.trim()}
            onClick={handleSave}
            style={{ background: "#6c63ff", borderColor: "#6c63ff" }}>
            Создать курс
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Users Tab ─────────────────────────────────────────────────────────────────

const UsersTab = ({ currentUser }) => {
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [saving, setSaving]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, loading, refetch } = useQuery(GET_ALL_USERS, { fetchPolicy: "cache-and-network" });
  const [setUserRole]  = useMutation(SET_USER_ROLE,  { onCompleted: () => refetch() });
  const [banUser]      = useMutation(BAN_USER,        { onCompleted: () => refetch() });
  const [unbanUser]    = useMutation(UNBAN_USER,       { onCompleted: () => refetch() });
  const [deleteUser]   = useMutation(DELETE_USER,      { onCompleted: () => refetch() });

  const users    = data?.allUsers ?? [];
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filterRole === "all" || u.role === filterRole);
  });

  const handleRoleChange = async (userId, newRole) => {
    setSaving(`role-${userId}`);
    try { await setUserRole({ variables: { userId, role: newRole } }); }
    finally { setSaving(null); }
  };

  const handleBanToggle = async (u) => {
    setSaving(`ban-${u.id}`);
    try {
      if (u.isBanned) await unbanUser({ variables: { userId: u.id } });
      else await banUser({ variables: { userId: u.id } });
    } finally { setSaving(null); }
  };

  const handleDelete = async (userId) => {
    setSaving(`del-${userId}`);
    try { await deleteUser({ variables: { userId } }); }
    finally { setSaving(null); setConfirmDelete(null); }
  };

  const avatarColor = (name) => {
    const P = ["#6c63ff","#a78bfa","#60a5fa","#34d399","#f59e0b","#f472b6"];
    return P[(name?.charCodeAt(0) ?? 0) % P.length];
  };

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === "admin").length,
    teacher: users.filter(u => u.role === "teacher").length,
    assistant: users.filter(u => u.role === "assistant").length,
    student: users.filter(u => u.role === "student").length,
    banned: users.filter(u => u.isBanned).length,
  };

  return (
    <div className={s.usersTab}>
      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className={s.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={s.confirmBox} onClick={e => e.stopPropagation()}>
            <div className={s.confirmIcon}>⚠️</div>
            <h3 className={s.confirmTitle}>Удалить пользователя?</h3>
            <p className={s.confirmText}>
              <strong>{confirmDelete.name}</strong> будет удалён навсегда вместе со всеми данными. Это действие необратимо.
            </p>
            <div className={s.confirmActions}>
              <Button onClick={() => setConfirmDelete(null)}>Отмена</Button>
              <Button danger type="primary" loading={saving === `del-${confirmDelete.id}`}
                onClick={() => handleDelete(confirmDelete.id)}>
                Удалить навсегда
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className={s.userStats}>
        {[
          { label: "Total",     val: stats.total,     color: "var(--accent)" },
          { label: "Admins",    val: stats.admin,     color: "#f87171"       },
          { label: "Teachers",  val: stats.teacher,   color: "#a89eff"       },
          { label: "Assistants",val: stats.assistant, color: "#60a5fa"       },
          { label: "Students",  val: stats.student,   color: "#34d399"       },
          { label: "Banned",    val: stats.banned,    color: "#fb923c"       },
        ].map((st, i) => (
          <div key={i} className={s.userStatCard}>
            <span className={s.userStatVal} style={{ color: st.color }}>{st.val}</span>
            <span className={s.userStatLabel}>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={s.usersToolbar}>
        <Input
          prefix={<UserOutlined style={{ color: "rgba(255,255,255,0.3)" }} />}
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ flex: 1, minWidth: 220 }}
        />
        <div className={s.roleFilters}>
          {["all", "admin", "teacher", "assistant", "student"].map(role => (
            <button key={role}
              className={`${s.roleFilterBtn} ${filterRole === role ? s.roleFilterBtnActive : ""}`}
              onClick={() => setFilterRole(role)}>
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className={s.loadingWrap}><Spin size="large" /></div>
      ) : filtered.length === 0 ? (
        <Empty description={<span style={{ color: "rgba(255,255,255,0.3)" }}>Пользователей не найдено</span>} />
      ) : (
        <div className={s.usersTable}>
          <div className={s.usersTableHead}>
            <span>Пользователь</span>
            <span>Email</span>
            <span>Дата</span>
            <span>Роль</span>
            <span>Изменить роль</span>
            <span>Действия</span>
          </div>
          {filtered.map(u => {
            const meta     = getRoleMeta(u.role);
            const color    = avatarColor(u.name);
            const isMe     = u.id === currentUser?.id;
            const joined   = u.createdAt
              ? new Date(u.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
              : "—";

            return (
              <div key={u.id} className={`${s.userRow} ${u.isBanned ? s.userRowBanned : ""}`}>
                {/* Avatar + name */}
                <div className={s.userRowAvatar}>
                  <div className={s.userAvCircle} style={{ background: `linear-gradient(135deg,${color}cc,${color}44)` }}>
                    {u.avatar && u.avatar.startsWith("http")
                      ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }} />
                      : u.name?.slice(0, 2).toUpperCase()
                    }
                  </div>
                  <div>
                    <div className={s.userRowName}>
                      {u.name}
                      {isMe && <Tag color="blue" style={{ marginLeft: 6, fontSize: 9 }}>Вы</Tag>}
                    </div>
                    <div className={s.userRowId}>#{u.id}</div>
                  </div>
                </div>

                <span className={s.userRowEmail}>{u.email}</span>
                <span className={s.userRowDate}>{joined}</span>

                <Tag color={u.isBanned ? "default" : meta.tagColor} style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                  {u.isBanned ? "🚫 Banned" : (
                    <>{u.role === "admin" && <CrownFilled style={{ marginRight: 3 }} />}
                    {u.role === "teacher" && "🎓 "}{meta.label}</>
                  )}
                </Tag>

                {/* Role select */}
                <div className={s.userRoleSelect}>
                  <Select
                    value={u.role}
                    disabled={saving === `role-${u.id}` || isMe || u.isBanned}
                    loading={saving === `role-${u.id}`}
                    onChange={newRole => handleRoleChange(u.id, newRole)}
                    size="small"
                    style={{ width: 130 }}
                  >
                    {ROLES.map(r => (
                      <Option key={r.value} value={r.value}>
                        <Tag color={r.tagColor} style={{ margin: 0, fontSize: 10 }}>{r.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* Actions */}
                <div className={s.userActions}>
                  {!isMe && u.role !== "admin" && (
                    <>
                      <Tooltip title={u.isBanned ? "Разбанить" : "Забанить"}>
                        <Button
                          size="small"
                          type={u.isBanned ? "primary" : "default"}
                          danger={!u.isBanned}
                          loading={saving === `ban-${u.id}`}
                          onClick={() => handleBanToggle(u)}
                          style={u.isBanned ? { background: "#34d399", borderColor: "#34d399", color: "#fff" } : {}}
                        >
                          {u.isBanned ? "✓ Unban" : "🚫 Ban"}
                        </Button>
                      </Tooltip>
                      <Tooltip title="Удалить пользователя">
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => setConfirmDelete(u)}
                        />
                      </Tooltip>
                    </>
                  )}
                  {isMe && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ── Course Editor ─────────────────────────────────────────────────────────────

const CourseEditor = ({ courseId, courseTitle, onBack }) => {
  const [showForm, setShowForm]     = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [deleting, setDeleting]     = useState(null);

  const { data, loading } = useQuery(GET_COURSE_DETAIL, {
    variables: { id: courseId }, fetchPolicy: "cache-and-network",
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

  return (
    <div className={s.editor}>
      <div className={s.editorHeader}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} className={s.backLink}>Все курсы</Button>
        <div className={s.editorTitle}>
          <h2>{courseTitle}</h2>
          <Tag color="purple">{lessons.length} уроков</Tag>
        </div>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setShowForm(v => !v); setEditLesson(null); }}
          style={{ background: "#6c63ff", borderColor: "#6c63ff" }}>
          Добавить урок
        </Button>
      </div>

      <div className={s.slugInfo}>
        <LinkOutlined />
        <span>URL: <code>/courses/{toSlug(courseTitle)}</code></span>
      </div>

      {showForm && !editLesson && (
        <LessonForm courseId={courseId} nextOrder={nextOrder}
          onSave={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
      )}
      {editLesson && (
        <LessonForm courseId={courseId} initial={editLesson} nextOrder={nextOrder} isEdit
          onSave={() => setEditLesson(null)} onCancel={() => setEditLesson(null)} />
      )}

      {loading && !course && <div className={s.loadingWrap}><Spin /></div>}

      {!loading && lessons.length === 0 && !showForm && (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📚</div>
          <p>Уроков пока нет</p>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowForm(true)}
            style={{ background: "#6c63ff", borderColor: "#6c63ff" }}>
            Добавить первый урок
          </Button>
        </div>
      )}

      <div className={s.sectionList}>
        {sections.map(([secName, secLessons]) => (
          <div key={secName} className={s.sectionBlock}>
            <div className={s.sectionHeader}>
              <span className={s.sectionName}>{secName}</span>
              <Tag>{secLessons.length} уроков</Tag>
            </div>
            {secLessons.map(lesson => {
              const meta       = TYPE_META[lesson.type] ?? TYPE_META.theory;
              const hasContent = !!(lesson.contentUrl || lesson.content);
              return (
                <div key={lesson.id} className={s.lessonRow}>
                  <span className={s.lessonNum}>{lesson.order}</span>
                  <span className={s.lessonTypeIcon} style={{ color: meta.color, background: meta.color + "18" }}>
                    {meta.icon}
                  </span>
                  <div className={s.lessonInfo}>
                    <span className={s.lessonTitle}>{lesson.title}</span>
                    <div className={s.lessonMeta}>
                      <Tag color={meta.tagColor} style={{ fontSize: 9, margin: 0 }}>{meta.label}</Tag>
                      {lesson.duration && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{lesson.duration}</span>}
                      {lesson.isFree && <Tag color="green" style={{ fontSize: 9, margin: 0 }}>Preview</Tag>}
                    </div>
                  </div>
                  <div className={s.lessonStatus}>
                    {hasContent
                      ? <Tag color="success" icon={<CheckCircleFilled />}>Контент</Tag>
                      : <Tag color="error"   icon={<CloseCircleFilled />}>Пусто</Tag>
                    }
                  </div>
                  <div className={s.lessonActions}>
                    <Tooltip title="Редактировать">
                      <Button size="small" icon={<EditOutlined />}
                        onClick={() => { setEditLesson(lesson); setShowForm(false); }} />
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <Button size="small" danger icon={<DeleteOutlined />}
                        loading={deleting === lesson.id}
                        onClick={async () => {
                          setDeleting(lesson.id);
                          await deleteLesson({ variables: { id: lesson.id } });
                          setDeleting(null);
                        }} />
                    </Tooltip>
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

// ── Course Card ───────────────────────────────────────────────────────────────

const CourseCard = ({ course, onClick }) => (
  <div className={s.courseCard} onClick={onClick}>
    <div className={s.courseThumb}>
      <img src={course.thumb || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=70"} alt={course.title} />
      {course.tag && <span className={s.courseTag} style={{ background: course.tagColor }}>{course.tag}</span>}
    </div>
    <div className={s.courseInfo}>
      <span className={s.courseCat}>{course.category}</span>
      <h3 className={s.courseTitle}>{course.title}</h3>
      <p className={s.courseInstructor}>{course.instructor}</p>
    </div>
    <div className={s.courseActions}>
      <div className={s.courseActionLeft}>
        <Tag>{course.level}</Tag>
        {course.isFree
          ? <Tag color="success">Free</Tag>
          : <Tag color="purple"><ThunderboltFilled style={{ marginRight: 3 }} />{course.coinPrice || 0} 🪙</Tag>
        }
      </div>
      <Button size="small" icon={<EditOutlined />} style={{ background: "rgba(108,99,255,0.15)", borderColor: "rgba(108,99,255,0.3)", color: "#a89eff" }}>
        Уроки
      </Button>
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
        { key: "courses", icon: <BookFilled />,   label: "Курсы"        },
        { key: "users",   icon: <TeamOutlined />, label: "Пользователи" },
        { key: "stats",   icon: <TrophyFilled />, label: "Статистика"   },
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

// ── Main ──────────────────────────────────────────────────────────────────────

const Admin = () => {
  const { user } = useAuthStore();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [activeNav, setActiveNav]           = useState("courses");

  const { data, loading, error } = useQuery(GET_COURSES, { fetchPolicy: "cache-and-network" });
  const allFetchedCourses = data?.allCourses ?? [];
  // Teacher видит только свои курсы, admin — все
  const courses = user?.role === "teacher"
    ? allFetchedCourses.filter(c => c.ownerId === user.id)
    : allFetchedCourses;

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

        {activeNav === "courses" && (
          <>
            <div className={s.mainHeader}>
              <div>
                <h1 className={s.mainTitle}>Управление курсами</h1>
                <p className={s.mainSub}>Выбери курс чтобы добавить уроки</p>
              </div>
              <div className={s.headerRight}>
                <div className={s.stat}>
                  <span className={s.statVal}>{courses.length}</span>
                  <span className={s.statLabel}>Курсов</span>
                </div>
                <Button type="primary" icon={<PlusOutlined />}
                  onClick={() => setShowCourseForm(true)}
                  style={{ background: "#6c63ff", borderColor: "#6c63ff" }}>
                  Новый курс
                </Button>
              </div>
            </div>

            {error && <div className={s.errorBox}>⚠️ <code>{error.message}</code></div>}

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
                <p>Курсов пока нет</p>
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
          </>
        )}

        {activeNav === "users" && (
          <>
            <div className={s.mainHeader}>
              <div>
                <h1 className={s.mainTitle}>Пользователи</h1>
                <p className={s.mainSub}>Управление ролями и доступом</p>
              </div>
            </div>
            <UsersTab currentUser={user} />
          </>
        )}

        {activeNav === "stats" && (
          <div className={s.mainHeader}>
            <div>
              <h1 className={s.mainTitle}>Статистика</h1>
              <p className={s.mainSub}>Скоро будет...</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Admin;