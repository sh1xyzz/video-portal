// src/widgets/AuthModal/AuthModal.jsx
// Полностью рабочая модалка — подключена к useAuthStore

import { useState, useEffect } from "react";
import { Input, Checkbox } from "antd";
import {
  CloseOutlined, MailOutlined, LockOutlined, UserOutlined,
  EyeInvisibleOutlined, EyeTwoTone,
  GoogleOutlined, GithubOutlined, LoadingOutlined,
} from "@ant-design/icons";
import useAuthStore from "@/shared/store/useAuthStore";
import s from "./AuthModal.module.css";

const AuthModal = ({ open, onClose, defaultMode = "login" }) => {
  const [mode,     setMode]     = useState(defaultMode);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [agree,    setAgree]    = useState(false);
  const [fieldErr, setFieldErr] = useState({});

  const { login, register, loading, error, clearError } = useAuthStore();

  // Синхронизируем mode с пропом
  useEffect(() => { setMode(defaultMode); }, [defaultMode]);

  // Очищаем при закрытии
  useEffect(() => {
    if (!open) {
      setName(""); setEmail(""); setPassword("");
      setFieldErr({}); clearError();
    }
  }, [open]);

  if (!open) return null;

  const isLogin = mode === "login";

  const validate = () => {
    const errs = {};
    if (!isLogin && name.trim().length < 2) errs.name = "Минимум 2 символа";
    if (!/\S+@\S+\.\S+/.test(email))        errs.email = "Некорректный email";
    if (password.length < 8)                 errs.password = "Минимум 8 символов";
    if (!isLogin && !agree)                  errs.agree = "Примите условия";
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const result = isLogin
      ? await login({ email, password })
      : await register({ name, email, password });

    if (result.ok) onClose();
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const switchMode = (m) => {
    setMode(m); setFieldErr({}); clearError();
  };

  return (
    <div className={s.backdrop} onClick={handleBackdrop}>
      <div className={s.modal}>
        <button className={s.closeBtn} onClick={onClose}>
          <CloseOutlined />
        </button>
        <div className={s.glow} />

        {/* Tabs */}
        <div className={s.tabs}>
          <button className={`${s.tab} ${isLogin ? s.tabActive : ""}`} onClick={() => switchMode("login")}>
            Sign In
          </button>
          <button className={`${s.tab} ${!isLogin ? s.tabActive : ""}`} onClick={() => switchMode("register")}>
            Sign Up
          </button>
          <div className={s.tabIndicator} style={{ transform: isLogin ? "translateX(0)" : "translateX(100%)" }} />
        </div>

        {/* Heading */}
        <div className={s.heading}>
          <h2 className={s.title}>
            {isLogin ? "Welcome back 👋" : "Join EduStream 🚀"}
          </h2>
          <p className={s.subtitle}>
            {isLogin
              ? "Sign in to continue your learning journey"
              : "Start learning from world-class instructors"}
          </p>
        </div>

        {/* Social (заглушки) */}
        <div className={s.socials}>
          <button className={s.socialBtn}><GoogleOutlined className={s.socialIcon} /><span>Google</span></button>
          <button className={s.socialBtn}><GithubOutlined className={s.socialIcon} /><span>GitHub</span></button>
        </div>

        <div className={s.divider}>
          <span className={s.dividerLine} />
          <span className={s.dividerText}>or continue with email</span>
          <span className={s.dividerLine} />
        </div>

        {/* Global error */}
        {error && (
          <div className={s.globalError}>{error}</div>
        )}

        {/* Fields */}
        <div className={s.fields}>
          {!isLogin && (
            <div className={s.field}>
              <Input
                prefix={<UserOutlined className={s.icon} />}
                placeholder="Full name"
                value={name}
                onChange={e => { setName(e.target.value); setFieldErr(p => ({ ...p, name: "" })); }}
                className={`${s.input} ${fieldErr.name ? s.inputError : ""}`}
                size="large"
                onPressEnter={handleSubmit}
              />
              {fieldErr.name && <p className={s.fieldError}>{fieldErr.name}</p>}
            </div>
          )}

          <div className={s.field}>
            <Input
              prefix={<MailOutlined className={s.icon} />}
              placeholder="Email address"
              value={email}
              onChange={e => { setEmail(e.target.value); setFieldErr(p => ({ ...p, email: "" })); }}
              className={`${s.input} ${fieldErr.email ? s.inputError : ""}`}
              size="large"
              onPressEnter={handleSubmit}
            />
            {fieldErr.email && <p className={s.fieldError}>{fieldErr.email}</p>}
          </div>

          <div className={s.field}>
            <Input.Password
              prefix={<LockOutlined className={s.icon} />}
              placeholder={isLogin ? "Password" : "Create password (min 8 chars)"}
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldErr(p => ({ ...p, password: "" })); }}
              className={`${s.input} ${fieldErr.password ? s.inputError : ""}`}
              size="large"
              iconRender={v => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              onPressEnter={handleSubmit}
            />
            {fieldErr.password && <p className={s.fieldError}>{fieldErr.password}</p>}
          </div>

          {isLogin ? (
            <div className={s.forgotRow}>
              <Checkbox className={s.remember}>Remember me</Checkbox>
              <button className={s.forgotLink}>Forgot password?</button>
            </div>
          ) : (
            <div>
              <Checkbox
                className={s.agree}
                checked={agree}
                onChange={e => { setAgree(e.target.checked); setFieldErr(p => ({ ...p, agree: "" })); }}
              >
                I agree to the <span className={s.link}>Terms</span> &{" "}
                <span className={s.link}>Privacy Policy</span>
              </Checkbox>
              {fieldErr.agree && <p className={s.fieldError}>{fieldErr.agree}</p>}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          className={s.submitBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <><LoadingOutlined /> {isLogin ? "Signing in…" : "Creating account…"}</>
            : isLogin ? "Sign In" : "Create Account"
          }
        </button>

        {/* Toggle */}
        <p className={s.toggle}>
          {isLogin ? "No account? " : "Already registered? "}
          <button className={s.toggleLink} onClick={() => switchMode(isLogin ? "register" : "login")}>
            {isLogin ? "Sign up free →" : "Sign in →"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;