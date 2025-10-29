import { useState } from 'react';
import { useUI } from '../../store/ui';

export function useLoginRequired() {
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title?: string;
    message?: string;
  }>({});
  const { openAuth } = useUI();

  const showLoginRequiredModal = (config?: { title?: string; message?: string }) => {
    setModalConfig(config || {});
    setShowLoginRequired(true);
  };

  const hideLoginRequiredModal = () => {
    setShowLoginRequired(false);
    setModalConfig({});
  };

  const handleLogin = () => {
    hideLoginRequiredModal();
    // Open login modal
    openAuth('login');
  };

  return {
    showLoginRequired,
    modalConfig,
    showLoginRequiredModal,
    hideLoginRequiredModal,
    handleLogin
  };
}
