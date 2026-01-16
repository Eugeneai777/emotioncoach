import { useState, useEffect } from 'react';

const TERMS_AGREED_KEY = 'terms_agreed_permanent';

export const useTermsAgreement = () => {
  const [isAgreed, setIsAgreedState] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取永久记忆的协议同意状态
    const savedAgreement = localStorage.getItem(TERMS_AGREED_KEY);
    if (savedAgreement === 'true') {
      setIsAgreedState(true);
    }
  }, []);

  const setAgreed = (agreed: boolean) => {
    setIsAgreedState(agreed);
    if (agreed) {
      // 永久记忆：一旦同意，下次自动勾选
      localStorage.setItem(TERMS_AGREED_KEY, 'true');
    }
  };

  return { isAgreed, setAgreed };
};
