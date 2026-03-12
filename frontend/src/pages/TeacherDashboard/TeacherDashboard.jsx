// src/pages/TeacherDashboard/TeacherDashboard.jsx
// ✅ Только для teacher / admin
// ✅ Мои курсы (созданные)
// ✅ Задания на проверку (pending submissions)
// ✅ Быстрая проверка: approve / reject прямо здесь

import { useState, useMemo } from "react";
import { useNavigate }        from "react-router-dom";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  BookOutlined, CheckCircleFilled, CloseCircleFilled,
  ClockCircleOutlined, TeamOutlined, TrophyFilled,
  EditOutlined, PlusOutlined, FileTextOutlined,
  EyeOutlined, CheckOutlined, CloseOutlined,
} from "@ant-design/icons";
import Header       from "@/widgets/Header";
import Footer       from "@/widgets/Footer";
import useAuthStore from "@/shared/store/useAuthStore";
import { toSlug }   from "@/pages/CoursesView/courseUtils";
import s from "./TeacherDashboard.module.css";

// ── GraphQL ───────────────────────────────────────────────────────────────────

const MY_COURSES = gql`
  query {
    myTeacherCourses {
      id title instructor thumb category level
      students rating coinPrice isFree isPublished
    }
  }
`;

const COURSE_SUBMISSIONS = gql`
  query CourseSubmissions($courseId: Int!, $status: String) {
    courseSubmissions(courseId: $courseId, status: $status) {
      id lessonId userId status feedback content submittedAt
      studentName lessonTitle
    }
  }
`;

const REVIEW_SUBMISSION = gql`
  mutation ReviewSubmission($input: ReviewSubmissionInput!) {
    reviewSubmission(input: $input) {
      id status feedback
    }
  }
`;

// ── Submission card ────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  pending:  { color: "#f59e0b", bg: "rgba(245,158,11,.1)",  icon: <ClockCircleOutlined /> },
  approved: { color: "#10b981", bg: "rgba(16,185,129,.1)",  icon: <CheckCircleFilled  /> },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,.1)",   icon: <CloseCircleFilled  /> },
};

