import { Button, Space } from "antd";
import s from "./Footer.module.css";

const FOOTER_LINKS = ["Privacy", "Terms", "Contact"];

const Footer = () => (
  <footer className={s.footer}>
    <div className={s.logo}>⚡ EduStream</div>

    <p className={s.copy}>© 2025 EduStream · Educational Video Portal</p>

    <Space className={s.links}>
      {FOOTER_LINKS.map((link) => (
        <Button key={link} type="text" size="small" className={s.footerLink}>
          {link}
        </Button>
      ))}
    </Space>
  </footer>
);

export default Footer;