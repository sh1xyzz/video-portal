// src/shared/components/ProtectedRoute.jsx
// ✅ Защищает роуты по роли
// ✅ Редиректит неавторизованных на главную
// ✅ Показывает 403 если роль не подходит

import { Navigate } from "react-router-dom";
import useAuthStore  from "@/shared/store/useAuthStore";

/**
 * Использование:
 *
 * // Только для авторизованных
 * <ProtectedRoute><ProfileView /></ProtectedRoute>
 *
 * // Только для teacher и admin
 * <ProtectedRoute roles={["teacher","admin"]}><TeacherDashboard /></ProtectedRoute>
 *
 * // Только для admin
 * <ProtectedRoute roles={["admin"]}><AdminPanel /></ProtectedRoute>
 */
const ProtectedRoute = ({ children, roles = null }) => {
  const { user } = useAuthStore();

  // Не авторизован → на главную
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Нужна определённая роль и роль не подходит
  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        minHeight:      "100vh",
        background:     "var(--bg)",
        gap:            16,
        textAlign:      "center",
        padding:        "24px",
      }}>
        <div style={{ fontSize: 64 }}>🚫</div>
        <h2 style={{
          fontFamily: '"Syne", sans-serif',
          fontSize:   28,
          fontWeight: 800,
          color:      "var(--text-primary)",
          margin:     0,
        }}>
          Access denied
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>
          This page requires role: <strong>{roles.join(" or ")}</strong>.
          Your role: <strong>{user.role}</strong>.
        </p>
        <button
          style={{
            padding:    "11px 24px",
            background: "var(--accent)",
            border:     "none",
            color:      "#fff",
            borderRadius: 10,
            fontSize:   14,
            fontWeight: 700,
            cursor:     "pointer",
          }}
          onClick={() => window.history.back()}
        >
          ← Go back
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;