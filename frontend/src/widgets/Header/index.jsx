// src/widgets/Header/Header.jsx

import { useState, useEffect } from "react";
import { useNavigate }          from "react-router-dom";
import AuthModal            from "@/widgets/AuthModal";
import UserMenu             from "@/widgets/UserMenu";
import { NotificationBell } from "@/widgets/UserMenu";
import ThemeToggle          from "@/widgets/Header/ThemeToggle";
import useAuthModal  from "@/shared/hooks/useAuthModal";
import useAuthStore  from "@/shared/store/useAuthStore";
import useCoinsStore from "@/shared/store/useCoinsStore";
import useThemeStore from "@/shared/store/useThemeStore";
import s from "./Header.module.css";

const NAV_LINKS = [
  { label: "Courses",     path: "/courses"     },
  { label: "Categories",  path: "/categories"  },
  { label: "Instructors", path: "/instructors" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isOpen, mode, openLogin, openRegister, close } = useAuthModal();
  const { user, fetchMe }    = useAuthStore();
  const { fetchAll, reset }  = useCoinsStore();
  const { init }             = useThemeStore();
  const navigate = useNavigate();

  // Инициализируем тему при монтировании
  useEffect(() => { init(); }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { fetchMe(); }, []);

  useEffect(() => {
    if (user) fetchAll();
    else      reset();
  }, [user?.id]);

  return (
    <>
      <header className={`${s.header} ${scrolled ? s.scrolled : ""}`}>
        <button className={s.logo} onClick={() => navigate("/")}>⚡ EduStream</button>

        <nav className={s.nav}>
          {NAV_LINKS.map(l => (
            <button key={l.label} className={s.navLink} onClick={() => navigate(l.path)}>
              {l.label}
            </button>
          ))}
        </nav>

        <div className={s.actions}>
          <ThemeToggle />

          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <button className={s.signIn}     onClick={openLogin}>Sign In</button>
              <button className={s.getStarted} onClick={openRegister}>Get Started</button>
            </>
          )}
        </div>
      </header>

      <AuthModal open={isOpen} defaultMode={mode} onClose={close} />
    </>
  );
};

export default Header;