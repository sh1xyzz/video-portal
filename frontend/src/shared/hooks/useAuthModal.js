import { useState } from "react";

/**
 * useAuthModal — управление состоянием модала авторизации
 *
 * Использование:
 *   const { isOpen, mode, openLogin, openRegister, close } = useAuthModal();
 */
const useAuthModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("login");

  const openLogin = () => {
    setMode("login");
    setIsOpen(true);
  };
  const openRegister = () => {
    setMode("register");
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  return { isOpen, mode, openLogin, openRegister, close };
};

export default useAuthModal;
