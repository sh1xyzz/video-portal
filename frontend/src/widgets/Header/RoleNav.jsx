// src/widgets/Header/RoleNav.jsx
// ✅ Дополнительные ссылки в навигации в зависимости от роли
// Вставляется внутрь Header рядом с основными ссылками

// Этот файл показывает КАК добавить role-based links в Header.
// В реальном Header.jsx нужно добавить эти ссылки туда где основные nav items.

import { Link, useLocation } from "react-router-dom";
import useAuthStore          from "@/shared/store/useAuthStore";

const RoleNav = () => {
  const { user, isAdmin, isTeacher } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  return (
    <>
      {/* Teacher dashboard — для teacher и admin */}
      {isTeacher() && (
        <Link
          to="/teacher"
          style={{
            padding:      "6px 14px",
            borderRadius: 8,
            background:   location.pathname === "/teacher"
              ? "rgba(108,99,255,.15)" : "transparent",
            color:        location.pathname === "/teacher"
              ? "#a89eff" : "var(--text-secondary)",
            fontSize:     14,
            fontWeight:   600,
            textDecoration: "none",
            transition:   "all 0.15s",
            border:       location.pathname === "/teacher"
              ? "1px solid rgba(108,99,255,.25)" : "1px solid transparent",
          }}
        >
          🎓 Teacher
        </Link>
      )}

      {/* Admin panel — только admin */}
      {isAdmin() && (
        <Link
          to="/admin"
          style={{
            padding:      "6px 14px",
            borderRadius: 8,
            background:   location.pathname === "/admin"
              ? "rgba(239,68,68,.1)" : "transparent",
            color:        location.pathname === "/admin"
              ? "#f87171" : "var(--text-secondary)",
            fontSize:     14,
            fontWeight:   600,
            textDecoration: "none",
            transition:   "all 0.15s",
            border:       location.pathname === "/admin"
              ? "1px solid rgba(239,68,68,.2)" : "1px solid transparent",
          }}
        >
          ⚡ Admin
        </Link>
      )}
    </>
  );
};

export default RoleNav;