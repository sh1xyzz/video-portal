import { CheckCircleFilled, RocketFilled, ArrowRightOutlined } from "@ant-design/icons";
import s from "./CTASection.module.css";

const PERKS = [
  "Lifetime access to all content",
  "Certificate of completion",
  "30-day money-back guarantee",
  "Learn at your own pace",
];

const CtaSection = () => (
  <section className={s.root}>
    {/* texture + glows */}
    <div className={s.glowL} />
    <div className={s.glowR} />
    <div className={s.noise} />

    <div className={s.inner}>
      {/* left: text */}
      <div className={s.left}>
        <p className={s.eyebrow}>Start today — it's risk-free</p>
        <h2 className={s.title}>
          Your next<br />
          <span className={s.titleAccent}>career move</span><br />
          starts here.
        </h2>
        <ul className={s.perks}>
          {PERKS.map(p => (
            <li key={p} className={s.perk}>
              <CheckCircleFilled className={s.checkIco} />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* right: card */}
      <div className={s.right}>
        <div className={s.card}>
          <div className={s.cardHead}>
            <span className={s.cardLabel}>Join 340,000+ learners</span>
            <div className={s.cardAvatars}>
              {["#6c63ff","#ff6584","#43e97b","#ffd166"].map((bg, i) => (
                <div key={i} className={s.cardAvatar} style={{ background: bg }} />
              ))}
            </div>
          </div>

          <div className={s.cardPrice}>
            <span className={s.priceFrom}>From</span>
            <span className={s.priceVal}>$0</span>
            <span className={s.priceSub}>/ course</span>
          </div>

          <button className={s.ctaBtn}>
            <RocketFilled />
            Browse All Courses
            <ArrowRightOutlined style={{ fontSize: 12 }} />
          </button>

          <button className={s.secondBtn}>
            Watch a free preview
          </button>

          <p className={s.cardNote}>No credit card required · Cancel anytime</p>
        </div>

        {/* floating badge */}
        <div className={s.badge}>
          <span className={s.badgeEmoji}>🏆</span>
          <div>
            <span className={s.badgeTitle}>Top Rated</span>
            <span className={s.badgeSub}>4.9 ★ avg rating</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CtaSection;