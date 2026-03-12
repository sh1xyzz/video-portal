// src/widgets/UserMenu/UserMenu.jsx
// ✅ Bell dropdown — inline notifications list
// ✅ Click notification → open full modal with title + body text
// ✅ antd icons, CSS vars, both themes

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined, BookOutlined, SettingOutlined, LogoutOutlined,
  BellOutlined, ThunderboltFilled, FireFilled, ReadOutlined,
  DownOutlined, CheckOutlined, DeleteOutlined, CloseOutlined,
  BookFilled, TrophyFilled, CrownFilled, ArrowLeftOutlined,
} from "@ant-design/icons";
import useAuthStore   from "@/shared/store/useAuthStore";
import useCoinsStore  from "@/shared/store/useCoinsStore";
import useEnrollStore from "@/shared/store/useEnrollStore";
import s from "./UserMenu.module.css";

const PALETTE = ["#6c63ff","#a78bfa","#60a5fa","#34d399","#f59e0b","#f472b6"];
const avatarColor = (n) => PALETTE[(n?.charCodeAt(0) ?? 0) % PALETTE.length];
const initials    = (n) => n?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() ?? "?";

const NOTIF_ICON = {
  coins:  <ThunderboltFilled style={{ color:"#6c63ff", fontSize:13 }} />,
  course: <BookFilled        style={{ color:"#60a5fa", fontSize:13 }} />,
  streak: <FireFilled        style={{ color:"#f97316", fontSize:13 }} />,
  trophy: <TrophyFilled      style={{ color:"#f59e0b", fontSize:13 }} />,
  system: <BellOutlined      style={{ color:"var(--text-secondary)", fontSize:13 }} />,
};
const NOTIF_BG = {
  coins:  "rgba(108,99,255,.12)",
  course: "rgba(96,165,250,.12)",
  streak: "rgba(249,115,22,.12)",
  trophy: "rgba(245,158,11,.12)",
  system: "var(--surface-hover)",
};
// Full body text for the modal — more detail than the preview line
const NOTIF_BODY = {
  1: "You received +10 ⚡ EduCoins as your daily login bonus. Come back every day to keep your streak alive and earn even more coins!",
  2: "The brand-new course \"Machine Learning Pro\" is now live on EduStream. Dive deep into neural networks, transformers, and real-world ML projects. Enroll now and get an early-bird bonus of 50 ⚡.",
  3: "Amazing! You've logged in 3 days in a row and unlocked the 3-day streak badge. Keep it going — at 7 days you'll earn a special reward.",
  4: "🎉 Achievement unlocked: First Lesson Complete! You finished your very first lesson on EduStream. This is just the beginning — many more achievements await you.",
  5: "Welcome to EduStream! Your account is fully set up and ready to go. Browse our course catalog, enroll in something you love, and start earning EduCoins today.",
};

const INIT_NOTIFS = [
  { id:1, type:"coins",  title:"Daily login bonus",     text:"+10 ⚡ EduCoins for logging in today",    time:"2 min ago",  unread:true  },
  { id:2, type:"course", title:"New course available",  text:"\"Machine Learning Pro\" is now live",     time:"1 hour ago", unread:true  },
  { id:3, type:"streak", title:"3-day streak!",         text:"You've logged in 3 days in a row!",        time:"1 day ago",  unread:false },
  { id:4, type:"trophy", title:"Achievement unlocked",  text:"You completed your first lesson",          time:"2 days ago", unread:false },
  { id:5, type:"system", title:"Welcome to EduStream",  text:"Your account is all set. Start learning!", time:"3 days ago", unread:false },
];

