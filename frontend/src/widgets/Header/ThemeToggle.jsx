// src/widgets/Header/ThemeToggle.jsx
// Кнопка переключения тёмной / светлой темы в хедере

import useThemeStore from "@/shared/store/useThemeStore";
import s from "./ThemeToggle.module.css";

const SunIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="10" cy="10" r="4"/>
    <line x1="10" y1="2"  x2="10" y2="4"/>
    <line x1="10" y1="16" x2="10" y2="18"/>
    <line x1="2"  y1="10" x2="4"  y2="10"/>
    <line x1="16" y1="10" x2="18" y2="10"/>
    <line x1="4.2"  y1="4.2"  x2="5.6"  y2="5.6"/>
    <line x1="14.4" y1="14.4" x2="15.8" y2="15.8"/>
    <line x1="14.4" y1="5.6"  x2="15.8" y2="4.2"/>
    <line x1="4.2"  y1="15.8" x2="5.6"  y2="14.4"/>
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M17 12.5A7 7 0 0 1 7.5 3 7 7 0 1 0 17 12.5z"/>
  </svg>
);

const ThemeToggle = () => {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      className={s.btn}
      onClick={toggle}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      <span className={`${s.icon} ${isDark ? s.iconActive : ""}`}>
        <MoonIcon />
      </span>
      <span className={s.track}>
        <span className={`${s.thumb} ${!isDark ? s.thumbLight : ""}`} />
      </span>
      <span className={`${s.icon} ${!isDark ? s.iconActive : ""}`}>
        <SunIcon />
      </span>
    </button>
  );
};

export default ThemeToggle;