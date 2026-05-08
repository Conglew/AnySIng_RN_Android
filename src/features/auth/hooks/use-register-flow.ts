import { useCallback, useEffect, useMemo, useState } from 'react';

import { RegisterCopy, RegisterStep } from '@/src/features/auth/i18n/register-copy';

type UseRegisterFlowParams = {
  registerCopy: RegisterCopy;
  onBackToLogin: () => void;
  pushDebugLog?: (message: string) => void;
};

type ResetPasswordPhase = 'newPassword' | 'confirmPassword';

const RESEND_SECONDS = 60;

export function useRegisterFlow({
  registerCopy,
  onBackToLogin,
  pushDebugLog,
}: UseRegisterFlowParams) {
  const [registerStep, setRegisterStep] = useState<RegisterStep>('email');

  const [registerEmail, setRegisterEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationCodeError, setVerificationCodeError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [resetPasswordPhase, setResetPasswordPhase] = useState<ResetPasswordPhase>('newPassword');

  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const [isLeaveConfirmVisible, setIsLeaveConfirmVisible] = useState(false);

  const isRegisterEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.trim());
  }, [registerEmail]);

  useEffect(() => {
    if (registerStep !== 'code') {
      return;
    }

    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [registerStep, resendSeconds]);

  useEffect(() => {
    if (registerStep !== 'success') {
      return;
    }

    const timer = setTimeout(() => {
      onBackToLogin();
    }, 1600);

    return () => {
      clearTimeout(timer);
    };
  }, [onBackToLogin, registerStep]);

  const resetRegisterFlow = useCallback(() => {
    setRegisterStep('email');

    setRegisterEmail('');
    setVerificationCode('');
    setVerificationCodeError('');

    setNewPassword('');
    setConfirmNewPassword('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setResetPasswordPhase('newPassword');

    setIsRegisterSubmitting(false);
    setResendSeconds(0);
    setIsLeaveConfirmVisible(false);
  }, []);

  const handleSendRegisterCode = useCallback(async () => {
    if (isRegisterSubmitting) {
      return;
    }

    if (!isRegisterEmailValid) {
      return;
    }

    setIsRegisterSubmitting(true);
    setVerificationCode('');
    setVerificationCodeError('');

    try {
      const normalizedEmail = registerEmail.trim();

      pushDebugLog?.(`[RegisterFlow] send register code email=${normalizedEmail}`);

      /*
       * 後端 API 接好後，這裡改成：
       *
       * await authService.sendRegisterCode({
       *   email: normalizedEmail,
       * });
       */

      setRegisterStep('code');
      setResendSeconds(RESEND_SECONDS);
    } catch (error) {
      const message = error instanceof Error ? error.message : registerCopy.verifyFailed;

      setVerificationCodeError(message);
      pushDebugLog?.(`[RegisterFlow] send code failed: ${message}`);
    } finally {
      setIsRegisterSubmitting(false);
    }
  }, [
    isRegisterEmailValid,
    isRegisterSubmitting,
    pushDebugLog,
    registerCopy.verifyFailed,
    registerEmail,
  ]);

  const handleVerificationCodeChange = useCallback(
    async (value: string) => {
      const onlyNumbers = value.replace(/\D/g, '').slice(0, 5);

      setVerificationCode(onlyNumbers);
      setVerificationCodeError('');

      if (onlyNumbers.length < 5) {
        return;
      }

      setIsRegisterSubmitting(true);

      try {
        pushDebugLog?.(`[RegisterFlow] verify code=${onlyNumbers}`);

        /*
         * 後端 API 接好後，這裡改成：
         *
         * await authService.verifyRegisterCode({
         *   email: registerEmail.trim(),
         *   code: onlyNumbers,
         * });
         *
         * 目前先讓 5 碼輸入完成後進入設定密碼階段。
         */

        setRegisterStep('resetPassword');
      } catch (error) {
        const message = error instanceof Error ? error.message : registerCopy.verifyFailed;

        setVerificationCodeError(message);
        pushDebugLog?.(`[RegisterFlow] verify code failed: ${message}`);
      } finally {
        setIsRegisterSubmitting(false);
      }
    },
    [pushDebugLog, registerCopy.verifyFailed],
  );

  const validatePassword = useCallback((password: string) => {
    /*
     * 規則：
     * 至少 8 碼
     * 至少一個小寫英文
     * 至少一個大寫英文
     * 至少一個數字
     * 只允許英文字母、數字、常用符號 ! @ # | > _ < .
     */
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#|>_<.]{8,}$/;

    return passwordRegex.test(password);
  }, []);

  const handleRegisterPasswordSubmit = useCallback(async () => {
    if (isRegisterSubmitting) {
      return;
    }

    if (resetPasswordPhase === 'newPassword') {
      if (!newPassword) {
        setNewPasswordError(registerCopy.requiredError);
        return;
      }

      if (!validatePassword(newPassword)) {
        setNewPasswordError(registerCopy.resetDescription);
        return;
      }

      setNewPasswordError('');
      setResetPasswordPhase('confirmPassword');
      return;
    }

    if (!confirmNewPassword) {
      setConfirmPasswordError(registerCopy.requiredError);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError(registerCopy.passwordMismatchError);
      return;
    }

    setIsRegisterSubmitting(true);

    try {
      pushDebugLog?.('[RegisterFlow] submit register password');

      /*
       * 後端 API 接好後，這裡改成：
       *
       * await authService.completeRegister({
       *   email: registerEmail.trim(),
       *   code: verificationCode,
       *   password: newPassword,
       * });
       */

      setRegisterStep('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : registerCopy.resetFailed;

      setConfirmPasswordError(message);
      pushDebugLog?.(`[RegisterFlow] register failed: ${message}`);
    } finally {
      setIsRegisterSubmitting(false);
    }
  }, [
    confirmNewPassword,
    isRegisterSubmitting,
    newPassword,
    pushDebugLog,
    registerCopy.passwordMismatchError,
    registerCopy.requiredError,
    registerCopy.resetDescription,
    registerCopy.resetFailed,
    resetPasswordPhase,
    validatePassword,
  ]);

  const requestBackToLoginCanvas = useCallback(() => {
    if (registerStep === 'email') {
      resetRegisterFlow();
      onBackToLogin();
      return;
    }

    setIsLeaveConfirmVisible(true);
  }, [onBackToLogin, registerStep, resetRegisterFlow]);

  const confirmLeaveRegister = useCallback(() => {
    resetRegisterFlow();
    onBackToLogin();
  }, [onBackToLogin, resetRegisterFlow]);

  const cancelLeaveRegister = useCallback(() => {
    setIsLeaveConfirmVisible(false);
  }, []);

  return {
    registerStep,
    setRegisterStep,

    registerEmail,
    setRegisterEmail,
    isRegisterEmailValid,

    verificationCode,
    verificationCodeError,
    setVerificationCodeError,
    handleVerificationCodeChange,

    newPassword,
    setNewPassword,
    newPasswordError,
    setNewPasswordError,

    confirmNewPassword,
    setConfirmNewPassword,
    confirmPasswordError,
    setConfirmPasswordError,

    resetPasswordPhase,

    isRegisterSubmitting,
    resendSeconds,

    isLeaveConfirmVisible,

    handleSendRegisterCode,
    handleRegisterPasswordSubmit,

    requestBackToLoginCanvas,
    confirmLeaveRegister,
    cancelLeaveRegister,

    resetRegisterFlow,
  };
}
