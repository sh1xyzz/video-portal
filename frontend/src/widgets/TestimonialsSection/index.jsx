import { useQuery, gql } from "@apollo/client";
import { Avatar, Rate } from "antd";
import s from "./TestimonialsSection.module.css";

const GET_TESTIMONIALS = gql`
  query {
    testimonials {
      id
      name
      role
      avatar
      color
      rating
      text
    }
  }
`;

// ── Skeleton карточка пока грузится ───────────────────────────────────────
const SkeletonCard = () => (
  <div className={`${s.card} ${s.skeletonCard}`}>
    <div className={s.skeletonStars} />
    <div className={s.skeletonText} />
    <div className={s.skeletonText} style={{ width: "70%" }} />
    <div className={s.skeletonAuthor}>
      <div className={s.skeletonAvatar} />
      <div>
        <div className={s.skeletonLine} style={{ width: 100 }} />
        <div className={s.skeletonLine} style={{ width: 70, marginTop: 6 }} />
      </div>
    </div>
  </div>
);

// ── Одна карточка ─────────────────────────────────────────────────────────
const TestimonialCard = ({ t }) => (
  <div className={s.card}>
    <div className={s.cardTop}>
      <Rate disabled defaultValue={t.rating} className={s.stars} />
      <span className={s.cardAccent} style={{ background: t.color }} />
    </div>
    <p className={s.text}>"{t.text}"</p>
    <div className={s.author}>
      <Avatar
        size={40}
        style={{ background: t.color, fontWeight: 700, flexShrink: 0 }}
      >
        {t.avatar}
      </Avatar>
      <div>
        <p className={s.authorName}>{t.name}</p>
        <p className={s.authorRole}>{t.role}</p>
      </div>
    </div>
  </div>
);

// ── Бесконечная полоса (marquee) ──────────────────────────────────────────
const MarqueeTrack = ({ items, reverse = false }) => {
  // Дублируем для плавного бесконечного скролла
  const doubled = [...items, ...items];

  return (
    <div className={s.trackWrap}>
      <div className={`${s.track} ${reverse ? s.trackReverse : ""}`}>
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.id}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
};

// ── Главный компонент ─────────────────────────────────────────────────────
const TestimonialsSection = () => {
  const { data, loading, error } = useQuery(GET_TESTIMONIALS, {
    fetchPolicy: "cache-and-network",
  });

  const items = data?.testimonials ?? [];

  // Делим на две строки для двойного marquee эффекта
  const half = Math.ceil(items.length / 1);
  const row1 = items.slice(0, half);
  const row2 = items.slice(half);

  const renderRows = () => {
    if (error) {
      return (
        <div className={s.errorBox}>
          <span>⚠️ Не удалось загрузить отзывы</span>
        </div>
      );
    }

    if (loading) {
      // Показываем скелетоны в одну строку
      return (
        <div className={s.trackWrap}>
          <div className={s.track} style={{ animationPlayState: "paused" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className={s.emptyBox}>
          <span>💬 Отзывы появятся совсем скоро</span>
        </div>
      );
    }

    // Если мало отзывов — одна строка, если много — две
    if (items.length <= 4) {
      return <MarqueeTrack items={items} />;
    }

    return (
      <>
        <MarqueeTrack items={row1} />
        <MarqueeTrack items={row2} reverse />
      </>
    );
  };

  return (
    <section className={s.root}>
      <div className={s.head}>
        <p className={s.tag}>Community</p>
        <h2 className={s.title}>What students say</h2>
        <p className={s.sub}>
          Join thousands of learners who transformed their careers
        </p>
      </div>

      <div className={s.marqueeWrap}>
        {renderRows()}
      </div>

      <div className={s.fadeLeft} />
      <div className={s.fadeRight} />
    </section>
  );
};

export default TestimonialsSection;