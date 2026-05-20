import { useCallback, useEffect, useRef, useState } from 'react';

import type { ForgotPasswordCopy } from '@/src/features/auth/i18n/forgot-password-copy';
import { authClient } from '@/src/services/auth/auth-client';

type ForgotPasswordStep = 'email' | 'code' | 'resetPassword' | 'success';

type ResetPasswordPhase = 'newPassword' | 'confirmPassword';

type UseForgotPasswordFlowParams = {
  forgotCopy: ForgotPasswordCopy;
  onBackToLogin: () => void;
  pushDebugLog?: (message: string) => void;
};

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9!@#|><_.]{8,}$/;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeVerificationCode(value: string) {
  return value.replace(/[^0-9]/g, '').slice(0, 5);
}

export function useForgotPasswordFlow({
  forgotCopy,
  onBackToLogin,
  pushDebugLog,
}: UseForgotPasswordFlowParams) {
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');

  const [resetPasswordPhase, setResetPasswordPhase] = useState<ResetPasswordPhase>('newPassword');

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const [verificationCode, setVerificationCode] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [verificationCodeError, setVerificationCodeError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [resendSeconds, setResendSeconds] = useState(0);

  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const [isLeaveConfirmVisible, setIsLeaveConfirmVisible] = useState(false);

  const successTimeoutRef = useRef<number | null>(null);

  const isEmailValid = isValidEmail(forgotPasswordEmail);

  const isValidPassword = useCallback((value: string) => {
    return PASSWORD_PATTERN.test(value);
  }, []);

  const resetForgotPasswordFlow = useCallback(() => {
    setForgotPasswordStep('email');

    setResetPasswordPhase('newPassword');

    setForgotPasswordEmail('');

    setVerificationCode('');

    setNewPassword('');
    setConfirmNewPassword('');

    setVerificationCodeError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    setResendSeconds(0);

    setIsForgotSubmitting(false);

    setIsLeaveConfirmVisible(false);
  }, []);

  /**
   * cleanup success timeout
   */
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current !== null) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  /**
   * resend countdown
   */
  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((current) => current - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [resendSeconds]);

  /**
   * auto verify code
   */
  useEffect(() => {
    if (forgotPasswordStep !== 'code' || verificationCode.length !== 5 || isForgotSubmitting) {
      return;
    }

    const verifyCode = async () => {
      const currentCode = verificationCode;

      setIsForgotSubmitting(true);

      pushDebugLog?.(`[ForgotPassword] verify code request code=${currentCode}`);

      try {
        await authClient.verifyResetCode({
          email: forgotPasswordEmail.trim(),
          code: currentCode,
        });

        /**
         * race condition protect
         */
        if (currentCode !== verificationCode) {
          return;
        }

        setVerificationCodeError('');

        setResetPasswordPhase('newPassword');

        setForgotPasswordStep('resetPassword');

        pushDebugLog?.('[ForgotPassword] verify code success');
      } catch (error) {
        console.log('[ForgotPassword] verify code failed:', error);

        setVerificationCode('');

        setVerificationCodeError(error instanceof Error ? error.message : forgotCopy.codeError);
      } finally {
        setIsForgotSubmitting(false);
      }
    };

    verifyCode();
  }, [
    forgotCopy.codeError,
    forgotPasswordEmail,
    forgotPasswordStep,
    isForgotSubmitting,
    pushDebugLog,
    verificationCode,
  ]);

  const handleSendForgotPasswordCode = useCallback(async () => {
    const normalizedEmail = forgotPasswordEmail.trim();

    if (!isValidEmail(normalizedEmail) || isForgotSubmitting) {
      return;
    }

    setIsForgotSubmitting(true);

    pushDebugLog?.('[ForgotPassword] send code pressed');

    try {
      await authClient.sendForgotCode({
        email: normalizedEmail,
      });

      setForgotPasswordStep('code');

      setVerificationCode('');

      setVerificationCodeError('');

      setResendSeconds(90);

      pushDebugLog?.('[ForgotPassword] code sent success');
    } catch (error) {
      console.log('[ForgotPassword] send forgot code failed:', error);

      setVerificationCodeError(error instanceof Error ? error.message : forgotCopy.verifyFailed);
    } finally {
      setIsForgotSubmitting(false);
    }
  }, [forgotCopy.verifyFailed, forgotPasswordEmail, isForgotSubmitting, pushDebugLog]);

  const handleVerificationCodeChange = useCallback(
    (value: string) => {
      if (isForgotSubmitting) {
        return;
      }

      const normalizedCode = normalizeVerificationCode(value);

      setVerificationCodeError('');

      setVerificationCode(normalizedCode);
    },
    [isForgotSubmitting],
  );

  const handleResetPasswordSubmit = useCallback(async () => {
    /**
     * Step 1
     * new password
     */
    if (resetPasswordPhase === 'newPassword') {
      if (!isValidPassword(newPassword)) {
        setNewPasswordError('密碼至少8位，包含大小寫英文與數字');
        return;
      }

      setNewPasswordError('');

      setResetPasswordPhase('confirmPassword');

      return;
    }

    /**
     * Step 2
     * confirm password
     */
    if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError('兩次密碼輸入不一致');

      return;
    }

    setConfirmPasswordError('');

    setIsForgotSubmitting(true);

    pushDebugLog?.('[ForgotPassword] reset password submit');

    try {
      await authClient.resetPassword({
        email: forgotPasswordEmail.trim(),
        code: verificationCode,
        password: newPassword,
      });

      setForgotPasswordStep('success');

      pushDebugLog?.('[ForgotPassword] reset password success');

      successTimeoutRef.current = setTimeout(() => {
        resetForgotPasswordFlow();

        onBackToLogin();
      }, 5000);
    } catch (error) {
      console.log('[ForgotPassword] reset password failed:', error);

      setConfirmPasswordError(error instanceof Error ? error.message : forgotCopy.resetFailed);
    } finally {
      setIsForgotSubmitting(false);
    }
  }, [
    confirmNewPassword,
    forgotCopy.resetFailed,
    forgotPasswordEmail,
    isValidPassword,
    newPassword,
    onBackToLogin,
    pushDebugLog,
    resetForgotPasswordFlow,
    resetPasswordPhase,
    verificationCode,
  ]);

  return {
    forgotPasswordStep,

    resetPasswordPhase,

    forgotPasswordEmail,
    setForgotPasswordEmail,

    verificationCode,

    newPassword,
    setNewPassword,

    confirmNewPassword,
    setConfirmNewPassword,

    verificationCodeError,
    setVerificationCodeError,

    newPasswordError,
    setNewPasswordError,

    confirmPasswordError,
    setConfirmPasswordError,

    resendSeconds,

    isForgotSubmitting,

    isLeaveConfirmVisible,
    setIsLeaveConfirmVisible,

    isEmailValid,

    isValidPassword,

    handleSendForgotPasswordCode,

    handleVerificationCodeChange,

    handleResetPasswordSubmit,

    resetForgotPasswordFlow,

    requestBackToLoginCanvas: () => {
      const hasEditing =
        forgotPasswordEmail.length > 0 ||
        verificationCode.length > 0 ||
        newPassword.length > 0 ||
        confirmNewPassword.length > 0;

      if (hasEditing) {
        setIsLeaveConfirmVisible(true);
        return;
      }

      resetForgotPasswordFlow();
      onBackToLogin();
    },

    confirmLeaveForgotPassword: () => {
      setIsLeaveConfirmVisible(false);

      resetForgotPasswordFlow();

      onBackToLogin();
    },

    cancelLeaveForgotPassword: () => {
      setIsLeaveConfirmVisible(false);
    },
  };
}
