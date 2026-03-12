// src/pages/Settings/SettingsPage.jsx
// Рабочие настройки: тема, уведомления, язык, приватность, аккаунт

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header  from "@/widgets/Header";
import Footer  from "@/widgets/Footer";
import useAuthStore  from "@/shared/store/useAuthStore";
import useThemeStore from "@/shared/store/useThemeStore";
import s from "./SettingsView.module.css";

// ─── Toggle switch ─────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    role="switch" aria-checked={checked}
    className={`${s.toggle} ${checked ? s.toggleOn : ""}`}
    onClick={() => onChange(!checked)}
  >
    <span className={s.toggleThumb} />
  </button>
);

// ─── Select ────────────────────────────────────────────────────────────────
const Select = ({ value, options, onChange }) => (
  <select className={s.select} value={value} onChange={e => onChange(e.target.value)}>
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

// ─── Section card ──────────────────────────────────────────────────────────
const Section = ({ icon, title, children }) => (
  <div className={s.section}>
    <div className={s.sectionHead}>
      <span className={s.sectionIco}>{icon}</span>
      <h2 className={s.sectionTitle}>{title}</h2>
    </div>
    <div className={s.sectionBody}>{children}</div>
  </div>
);

// ─── Row ───────────────────────────────────────────────────────────────────
const Row = ({ label, sub, children }) => (
  <div className={s.row}>
    <div className={s.rowLeft}>
      <span className={s.rowLabel}>{label}</span>
      {sub && <span className={s.rowSub}>{sub}</span>}
    </div>
    <div className={s.rowRight}>{children}</div>
  </div>
);

// ─── Main ──────────────────────────────────────────────────────────────────
const SettingsView = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  // Notification settings
  const [notifs, setNotifs] = useState({
    emailNewCourse:   true,
    emailMarketing:   false,
    emailDigest:      true,
    pushLesson:       true,
    pushAchievement:  true,
    pushStreak:       true,
  });

  // Playback settings
  const [playback, setPlayback] = useState({
    autoplay:     true,
    quality:      "auto",
    speed:        "1",
    subtitles:    false,
    language:     "ru",
  });

  // Privacy
  const [privacy, setPrivacy] = useState({
    showProfile:  true,
    showProgress: false,
    showOnLeaderboard: true,
  });

  // Danger zone confirm
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const setN = (key) => (val) => setNotifs(p => ({ ...p, [key]: val }));
  const setP = (key) => (val) => setPlayback(p => ({ ...p, [key]: val }));
  const setPr = (key) => (val) => setPrivacy(p => ({ ...p, [key]: val }));

  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={s.root}>
      <Header />

      <main className={s.main}>
        <div className={s.inner}>

          <div className={s.pageHead}>
            <button className={s.backBtn} onClick={() => navigate(-1)}>← Назад</button>
            <div>
              <h1 className={s.pageTitle}>Настройки</h1>
              <p className={s.pageSub}>Управляйте своим аккаунтом и предпочтениями</p>
            </div>
          </div>

          <div className={s.layout}>
            {/* ── Left sidebar nav ── */}
            <nav className={s.sideNav}>
              {[
                { icon: "🎨", label: "Внешний вид",    href: "#appearance"  },
                { icon: "🔔", label: "Уведомления",    href: "#notifs"      },
                { icon: "▶️", label: "Воспроизведение", href: "#playback"   },
                { icon: "🔒", label: "Приватность",    href: "#privacy"     },
                { icon: "⚠️", label: "Опасная зона",   href: "#danger"      },
              ].map(item => (
                <a key={item.href} href={item.href} className={s.sideNavItem}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>

            {/* ── Content ── */}
            <div className={s.content}>

              {/* ═══ APPEARANCE ═══ */}
              <Section icon="🎨" title="Внешний вид" id="appearance">
                <Row
                  label="Тема интерфейса"
                  sub="Выберите тёмную или светлую тему"
                >
                  <div className={s.themeButtons}>
                    <button
                      className={`${s.themeBtn} ${theme === "dark" ? s.themeBtnActive : ""}`}
                      onClick={() => setTheme("dark")}
                    >
                      🌙 Тёмная
                    </button>
                    <button
                      className={`${s.themeBtn} ${theme === "light" ? s.themeBtnActive : ""}`}
                      onClick={() => setTheme("light")}
                    >
                      ☀️ Светлая
                    </button>
                  </div>
                </Row>

                <Row
                  label="Язык интерфейса"
                  sub="Язык отображения платформы"
                >
                  <Select
                    value={playback.language}
                    onChange={setP("language")}
                    options={[
                      { value: "ru", label: "Русский" },
                      { value: "en", label: "English" },
                    ]}
                  />
                </Row>
              </Section>

              {/* ═══ NOTIFICATIONS ═══ */}
              <Section icon="🔔" title="Уведомления" id="notifs">
                <div className={s.subhead}>Email уведомления</div>
                <Row label="Новые курсы" sub="Уведомлять о новых курсах в ваших категориях">
                  <Toggle checked={notifs.emailNewCourse} onChange={setN("emailNewCourse")} />
                </Row>
                <Row label="Еженедельный дайджест" sub="Лучшие курсы и новости недели">
                  <Toggle checked={notifs.emailDigest} onChange={setN("emailDigest")} />
                </Row>
                <Row label="Маркетинговые письма" sub="Акции, скидки и специальные предложения">
                  <Toggle checked={notifs.emailMarketing} onChange={setN("emailMarketing")} />
                </Row>

                <div className={s.subhead}>Push-уведомления</div>
                <Row label="Напоминания об уроках" sub="Напоминать о незавершённых уроках">
                  <Toggle checked={notifs.pushLesson} onChange={setN("pushLesson")} />
                </Row>
                <Row label="Достижения" sub="Оповещать о новых достижениях и монетах">
                  <Toggle checked={notifs.pushAchievement} onChange={setN("pushAchievement")} />
                </Row>
                <Row label="Серия дней" sub="Напоминать чтобы не прерывать серию">
                  <Toggle checked={notifs.pushStreak} onChange={setN("pushStreak")} />
                </Row>
              </Section>

              {/* ═══ PLAYBACK ═══ */}
              <Section icon="▶️" title="Воспроизведение" id="playback">
                <Row label="Автовоспроизведение" sub="Автоматически переходить к следующему уроку">
                  <Toggle checked={playback.autoplay} onChange={setP("autoplay")} />
                </Row>
                <Row label="Качество видео" sub="Качество по умолчанию при загрузке">
                  <Select
                    value={playback.quality}
                    onChange={setP("quality")}
                    options={[
                      { value: "auto",  label: "Авто"  },
                      { value: "1080p", label: "1080p" },
                      { value: "720p",  label: "720p"  },
                      { value: "480p",  label: "480p"  },
                      { value: "360p",  label: "360p"  },
                    ]}
                  />
                </Row>
                <Row label="Скорость воспроизведения" sub="Скорость по умолчанию">
                  <Select
                    value={playback.speed}
                    onChange={setP("speed")}
                    options={[
                      { value: "0.5", label: "0.5×" },
                      { value: "0.75", label: "0.75×" },
                      { value: "1",   label: "1×"   },
                      { value: "1.25", label: "1.25×" },
                      { value: "1.5", label: "1.5×" },
                      { value: "2",   label: "2×"   },
                    ]}
                  />
                </Row>
                <Row label="Субтитры" sub="Включать субтитры по умолчанию">
                  <Toggle checked={playback.subtitles} onChange={setP("subtitles")} />
                </Row>
              </Section>

              {/* ═══ PRIVACY ═══ */}
              <Section icon="🔒" title="Приватность" id="privacy">
                <Row label="Публичный профиль" sub="Другие пользователи могут видеть ваш профиль">
                  <Toggle checked={privacy.showProfile} onChange={setPr("showProfile")} />
                </Row>
                <Row label="Показывать прогресс" sub="Ваш прогресс виден другим пользователям">
                  <Toggle checked={privacy.showProgress} onChange={setPr("showProgress")} />
                </Row>
                <Row label="Лидерборд" sub="Показывать вас в топе игроков">
                  <Toggle checked={privacy.showOnLeaderboard} onChange={setPr("showOnLeaderboard")} />
                </Row>
              </Section>

              {/* ═══ DANGER ZONE ═══ */}
              <Section icon="⚠️" title="Опасная зона" id="danger">
                <Row
                  label="Выйти из аккаунта"
                  sub="Завершить текущую сессию"
                >
                  <button className={s.dangerBtn} onClick={() => { logout(); navigate("/"); }}>
                    Выйти
                  </button>
                </Row>
                <Row
                  label="Удалить аккаунт"
                  sub="Безвозвратно удалить аккаунт и все данные"
                >
                  <button className={s.deleteBtn} onClick={() => {}}>
                    Удалить аккаунт
                  </button>
                </Row>
                <div className={s.dangerNote}>
                  ⚠️ Удаление аккаунта необратимо. Все данные, прогресс и EduCoins будут утеряны.
                </div>
              </Section>

              {/* Save button */}
              <div className={s.saveRow}>
                <button className={`${s.saveBtn} ${saved ? s.saveBtnDone : ""}`} onClick={handleSave}>
                  {saved ? "✓ Сохранено!" : "Сохранить изменения"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SettingsView;