const SubmissionCard = ({ sub, onReview }) => {
  const [feedback, setFeedback] = useState("");
  const [open,     setOpen]     = useState(false);
  const st = STATUS_COLOR[sub.status] ?? STATUS_COLOR.pending;

  return (
    <div className={s.subCard}>
      <div className={s.subTop}>
        <div className={s.subMeta}>
          <span className={s.subStudent}>👤 {sub.studentName || `User #${sub.userId}`}</span>
          <span className={s.subLesson}>📖 {sub.lessonTitle}</span>
          <span className={s.subDate}>
            {new Date(sub.submittedAt).toLocaleDateString("ru-RU", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
        <span
          className={s.subStatus}
          style={{ color: st.color, background: st.bg }}
        >
          {st.icon} {sub.status}
        </span>
      </div>

      {/* Content */}
      <div className={s.subContent}>{sub.content}</div>

      {/* Feedback if already reviewed */}
      {sub.feedback && (
        <div className={s.subFeedback}>
          💬 {sub.feedback}
        </div>
      )}

      {/* Review panel — only for pending */}
      {sub.status === "pending" && (
        <div className={s.subActions}>
          {!open ? (
            <button className={s.reviewBtn} onClick={() => setOpen(true)}>
              <EyeOutlined /> Review
            </button>
          ) : (
            <div className={s.reviewPanel}>
              <textarea
                className={s.feedbackInput}
                placeholder="Комментарий (необязательно)…"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={2}
              />
              <div className={s.reviewBtns}>
                <button
                  className={s.approveBtn}
                  onClick={() => { onReview(sub.id, "approved", feedback); setOpen(false); }}
                >
                  <CheckOutlined /> Принять
                </button>
                <button
                  className={s.rejectBtn}
                  onClick={() => { onReview(sub.id, "rejected", feedback); setOpen(false); }}
                >
                  <CloseOutlined /> Отклонить
                </button>
                <button className={s.cancelSmBtn} onClick={() => setOpen(false)}>Отмена</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const TeacherDashboard = () => {
  const navigate        = useNavigate();
  const { user }        = useAuthStore();
  const [selectedCourse, setSelected] = useState(null);
  const [statusFilter,   setStatus]   = useState("pending");

  const { data: coursesData, loading: coursesLoading } =
    useQuery(MY_COURSES, { fetchPolicy: "cache-and-network" });

  const { data: subData, loading: subLoading, refetch: refetchSubs } =
    useQuery(COURSE_SUBMISSIONS, {
      variables:   { courseId: selectedCourse?.id, status: statusFilter || null },
      skip:        !selectedCourse,
      fetchPolicy: "cache-and-network",
    });

  const [reviewSub] = useMutation(REVIEW_SUBMISSION, {
    onCompleted: () => refetchSubs(),
  });

  const courses     = coursesData?.myTeacherCourses ?? [];
  const submissions = subData?.courseSubmissions     ?? [];

  const handleReview = (submissionId, status, feedback) => {
    reviewSub({ variables: { input: { submissionId, status, feedback: feedback || null } } });
  };

  // Статистика
  const stats = useMemo(() => ({
    courses:  courses.length,
    students: courses.reduce((s, c) => s + (c.students || 0), 0),
    pending:  0, // загрузится отдельно
  }), [courses]);

  return (
    <div className={s.root}>
      <Header />
      <main className={s.main}>
        <div className={s.inner}>

          {/* ── Header ── */}
          <div className={s.pageHead}>
            <div>
              <p className={s.tag}>
                {user?.role === "admin" ? "Admin" : "Teacher"} Dashboard
              </p>
              <h1 className={s.title}>Мои курсы</h1>
              <p className={s.sub}>Управляй своими курсами и проверяй задания студентов</p>
            </div>
            <button
              className={s.newCourseBtn}
              onClick={() => navigate("/admin")}
            >
              <PlusOutlined /> Новый курс
            </button>
          </div>

          {/* ── Stats ── */}
          <div className={s.statsRow}>
            <div className={s.statCard}>
              <BookOutlined className={s.statIcon} />
              <span className={s.statVal}>{stats.courses}</span>
              <span className={s.statLabel}>Курсов</span>
            </div>
            <div className={s.statCard}>
              <TeamOutlined className={s.statIcon} />
              <span className={s.statVal}>{stats.students}</span>
              <span className={s.statLabel}>Студентов</span>
            </div>
            <div className={s.statCard}>
              <TrophyFilled className={s.statIcon} style={{ color: "#f59e0b" }} />
              <span className={s.statVal}>
                {courses.reduce((s, c) => s + (c.rating ? 1 : 0), 0) > 0
                  ? (courses.reduce((s, c) => s + (c.rating || 0), 0) / courses.length).toFixed(1)
                  : "—"
                }
              </span>
              <span className={s.statLabel}>Средний рейтинг</span>
            </div>
          </div>

          <div className={s.layout}>
            {/* ── Courses list ── */}
            <div className={s.coursesCol}>
              <h2 className={s.sectionTitle}>Мои курсы</h2>
              {coursesLoading ? (
                <div className={s.loading}>
                  {[1,2,3].map(i => <div key={i} className={s.skRow} />)}
                </div>
              ) : courses.length === 0 ? (
                <div className={s.empty}>
                  <div>📚</div>
                  <p>У тебя пока нет курсов</p>
                  <button className={s.newCourseBtn} onClick={() => navigate("/admin")}>
                    <PlusOutlined /> Создать курс
                  </button>
                </div>
              ) : (
                <div className={s.courseList}>
                  {courses.map(c => (
                    <div
                      key={c.id}
                      className={`${s.courseRow} ${selectedCourse?.id === c.id ? s.courseRowActive : ""}`}
                      onClick={() => setSelected(c)}
                    >
                      <div className={s.courseThumb}>
                        <img src={c.thumb || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"} alt={c.title} />
                      </div>
                      <div className={s.courseInfo}>
                        <span className={s.courseCat}>{c.category}</span>
                        <h4 className={s.courseTitle}>{c.title}</h4>
                        <div className={s.courseMeta}>
                          <span><TeamOutlined /> {c.students} students</span>
                          <span>⭐ {c.rating}</span>
                          <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                            {c.isFree ? "Free" : `${c.coinPrice || 0} 🪙`}
                          </span>
                        </div>
                      </div>
                      <div className={s.courseRowActions}>
                        <button
                          className={s.editCourseBtn}
                          onClick={e => { e.stopPropagation(); navigate("/admin"); }}
                          title="Edit lessons"
                        >
                          <EditOutlined />
                        </button>
                        <button
                          className={s.viewCourseBtn}
                          onClick={e => { e.stopPropagation(); navigate(`/courses/${toSlug(c.title)}`); }}
                          title="View course"
                        >
                          <EyeOutlined />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Submissions ── */}
            <div className={s.subsCol}>
              <div className={s.subsHeader}>
                <h2 className={s.sectionTitle}>
                  <FileTextOutlined /> Задания
                  {selectedCourse && <span className={s.subsCourse}> · {selectedCourse.title}</span>}
                </h2>
                {selectedCourse && (
                  <div className={s.statusTabs}>
                    {["pending","approved","rejected"].map(st => (
                      <button
                        key={st}
                        className={`${s.statusTab} ${statusFilter === st ? s.statusTabActive : ""}`}
                        onClick={() => setStatus(st)}
                      >
                        {st}
                      </button>
                    ))}
                    <button
                      className={`${s.statusTab} ${!statusFilter ? s.statusTabActive : ""}`}
                      onClick={() => setStatus("")}
                    >
                      all
                    </button>
                  </div>
                )}
              </div>

              {!selectedCourse ? (
                <div className={s.selectCourse}>
                  <div style={{ fontSize: 48 }}>👈</div>
                  <p>Выбери курс слева чтобы посмотреть задания студентов</p>
                </div>
              ) : subLoading ? (
                <div className={s.loading}>
                  {[1,2,3].map(i => <div key={i} className={s.skRow} style={{ height: 100 }} />)}
                </div>
              ) : submissions.length === 0 ? (
                <div className={s.empty}>
                  <div>📭</div>
                  <p>Нет заданий со статусом «{statusFilter || "any"}»</p>
                </div>
              ) : (
                <div className={s.subList}>
                  {submissions.map(sub => (
                    <SubmissionCard key={sub.id} sub={sub} onReview={handleReview} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeacherDashboard;