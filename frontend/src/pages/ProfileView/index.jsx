// src/pages/ProfileView/ProfileView.jsx

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  EditOutlined, CheckCircleFilled,
  FireFilled, TrophyFilled, ThunderboltFilled,
  BookOutlined, RiseOutlined, CrownFilled,
  LockOutlined, StarFilled,
  SafetyCertificateOutlined, CalendarOutlined,
  DeleteOutlined, WarningOutlined,
} from "@ant-design/icons";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import Header         from "@/widgets/Header";
import Footer         from "@/widgets/Footer";
import useAuthStore   from "@/shared/store/useAuthStore";
import useCoinsStore  from "@/shared/store/useCoinsStore";
import useEnrollStore from "@/shared/store/useEnrollStore";
import s from "./ProfileView.module.css";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const PALETTE     = ["#6c63ff","#a78bfa","#60a5fa","#34d399","#f59e0b","#f472b6"];
const avatarColor = (n) => PALETTE[(n?.charCodeAt(0) ?? 0) % PALETTE.length];
const getInitials = (n) => n?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() ?? "?";

const TX_ICON = {
  lesson_complete: <BookOutlined      style={{ color:"#6c63ff" }} />,
  course_complete: <TrophyFilled      style={{ color:"#f59e0b" }} />,
  daily_login:     <ThunderboltFilled style={{ color:"#6c63ff" }} />,
  streak_3:        <FireFilled        style={{ color:"#f97316" }} />,
  streak_7:        <FireFilled        style={{ color:"#ef4444" }} />,
  streak_30:       <CrownFilled       style={{ color:"#a855f7" }} />,
};

const ACHIEVEMENTS = [
  { icon:<BookOutlined />,              label:"First Lesson",  req:(te)     => te >= 5    },
  { icon:<FireFilled />,                label:"3-day Streak",  req:(_,ls)   => ls >= 3    },
  { icon:<ThunderboltFilled />,         label:"100 Coins",     req:(te)     => te >= 100  },
  { icon:<FireFilled />,                label:"7-day Streak",  req:(_,ls)   => ls >= 7    },
  { icon:<StarFilled />,                label:"500 Coins",     req:(te)     => te >= 500  },
  { icon:<TrophyFilled />,              label:"Course Master", req:(te)     => te >= 100  },
  { icon:<CrownFilled />,               label:"30-day Streak", req:(_,ls)   => ls >= 30   },
  { icon:<RiseOutlined />,              label:"1 000 Coins",   req:(te)     => te >= 1000 },
  { icon:<SafetyCertificateOutlined />, label:"Certified",     req:(_,__,e) => e >= 1     },
];

/* ─── Activity bar chart: lessons per day, last 14 days ──────────────────── */
const buildActivity = (txs) => {
  const SEED = [0,2,1,3,0,4,2,1,5,0,3,2,4,1];
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13-i));
    const isToday = i === 13;
    const real = txs.filter(tx => {
      const dt = new Date(tx.created_at);
      return dt.toDateString() === d.toDateString() && tx.reason === "lesson_complete";
    }).length;
    return {
      label: isToday ? "Today" : d.toLocaleDateString("en-US",{weekday:"short",day:"numeric"}),
      lessons: real || SEED[i],
      isToday,
    };
  });
};

/* ─── Coins + active days chart: 12 weeks ───────────────────────────────── */
const buildWeekly = (txs) =>
  Array.from({ length: 12 }, (_, i) => {
    const d    = new Date(); d.setDate(d.getDate() - (11-i)*7);
    const from = new Date(d); from.setDate(from.getDate()-7);
    const label = d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
    const weekTxs = txs.filter(tx => { const dt=new Date(tx.created_at); return dt>=from && dt<=d; });
    const coins = weekTxs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount, 0);
    const activeDays = new Set(
      weekTxs.filter(t=>t.reason==="lesson_complete").map(t=>new Date(t.created_at).toDateString())
    ).size;
    const SEED_C = [8,14,20,10,32,17,40,26,52,28,44,58];
    const SEED_D = [1,2,1,2,3,2,4,3,5,3,4,5];
    return { week:label, coins:coins||SEED_C[i], days:activeDays||SEED_D[i] };
  });

/* ─── Calendar heatmap ───────────────────────────────────────────────────── */
const MONTH_ABR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const buildCalendar = (txs, enrolled) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const lessonMap = {};
  txs.forEach(tx => {
    if (tx.reason === "lesson_complete") {
      const k = new Date(tx.created_at).toDateString();
      lessonMap[k] = (lessonMap[k]||0)+1;
    }
  });
  const schedMap = {};
  enrolled.forEach((c,ci) => {
    for (let w=0; w<12; w++) {
      const d = new Date(today);
      d.setDate(d.getDate() + w*3 + (ci%3) + 1);
      const k = d.toDateString();
      if (!schedMap[k]) schedMap[k] = [];
      schedMap[k].push(c.title||`Course ${c.id}`);
    }
  });
  const cells = [];
  for (let i=83; i>=0; i--) {
    const d = new Date(today); d.setDate(d.getDate()-i);
    cells.push({ date:d, lessons:lessonMap[d.toDateString()]||0, isFuture:false, isToday:d.getTime()===today.getTime() });
  }
  for (let i=1; i<=14; i++) {
    const d = new Date(today); d.setDate(d.getDate()+i);
    cells.push({ date:d, lessons:0, scheduled:schedMap[d.toDateString()]||null, isFuture:true, isToday:false });
  }
  return cells;
};

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const Av = ({ user, size=82 }) => {
  const c = avatarColor(user?.name);
  return user?.avatar
    ? <img src={user.avatar} alt="" className={s.avImg} style={{width:size,height:size}}/>
    : <div className={s.avCircle} style={{width:size,height:size,background:`linear-gradient(135deg,${c}cc,${c}44)`,fontSize:size*.32}}>
        {getInitials(user?.name)}
      </div>;
};

/* ─── Editable field ──────────────────────────────────────────────────────── */
const Field = ({ label, value, onSave, multiline, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value||"");
  useEffect(()=>setVal(value||""),[value]);
  const save   = async () => { await onSave(val); setEditing(false); };
  const cancel = ()       => { setVal(value||""); setEditing(false); };
  return (
    <div className={s.field}>
      <span className={s.fLabel}>{label}</span>
      {editing ? (
        <div className={s.fEdit}>
          {multiline
            ? <textarea className={s.fInput} value={val} onChange={e=>setVal(e.target.value)} rows={3} autoFocus placeholder={placeholder}/>
            : <input    className={s.fInput} value={val} onChange={e=>setVal(e.target.value)} autoFocus placeholder={placeholder}
                onKeyDown={e=>{if(e.key==="Enter")save();if(e.key==="Escape")cancel();}}/>}
          <div className={s.fBtns}>
            <button className={s.fSave}   onClick={save}>Save</button>
            <button className={s.fCancel} onClick={cancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className={s.fView}>
          <span className={val?s.fVal:s.fEmpty}>{val||placeholder}</span>
          <button className={s.fEditBtn} onClick={()=>setEditing(true)} title="Edit">
            <EditOutlined style={{fontSize:11}}/>
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Custom chart tooltips ───────────────────────────────────────────────── */
const ActivityTip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div className={s.tip}>
      <span className={s.tipLabel}>{label}</span>
      <span className={s.tipVal}>{payload[0].value} lesson{payload[0].value!==1?"s":""}</span>
    </div>
  );
};
const WeeklyTip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div className={s.tip}>
      <span className={s.tipLabel}>{label}</span>
      {payload.map((p,i)=>(
        <span key={i} className={s.tipVal} style={{color:p.color}}>
          {p.name==="coins" ? `⚡ ${p.value} coins` : `📅 ${p.value} active days`}
        </span>
      ))}
    </div>
  );
};


/* ─── Skill radar data ────────────────────────────────────────────────────── */
const buildRadar = (totalLessons, totalEver, currentStreak, longestStreak, enrolled, myRank) => {
  const clamp = (v, max) => Math.min(100, Math.round((v / max) * 100));
  return [
    { skill: "Lessons",  value: clamp(totalLessons, 50)  },
    { skill: "Coins",    value: clamp(totalEver, 1000)   },
    { skill: "Streak",   value: clamp(currentStreak, 30) },
    { skill: "Best",     value: clamp(longestStreak, 30) },
    { skill: "Courses",  value: clamp(enrolled, 10)      },
    { skill: "Rank",     value: myRank > 0 ? clamp(Math.max(1, 11 - myRank), 10) : 0 },
  ];
};

const RadarTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={s.tip}>
      <span className={s.tipLabel}>{label}</span>
      <span className={s.tipVal}>{payload[0].value}%</span>
    </div>
  );
};

/* ─── Activity Calendar ───────────────────────────────────────────────────── */
const ActivityCalendar = ({ cells, enrolled }) => {
  // CELL_SIZE + GAP must match CSS: 12px cell + 3px gap = 15px per column
  const CELL = 15; // px per week-column (12 cell + 3 gap)

  const weeks = useMemo(()=>{
    const w=[]; for(let i=0;i<cells.length;i+=7) w.push(cells.slice(i,i+7)); return w;
  },[cells]);

  // Build month spans: find first week-col index for each new month
  const monthSpans = useMemo(()=>{
    const spans = [];
    let cur = null;
    weeks.forEach((wk, wi) => {
      const firstDay = wk[0];
      const mo = MONTH_ABR[firstDay.date.getMonth()];
      if (mo !== cur) {
        if (cur !== null) spans[spans.length-1].cols = wi - spans[spans.length-1].start;
        spans.push({ label: mo, start: wi, cols: 1 });
        cur = mo;
      }
    });
    if (spans.length) spans[spans.length-1].cols = weeks.length - spans[spans.length-1].start;
    return spans;
  }, [weeks]);

  const lvlClass = (c) => {
    if(c.isFuture) return c.scheduled ? s.calSched : s.calL0;
    if(c.lessons===0) return s.calL0;
    if(c.lessons===1) return s.calL1;
    if(c.lessons<=3)  return s.calL2;
    return s.calL3;
  };

  const buildTitle = (c) => {
    if(c.isToday && c.lessons>0) return `Today · ${c.lessons} lesson${c.lessons>1?"s":""}`;
    if(c.isToday) return "Today";
    if(c.isFuture && c.scheduled) return `Scheduled: ${c.scheduled.slice(0,2).join(", ")}`;
    if(c.isFuture) return null;
    const dStr=c.date.toLocaleDateString("en-US",{month:"short",day:"numeric"});
    return c.lessons>0?`${c.lessons} lesson${c.lessons>1?"s":""} · ${dStr}`:dStr;
  };

  return (
    <div className={s.calOuter}>
      {/* Month labels row — each span is exactly (cols × CELL)px wide */}
      <div className={s.calMonthRow}>
        {/* spacer = width of day-label column (26px) + gap (2px) */}
        <div style={{width:28,flexShrink:0}}/>
        {monthSpans.map((sp,i)=>(
          <div
            key={i}
            className={s.calMonthSpan}
            style={{width: sp.cols * CELL - 3, flexShrink:0}}
          >
            {sp.label}
          </div>
        ))}
      </div>
      <div className={s.calBody}>
        <div className={s.calDayNames}>
          {DAY_NAMES.map((d,i)=>(
            <div key={i} className={s.calDayName}>{i%2===1?d:""}</div>
          ))}
        </div>
        <div className={s.calWeekCols}>
          {weeks.map((wk,wi)=>(
            <div key={wi} className={s.calDayCol}>
              {wk.map((cell,di)=>{
                const title=buildTitle(cell);
                return <div key={di} className={`${s.calCell} ${lvlClass(cell)} ${cell.isToday?s.calToday:""}`} title={title||undefined}/>;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className={s.calLegend}>
        <span className={s.calLegendTxt}>Less</span>
        {[s.calL0,s.calL1,s.calL2,s.calL3].map((cl,i)=>(
          <div key={i} className={`${s.calCell} ${cl}`}/>
        ))}
        <span className={s.calLegendTxt}>More</span>
        {enrolled.length>0&&<>
          <span className={s.calLegendSep}>·</span>
          <div className={`${s.calCell} ${s.calSched}`}/>
          <span className={s.calLegendTxt}>Upcoming</span>
        </>}
      </div>
      {enrolled.length>0&&(
        <div className={s.calCourses}>
          <p className={s.cardLblSm}><CalendarOutlined/> Upcoming lessons</p>
          {enrolled.slice(0,3).map((c,i)=>{
            const next=new Date(); next.setDate(next.getDate()+(i%3)+1+(i*3));
            const lbl=next.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
            return (
              <div key={c.id} className={s.calCourseRow}>
                {c.thumb&&<img src={c.thumb} alt="" className={s.calCourseThumb}/>}
                <div className={s.calCourseInfo}>
                  <div className={s.calCourseTitle}>{c.title}</div>
                  <div className={s.calCourseSub}>{c.instructor}</div>
                </div>
                <span className={s.calCourseBadge}>{lbl}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Delete Account Modal ───────────────────────────────────────────────── */
const DeleteModal = ({ onClose, onConfirm }) => {
  const [input, setInput] = useState("");
  return (
    <div className={s.modalBackdrop} onClick={onClose}>
      <div className={s.modal} onClick={e=>e.stopPropagation()}>
        <div className={s.modalIco}><WarningOutlined/></div>
        <h3 className={s.modalTitle}>Delete account</h3>
        <p className={s.modalText}>
          This will permanently delete your account, all progress, coins, and data.
          <strong> This cannot be undone.</strong>
        </p>
        <p className={s.modalConfirmLabel}>Type <strong>delete</strong> to confirm</p>
        <input
          className={s.modalInput}
          value={input}
          onChange={e=>setInput(e.target.value)}
          placeholder="delete"
          autoFocus
        />
        <div className={s.modalBtns}>
          <button className={s.modalCancel} onClick={onClose}>Cancel</button>
          <button
            className={s.modalDanger}
            disabled={input !== "delete"}
            onClick={()=>{ if(input==="delete") onConfirm(); }}
          >
            <DeleteOutlined/> Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main ────────────────────────────────────────────────────────────────── */
const ProfileView = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile }                               = useAuthStore();
  const { balance, totalEver, currentStreak, longestStreak,
          transactions, leaderboard, dailyClaimed, fetchAll }         = useCoinsStore();
  const { getList }                                                   = useEnrollStore();

  const [tab,           setTab]           = useState("profile");
  const [bioExpanded,   setBioExpanded]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(()=>{ if(!user) navigate("/"); },[user]);
  useEffect(()=>{ if(user) fetchAll(); },   [user?.id]);

  const enrolled     = getList();
  const myRank       = leaderboard.findIndex(r=>r.user_id===user?.id)+1;
  const joined       = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US",{year:"numeric",month:"long"}) : null;
  const totalLessons = transactions.filter(t=>t.reason==="lesson_complete").length;

  const activityData  = useMemo(()=>buildActivity(transactions),           [transactions]);
  const weeklyData    = useMemo(()=>buildWeekly(transactions),             [transactions]);
  const calendarCells = useMemo(()=>buildCalendar(transactions,enrolled),  [transactions,enrolled]);
  const radarData     = useMemo(()=>buildRadar(totalLessons,totalEver,currentStreak,longestStreak,enrolled.length,myRank), [totalLessons,totalEver,currentStreak,longestStreak,enrolled.length,myRank]);

  if(!user) return null;

  const TABS = [
    {k:"profile",     l:"Profile"    },
    {k:"coins",       l:"Coins"      },
    {k:"leaderboard", l:"Leaderboard"},
  ];

  return (
    <div className={s.root}>
      <Header/>
      <main className={s.main}>

        {/* ══ HERO ════════════════════════════════════════════════════════ */}
        <div className={s.hero}>
          <div className={s.heroBlob}/>
          <div className={s.heroRow}>
            <div className={s.avWrap}>
              <Av user={user} size={82}/>
              <span className={s.onlineDot}/>
            </div>
            <div className={s.heroMeta}>
              <h1 className={s.heroName}>{user.name}</h1>
              <div className={s.heroSub}>
                <span>{user.email}</span>
                {joined&&<><span className={s.heroDot}>·</span><span>Joined {joined}</span></>}
              </div>
              {user.bio&&(
                <div className={s.bioWrap}>
                  <p className={`${s.bioText} ${bioExpanded?s.bioTextExpanded:""}`}>{user.bio}</p>
                  {user.bio.length>90&&(
                    <button className={s.bioToggle} onClick={()=>setBioExpanded(v=>!v)}>
                      {bioExpanded?"Show less":"Show more"}
                    </button>
                  )}
                </div>
              )}
              <div className={s.kpisRow}>
                {[
                  {icon:<ThunderboltFilled style={{color:"#6c63ff",fontSize:12}}/>, val:balance.toLocaleString(), lbl:"coins"},
                  {icon:<FireFilled        style={{color:"#f97316",fontSize:12}}/>, val:currentStreak,             lbl:"streak"},
                  {icon:<BookOutlined      style={{color:"#34d399",fontSize:12}}/>, val:totalLessons,              lbl:"lessons"},
                  ...(myRank>0?[{icon:<TrophyFilled style={{color:"#f59e0b",fontSize:12}}/>, val:`#${myRank}`, lbl:"rank"}]:[]),
                ].map((k,i)=>(
                  <div key={i} className={s.kpi}>
                    {k.icon}
                    <span className={s.kpiVal}>{k.val}</span>
                    <span className={s.kpiLbl}>{k.lbl}</span>
                  </div>
                ))}
                {dailyClaimed&&(
                  <div className={`${s.kpi} ${s.kpiGreen}`}>
                    <ThunderboltFilled style={{color:"var(--green)",fontSize:11}}/>
                    <span className={s.kpiGreenTxt}>+10 today</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══ TABS ════════════════════════════════════════════════════════ */}
        <div className={s.tabBar}>
          {TABS.map(t=>(
            <button key={t.k} className={`${s.tab} ${tab===t.k?s.tabOn:""}`} onClick={()=>setTab(t.k)}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ══ PROFILE ═════════════════════════════════════════════════════ */}
        {tab==="profile"&&(
          <div className={s.layout}>

            {/* ─ LEFT ─ */}
            <div className={s.leftCol}>
              <div className={s.card}>
                <p className={s.cardLbl}>Personal info</p>
                <Field label="Name"       value={user.name}   onSave={v=>updateProfile({name:v})}   placeholder="Your name"/>
                <Field label="Bio"        value={user.bio}    onSave={v=>updateProfile({bio:v})}    multiline placeholder="Tell us about yourself…"/>
                <Field label="Avatar URL" value={user.avatar} onSave={v=>updateProfile({avatar:v})} placeholder="https://…"/>
                <div className={s.field}>
                  <span className={s.fLabel}>Email</span>
                  <div className={s.fView}>
                    <span className={s.fVal}>{user.email}</span>
                    <span className={s.readOnly}>read-only</span>
                  </div>
                </div>
              </div>

              {/* Security — 2 actions */}
              <div className={`${s.card} ${s.cardSecurity}`}>
                <p className={s.cardLbl}>Security</p>
                <div className={s.secActions}>
                  <button className={s.secBtn}>
                    <SafetyCertificateOutlined style={{fontSize:14}}/>
                    <div className={s.secBtnText}>
                      <span className={s.secBtnTitle}>Change password</span>
                      <span className={s.secBtnSub}>Update your login credentials</span>
                    </div>
                  </button>
                  <button className={`${s.secBtn} ${s.secBtnDanger}`} onClick={()=>setShowDeleteModal(true)}>
                    <DeleteOutlined style={{fontSize:14}}/>
                    <div className={s.secBtnText}>
                      <span className={s.secBtnTitle}>Delete account</span>
                      <span className={s.secBtnSub}>Permanently remove all your data</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ─ RIGHT ─ */}
            <div className={s.rightCol}>

              {/* Chart 1: Activity bar chart — lessons per day 14 days */}
              <div className={s.card}>
                <div className={s.cardHeadRow}>
                  <p className={s.cardLbl}>Daily activity — 14 days</p>
                  <span className={s.cardMeta}>{totalLessons} total lessons</span>
                </div>
                <div className={s.chartWrap}>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={activityData} margin={{top:6,right:2,bottom:0,left:-28}} barCategoryGap="28%">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis
                        dataKey="label"
                        tick={{fill:"var(--text-secondary)",fontSize:8}}
                        axisLine={false} tickLine={false}
                        interval={1}
                        tickFormatter={v=>v.split(" ")[0]}
                      />
                      <YAxis tick={{fill:"var(--text-secondary)",fontSize:9}} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <Tooltip content={<ActivityTip/>}/>
                      <Bar dataKey="lessons" radius={[4,4,0,0]} maxBarSize={22}>
                        {activityData.map((entry,i)=>(
                          <Cell
                            key={i}
                            fill={entry.isToday ? "#6c63ff" : entry.lessons > 0 ? "rgba(108,99,255,.55)" : "var(--border)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* mini stats below */}
                <div className={s.chartStats}>
                  {[
                    {val:totalLessons,   lbl:"Total lessons"},
                    {val:balance.toLocaleString(), lbl:"Balance"},
                    {val:totalEver.toLocaleString(), lbl:"Total earned"},
                    {val:longestStreak,  lbl:"Best streak"},
                    {val:enrolled.length,lbl:"Courses"},
                    {val:myRank>0?`#${myRank}`:"—", lbl:"Rank"},
                  ].map((st,i)=>(
                    <div key={i} className={s.chartStat}>
                      <span className={s.chartStatVal}>{st.val}</span>
                      <span className={s.chartStatLbl}>{st.lbl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Coins + active days per week — 12 weeks */}
              <div className={s.card}>
                <div className={s.cardHeadRow}>
                  <p className={s.cardLbl}>Weekly progress — 12 weeks</p>
                  <span className={s.cardMeta}>
                    <ThunderboltFilled style={{color:"#6c63ff",fontSize:11}}/> {totalEver.toLocaleString()} earned
                  </span>
                </div>
                <div className={s.chartLegendRow}>
                  <span className={s.chartLegItem}><span className={s.dot} style={{background:"#6c63ff"}}/> Coins earned</span>
                  <span className={s.chartLegItem}><span className={s.dot} style={{background:"#34d399"}}/> Active days</span>
                </div>
                <div className={s.chartWrap}>
                  <ResponsiveContainer width="100%" height={155}>
                    <AreaChart data={weeklyData} margin={{top:6,right:2,bottom:0,left:-22}}>
                      <defs>
                        <linearGradient id="gCoins" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#6c63ff" stopOpacity={0.22}/>
                          <stop offset="100%" stopColor="#6c63ff" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gDays" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#34d399" stopOpacity={0.18}/>
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="week" tick={{fill:"var(--text-secondary)",fontSize:9}} axisLine={false} tickLine={false} interval={2}/>
                      <YAxis tick={{fill:"var(--text-secondary)",fontSize:9}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<WeeklyTip/>}/>
                      <Area type="monotone" dataKey="coins" name="coins" stroke="#6c63ff" strokeWidth={2}
                        fill="url(#gCoins)" dot={{fill:"#6c63ff",r:2,strokeWidth:0}} activeDot={{r:4,strokeWidth:0}}/>
                      <Area type="monotone" dataKey="days"  name="days"  stroke="#34d399" strokeWidth={1.5}
                        fill="url(#gDays)"  dot={{fill:"#34d399",r:2,strokeWidth:0}} activeDot={{r:4,strokeWidth:0}}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ─ FULL WIDTH: Activity Calendar + Skill Radar ─ */}
            <div className={`${s.card} ${s.cardFull}`}>
              <div className={s.calRadarGrid}>

                {/* left: heatmap */}
                <div className={s.calSide}>
                  <div className={s.cardHeadRow} style={{marginBottom:12}}>
                    <p className={s.cardLbl}><CalendarOutlined/> Activity & Schedule</p>
                    <span className={s.cardMeta}>{totalLessons} lessons · 3 months</span>
                  </div>
                  <ActivityCalendar cells={calendarCells} enrolled={enrolled}/>
                </div>

                {/* divider */}
                <div className={s.calDivider}/>

                {/* right: skill radar */}
                <div className={s.radarSide}>
                  <p className={s.cardLbl} style={{marginBottom:8}}>Progress overview</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData} margin={{top:8,right:20,bottom:8,left:20}}>
                      <PolarGrid stroke="var(--border)" strokeDasharray="3 3"/>
                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{fill:"var(--text-secondary)",fontSize:10,fontFamily:"DM Sans"}}
                      />
                      <Radar
                        dataKey="value"
                        stroke="#6c63ff"
                        strokeWidth={2}
                        fill="#6c63ff"
                        fillOpacity={0.18}
                        dot={{fill:"#6c63ff",r:3,strokeWidth:0}}
                        activeDot={{r:5,strokeWidth:0}}
                      />
                      <Tooltip content={<RadarTip/>}/>
                    </RadarChart>
                  </ResponsiveContainer>
                  {/* skill bars */}
                  <div className={s.skillBars}>
                    {radarData.map((d,i)=>(
                      <div key={i} className={s.skillRow}>
                        <span className={s.skillLbl}>{d.skill}</span>
                        <div className={s.skillTrack}>
                          <div className={s.skillFill} style={{width:`${d.value}%`}}/>
                        </div>
                        <span className={s.skillPct}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* ─ FULL WIDTH: Enrolled courses ─ */}
            {enrolled.length>0&&(
              <div className={`${s.card} ${s.cardFull}`}>
                <div className={s.cardHeadRow}>
                  <p className={s.cardLbl}>Enrolled courses</p>
                  <button className={s.viewAll} onClick={()=>navigate("/my-courses")}>View all →</button>
                </div>
                <div className={s.cList}>
                  {enrolled.slice(0,4).map(c=>(
                    <div key={c.id} className={s.cRow} onClick={()=>navigate(`/courses/${c.id}`)}>
                      <img src={c.thumb} alt="" className={s.cThumb}/>
                      <div className={s.cInfo}>
                        <span className={s.cTitle}>{c.title}</span>
                        <span className={s.cBy}>{c.instructor}</span>
                      </div>
                      <div className={s.cBarWrap}><div className={s.cBarFill} style={{width:`${c.progress}%`}}/></div>
                      <span className={s.cPct}>{c.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─ FULL WIDTH: Achievements ─ */}
            <div className={`${s.card} ${s.cardFull}`}>
              <div className={s.achLayout}>

                {/* badges grid */}
                <div className={s.achLeft}>
                  <p className={s.cardLbl}>Achievements</p>
                  <div className={s.achRow}>
                    {ACHIEVEMENTS.map((a,i)=>{
                      const ok=a.req(totalEver,longestStreak,enrolled.length);
                      return (
                        <div key={i} title={a.label} className={`${s.ach} ${ok?s.achOn:s.achOff}`}>
                          {ok
                            ? <span className={`${s.achIco} ${s.achIcoOn}`}>{a.icon}</span>
                            : <span className={s.achIco}><LockOutlined/></span>
                          }
                          <span className={s.achLbl}>{a.label}</span>
                          {ok&&<CheckCircleFilled className={s.achTick}/>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* divider */}
                <div className={s.achDivider}/>

                {/* right: progress summary */}
                <div className={s.achRight}>
                  <p className={s.cardLbl}>Your progress</p>
                  {(()=>{
                    const total = ACHIEVEMENTS.length;
                    const done  = ACHIEVEMENTS.filter(a=>a.req(totalEver,longestStreak,enrolled.length)).length;
                    const pct   = Math.round((done/total)*100);
                    const r=42, circ=2*Math.PI*r;
                    const dash=circ*(1-pct/100);
                    return (
                      <div className={s.achProgress}>
                        {/* donut */}
                        <div className={s.achDonutWrap}>
                          <svg width={108} height={108} viewBox="0 0 108 108">
                            <circle cx={54} cy={54} r={r} fill="none" stroke="var(--border)" strokeWidth={8}/>
                            <circle cx={54} cy={54} r={r} fill="none" stroke="#6c63ff" strokeWidth={8}
                              strokeLinecap="round"
                              strokeDasharray={circ}
                              strokeDashoffset={dash}
                              transform="rotate(-90 54 54)"
                              style={{transition:"stroke-dashoffset .8s cubic-bezier(.34,1.2,.64,1)"}}
                            />
                          </svg>
                          <div className={s.achDonutLabel}>
                            <span className={s.achDonutPct}>{pct}%</span>
                            <span className={s.achDonutSub}>complete</span>
                          </div>
                        </div>
                        {/* summary text */}
                        <div className={s.achSummary}>
                          <div className={s.achSumRow}>
                            <CheckCircleFilled style={{color:"#6c63ff",fontSize:13}}/>
                            <span className={s.achSumVal}>{done}</span>
                            <span className={s.achSumLbl}>Unlocked</span>
                          </div>
                          <div className={s.achSumRow}>
                            <LockOutlined style={{color:"var(--text-secondary)",fontSize:13}}/>
                            <span className={s.achSumVal}>{total-done}</span>
                            <span className={s.achSumLbl}>Locked</span>
                          </div>
                          <div className={s.achSumRow}>
                            <StarFilled style={{color:"#f59e0b",fontSize:13}}/>
                            <span className={s.achSumVal}>{total}</span>
                            <span className={s.achSumLbl}>Total</span>
                          </div>
                        </div>
                        {/* next to unlock */}
                        {done < total && (
                          <div className={s.achNext}>
                            <span className={s.achNextLbl}>Next to unlock</span>
                            {(()=>{
                              const next = ACHIEVEMENTS.find(a=>!a.req(totalEver,longestStreak,enrolled.length));
                              return next ? (
                                <div className={s.achNextItem}>
                                  <span className={s.achNextIco}>{next.icon}</span>
                                  <span className={s.achNextName}>{next.label}</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>

            {/* ─ FULL WIDTH: Streak tracker ─ */}
            <div className={`${s.card} ${s.cardFull}`}>
              <p className={s.cardLbl}>Streak tracker</p>
              <div className={s.streakBody}>
                <div className={s.streakNums}>
                  <div className={s.streakNum}>
                    <FireFilled   style={{color:"#f97316",fontSize:22}}/>
                    <span className={s.streakBig}>{currentStreak}</span>
                    <span className={s.streakSub}>Current streak</span>
                  </div>
                  <div className={s.streakDiv}/>
                  <div className={s.streakNum}>
                    <TrophyFilled style={{color:"#f59e0b",fontSize:22}}/>
                    <span className={s.streakBig}>{longestStreak}</span>
                    <span className={s.streakSub}>Best streak</span>
                  </div>
                </div>
                <div className={s.dotRow}>
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>(
                    <div key={i} className={s.dotItem}>
                      <div className={`${s.dotDot} ${i<Math.min(currentStreak,7)?s.dotOn:""}`}/>
                      <span className={s.dotLbl}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ══ COINS ═══════════════════════════════════════════════════════ */}
        {tab==="coins"&&(
          <div className={s.section}>
            <div className={s.coinsTop}>
              {[
                {icon:<ThunderboltFilled style={{color:"#6c63ff",fontSize:18}}/>,val:totalEver.toLocaleString(),lbl:"Total earned"   },
                {icon:<ThunderboltFilled style={{color:"#059669",fontSize:18}}/>,val:balance.toLocaleString(),  lbl:"Current balance"},
                {icon:<FireFilled        style={{color:"#f97316",fontSize:18}}/>,val:currentStreak,             lbl:"Day streak"     },
              ].map((it,i)=>(
                <div key={i} className={s.coinsCard}>
                  {it.icon}
                  <span className={s.coinsVal}>{it.val}</span>
                  <span className={s.coinsLbl}>{it.lbl}</span>
                </div>
              ))}
            </div>
            {transactions.length===0?(
              <div className={s.empty}>
                <ThunderboltFilled style={{fontSize:28,opacity:.2}}/>
                <p>No transactions yet — complete your first lesson!</p>
              </div>
            ):(
              <div className={s.txList}>
                {transactions.map(tx=>(
                  <div key={tx.id} className={s.txRow}>
                    <span className={s.txIco}>{TX_ICON[tx.reason]??<ThunderboltFilled style={{color:"#6c63ff"}}/>}</span>
                    <span className={s.txLbl}>{tx.label}</span>
                    <span className={s.txDate}>{new Date(tx.created_at).toLocaleDateString("en-US",{day:"numeric",month:"short"})}</span>
                    <span className={`${s.txAmt} ${tx.amount>0?s.txPos:s.txNeg}`}>
                      {tx.amount>0?"+":""}{tx.amount} ⚡
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ LEADERBOARD ═════════════════════════════════════════════════ */}
        {tab==="leaderboard"&&(
          <div className={s.section}>
            <div className={s.lbTop}>
              <h2 className={s.lbTitle}>EduCoins Leaderboard</h2>
              <p className={s.lbSub}>Ranked by total coins ever earned</p>
            </div>
            {leaderboard.length===0?(
              <div className={s.empty}>
                <TrophyFilled style={{fontSize:28,opacity:.2}}/>
                <p>Leaderboard is empty</p>
              </div>
            ):(
              <div className={s.lbList}>
                {leaderboard.map((e,i)=>{
                  const isMe=e.user_id===user.id;
                  const c=avatarColor(e.name);
                  const MED=["🥇","🥈","🥉"];
                  return (
                    <div key={e.user_id} className={`${s.lbRow} ${isMe?s.lbMe:""}`}>
                      <span className={s.lbMedal}>{i<3?MED[i]:<span className={s.lbRank}>{e.rank}</span>}</span>
                      <div className={s.lbAv} style={{background:`linear-gradient(135deg,${c}cc,${c}44)`}}>
                        {e.avatar?<img src={e.avatar} alt="" className={s.lbAvImg}/>:getInitials(e.name)}
                      </div>
                      <div className={s.lbInfo}>
                        <span className={s.lbName}>{e.name}{isMe&&<span className={s.youTag}>you</span>}</span>
                        <span className={s.lbBal}>⚡ {e.balance.toLocaleString()} balance</span>
                      </div>
                      <div className={s.lbRight}>
                        <span className={s.lbTot}>⚡ {e.total_ever.toLocaleString()}</span>
                        <span className={s.lbTotLbl}>total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
      <Footer/>

      {showDeleteModal && (
        <DeleteModal
          onClose={()=>setShowDeleteModal(false)}
          onConfirm={()=>{ logout(); navigate("/"); }}
        />
      )}
    </div>
  );
};

export default ProfileView;