/* ─── Notification Modal ──────────────────────────────────────────────────── */
const NotifModal = ({ notif, onClose, onDelete }) => {
  // close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <div className={s.modalBackdrop} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>

        {/* top bar */}
        <div className={s.modalTop}>
          <button className={s.modalBack} onClick={onClose}>
            <ArrowLeftOutlined style={{ fontSize:12 }}/> Back
          </button>
          <button className={s.modalClose} onClick={onClose}>
            <CloseOutlined style={{ fontSize:12 }}/>
          </button>
        </div>

        {/* icon + type badge */}
        <div className={s.modalHeader}>
          <div className={s.modalIcoWrap} style={{ background: NOTIF_BG[notif.type] }}>
            {NOTIF_ICON[notif.type]}
          </div>
          <div className={s.modalMeta}>
            <span className={s.modalType}>{notif.type}</span>
            <span className={s.modalTime}>{notif.time}</span>
          </div>
        </div>

        {/* content */}
        <h3 className={s.modalTitle}>{notif.title}</h3>
        <p  className={s.modalBody}>{NOTIF_BODY[notif.id] || notif.text}</p>

        {/* footer */}
        <div className={s.modalFoot}>
          <button
            className={s.modalDeleteBtn}
            onClick={() => { onDelete(notif.id); onClose(); }}
          >
            <DeleteOutlined/> Delete notification
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Notification Bell ───────────────────────────────────────────────────── */
export const NotificationBell = () => {
  const [open,       setOpen]       = useState(false);
  const [notifs,     setNotifs]     = useState(INIT_NOTIFS);
  const [openNotif,  setOpenNotif]  = useState(null); // notif to show in modal
  const ref   = useRef(null);
  const unread = notifs.filter(n => n.unread).length;

  // close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const markRead    = (id)    => setNotifs(p => p.map(n => n.id===id ? {...n, unread:false} : n));
  const markAll     = ()      => setNotifs(p => p.map(n => ({...n, unread:false})));
  const deleteNotif = (id)    => setNotifs(p => p.filter(n => n.id!==id));
  const deleteStop  = (e, id) => { e.stopPropagation(); deleteNotif(id); };

  const openModal = (notif) => {
    markRead(notif.id);
    setOpenNotif(notif);
    setOpen(false); // close dropdown when modal opens
  };

  return (
    <>
      <div className={s.bellWrap} ref={ref}>
        <button
          className={`${s.bellBtn} ${open ? s.bellOpen : ""}`}
          onClick={() => setOpen(v => !v)}
        >
          <BellOutlined />
          {unread > 0 && <span className={s.bellBadge}>{unread}</span>}
        </button>

        {open && (
          <div className={s.bellDrop}>
            {/* header */}
            <div className={s.bellHead}>
              <span className={s.bellTitle}>Notifications</span>
              {unread > 0 && (
                <button className={s.bellMarkAll} onClick={markAll}>
                  <CheckOutlined /> Mark all read
                </button>
              )}
            </div>

            {/* list */}
            <div className={s.bellList}>
              {notifs.length === 0 ? (
                <div className={s.bellEmpty}>
                  <BellOutlined style={{ fontSize:22, opacity:.2 }}/>
                  <span>All caught up!</span>
                </div>
              ) : notifs.map(n => (
                <div
                  key={n.id}
                  className={`${s.bellItem} ${n.unread ? s.bellUnread : ""}`}
                  onClick={() => openModal(n)}
                  title="Click to open"
                >
                  <div className={s.bellIcoWrap} style={{ background: NOTIF_BG[n.type] }}>
                    {NOTIF_ICON[n.type]}
                  </div>
                  <div className={s.bellBody}>
                    <span className={s.bellItemTitle}>{n.title}</span>
                    <span className={s.bellItemText}>{n.text}</span>
                    <span className={s.bellItemTime}>{n.time}</span>
                  </div>
                  {n.unread && <span className={s.unreadDot} />}
                  <button
                    className={s.bellDelete}
                    onClick={(e) => deleteStop(e, n.id)}
                    title="Delete"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              ))}
            </div>

            {/* footer */}
            {notifs.length > 0 && (
              <div className={s.bellFoot}>
                <button className={s.bellClearAll} onClick={() => setNotifs([])}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* notification modal — rendered outside dropdown */}
      {openNotif && (
        <NotifModal
          notif={openNotif}
          onClose={() => setOpenNotif(null)}
          onDelete={deleteNotif}
        />
      )}
    </>
  );
};

/* ─── UserMenu ────────────────────────────────────────────────────────────── */
const UserMenu = () => {
  const [open, setOpen]  = useState(false);
  const ref              = useRef(null);
  const navigate         = useNavigate();
  const { user, logout } = useAuthStore();
  const { balance, currentStreak, dailyClaimed } = useCoinsStore();
  const { getList }      = useEnrollStore();
  const enrolledCount    = getList().length;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!user) return null;

  const color     = avatarColor(user.name);
  const inits     = initials(user.name);
  const firstName = user.name?.split(" ")[0];
  const go = (path) => { setOpen(false); navigate(path); };

  return (
    <div className={s.wrap} ref={ref}>
      {/* trigger */}
      <button
        className={`${s.trigger} ${open ? s.triggerOpen : ""}`}
        onClick={() => setOpen(v => !v)}
      >
        <div className={s.trigAv} style={{ background:`linear-gradient(135deg,${color}cc,${color}55)` }}>
          {user.avatar
            ? <img src={user.avatar} alt="" className={s.trigAvImg}/>
            : <span>{inits}</span>}
        </div>
        <div className={s.trigText}>
          <span className={s.trigName}>{firstName}</span>
          <span className={s.trigEmail}>{user.email}</span>
        </div>
        <DownOutlined className={`${s.trigChev} ${open ? s.trigChevOpen : ""}`}/>
      </button>

      {/* dropdown */}
      {open && (
        <div className={s.drop}>
          <div className={s.dropHead}>
            <div className={s.dropAv} style={{ background:`linear-gradient(135deg,${color}cc,${color}55)` }}>
              {user.avatar
                ? <img src={user.avatar} alt="" className={s.dropAvImg}/>
                : <span>{inits}</span>}
            </div>
            <div className={s.dropMeta}>
              <span className={s.dropName}>{user.name}</span>
              <span className={s.dropEmail}>{user.email}</span>
            </div>
          </div>

          <div className={s.statsRow}>
            <div className={s.stat}>
              <ThunderboltFilled style={{ color:"#6c63ff", fontSize:13 }}/>
              <div><div className={s.statVal}>{balance.toLocaleString()}</div><div className={s.statLbl}>Coins</div></div>
            </div>
            <div className={s.statDiv}/>
            <div className={s.stat}>
              <FireFilled style={{ color:"#f97316", fontSize:13 }}/>
              <div><div className={s.statVal}>{currentStreak}</div><div className={s.statLbl}>Streak</div></div>
            </div>
            <div className={s.statDiv}/>
            <div className={s.stat}>
              <ReadOutlined style={{ color:"#34d399", fontSize:13 }}/>
              <div><div className={s.statVal}>{enrolledCount}</div><div className={s.statLbl}>Courses</div></div>
            </div>
          </div>

          {dailyClaimed && (
            <div className={s.claimedRow}>
              <ThunderboltFilled style={{ color:"#059669", fontSize:10 }}/>
              <span className={s.claimedTxt}>+10 claimed today</span>
            </div>
          )}

          <div className={s.sep}/>

          <div className={s.nav}>
            <button className={s.navBtn} onClick={() => go("/profile")}>
              <UserOutlined className={s.navIco}/> My profile
            </button>
            <button className={s.navBtn} onClick={() => go("/my-courses")}>
              <BookOutlined className={s.navIco}/>
              <span>My courses</span>
              {enrolledCount > 0 && <span className={s.navCount}>{enrolledCount}</span>}
            </button>
            <button className={s.navBtn} onClick={() => go("/settings")}>
              <SettingOutlined className={s.navIco}/> Settings
            </button>
          </div>

          <div className={s.sep}/>

          <button
            className={s.logoutBtn}
            onClick={() => { setOpen(false); logout(); navigate("/"); }}
          >
            <LogoutOutlined className={s.navIco}/> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;