// src/pages/NotFound/NotFoundPage.jsx
import { useNavigate } from "react-router-dom";
import Header from "@/widgets/Header";
import Footer from "@/widgets/Footer";
import s from "./NotFoundView.module.css";

const NotFoundView = () => {
  const navigate = useNavigate();
  return (
    <div className={s.root}>
      <Header />
      <div className={s.body}>
        <div className={s.code}>404</div>
        <h1 className={s.title}>Page not found</h1>
        <p className={s.sub}>The page you're looking for doesn't exist or was moved.</p>
        <div className={s.actions}>
          <button className={s.homeBtn} onClick={() => navigate("/")}>← Home</button>
          <button className={s.coursesBtn} onClick={() => navigate("/courses")}>Browse Courses</button>
        </div>
      </div>
      <Footer />
    </div>
  );
};
export default NotFoundView;