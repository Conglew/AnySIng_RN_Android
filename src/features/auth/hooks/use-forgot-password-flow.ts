import { useCallback, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

import {
  ForgotPasswordCopy,
  ForgotPasswordStep,
} from '@/src/features/auth/i18n/forgot-password-copy';
import {
  isValidEmail,
  isValidPassword,
  normalizeVerificationCode,
} from '@/src/features/auth/utils/auth-validation';

type UseForgotPasswordFlowParams = {
  forgotCopy: ForgotPasswordCopy;
  onBackToLogin: () => void;
  pushDebugLog?: (message: string) => void;
};

export function useForgotPasswordFlow({
  forgotCopy,
  onBackToLogin,
  pushDebugLog,
}: UseForgotPasswordFlowParams) {
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationCodeError, setVerificationCodeError] = useState('');

  const [resendSeconds, setResendSeconds] = useState(0);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [isLeaveConfirmVisible, setIsLeaveConfirmVisible] = useState(false);

  const isEmailValid = isValidEmail(forgotPasswordEmail);

  const resetForgotPasswordFlow = useCallback(() => {
    setForgotPasswordStep('email');
    setForgotPasswordEmail('');
    setVerificationCode('');
    setVerificationCodeError('');
    setResendSeconds(0);
    setNewPassword('');
    setConfirmNewPassword('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setIsForgotSubmitting(false);
  }, []);

  const getForgotPasswordHasProgress = useCallback(() => {
    return (
      forgotPasswordStep !== 'email' ||
      forgotPasswordEmail.trim().length > 0 ||
      verificationCode.length > 0 ||
      newPassword.length > 0 ||
      confirmNewPassword.length > 0
    );
  }, [forgotPasswordStep, forgotPasswordEmail, verificationCode, newPassword, confirmNewPassword]);

  const requestBackToLoginCanvas = useCallback(() => {
    if (getForgotPasswordHasProgress()) {
      setIsLeaveConfirmVisible(true);
      return;
    }

    onBackToLogin();
  }, [getForgotPasswordHasProgress, onBackToLogin]);

  const confirmLeaveForgotPassword = useCallback(() => {
    setIsLeaveConfirmVisible(false);
    resetForgotPasswordFlow();
    onBackToLogin();
  }, [onBackToLogin, resetForgotPasswordFlow]);

  const cancelLeaveForgotPassword = useCallback(() => {
    setIsLeaveConfirmVisible(false);
  }, []);

  const handleSendForgotPasswordCode = useCallback(async () => {
    const normalizedEmail = forgotPasswordEmail.trim();

    if (!isValidEmail(normalizedEmail) || isForgotSubmitting) {
      return;
    }

    setIsForgotSubmitting(true);
    pushDebugLog?.('[ForgotPassword] send code pressed');

    try {
      // TODO: 之後改成 authClient.sendForgotCode({ email: normalizedEmail })
      await new Promise((resolve) => setTimeout(resolve, 600));

      setForgotPasswordStep('code');
      setVerificationCode('');
      setVerificationCodeError('');
      setResendSeconds(90);

      pushDebugLog?.('[ForgotPassword] mock code sent');
    } finally {
      setIsForgotSubmitting(false);
    }
  }, [forgotPasswordEmail, isForgotSubmitting, pushDebugLog]);

  const handleVerificationCodeChange = useCallback((value: string) => {
    const normalizedCode = normalizeVerificationCode(value);

    setVerificationCodeError('');
    setVerificationCode(normalizedCode);
  }, []);

  const handleResetPasswordSubmit = useCallback(async () => {
    setNewPasswordError('');
    setConfirmPasswordError('');

    if (!isValidPassword(newPassword)) {
      setNewPasswordError(forgotCopy.requiredError);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError(forgotCopy.passwordMismatchError);
      return;
    }

    setIsForgotSubmitting(true);
    pushDebugLog?.('[ForgotPassword] reset password pressed');

    try {
      // TODO: 之後改成 authClient.resetPassword({
      //   email: forgotPasswordEmail.trim(),
      //   code: verificationCode,
      //   password: newPassword,
      // })

      await new Promise((resolve) => setTimeout(resolve, 700));

      setForgotPasswordStep('success');
      pushDebugLog?.('[ForgotPassword] reset password success');

      setTimeout(() => {
        resetForgotPasswordFlow();
        onBackToLogin();
      }, 1200);
    } catch {
      setConfirmPasswordError(forgotCopy.resetFailed);
    } finally {
      setIsForgotSubmitting(false);
    }
  }, [
    confirmNewPassword,
    forgotCopy.passwordMismatchError,
    forgotCopy.requiredError,
    forgotCopy.resetFailed,
    forgotPasswordEmail,
    newPassword,
    onBackToLogin,
    pushDebugLog,
    resetForgotPasswordFlow,
    verificationCode,
  ]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [resendSeconds]);

  useEffect(() => {
    if (forgotPasswordStep !== 'code') {
      return;
    }

    if (verificationCode.length !== 5) {
      return;
    }

    Keyboard.dismiss();

    const verifyCode = async () => {
      setIsForgotSubmitting(true);
      pushDebugLog?.(`[ForgotPassword] mock verify code=${verificationCode}`);

      try {
        // TODO: 之後改成 authClient.verifyResetCode({
        //   email: forgotPasswordEmail.trim(),
        //   code: verificationCode,
        // })

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock 規則：12345 代表驗證成功
        if (verificationCode !== '12345') {
          setVerificationCodeError(forgotCopy.codeError);
          pushDebugLog?.('[ForgotPassword] code invalid');
          return;
        }

        setVerificationCodeError('');
        setForgotPasswordStep('resetPassword');
        pushDebugLog?.('[ForgotPassword] code valid');
      } catch {
        setVerificationCodeError(forgotCopy.verifyFailed);
      } finally {
        setIsForgotSubmitting(false);
      }
    };

    verifyCode();
  }, [
    forgotCopy.codeError,
    forgotCopy.verifyFailed,
    forgotPasswordEmail,
    forgotPasswordStep,
    pushDebugLog,
    verificationCode,
  ]);

  return {
    forgotPasswordStep,
    forgotPasswordEmail,
    setForgotPasswordEmail,

    verificationCode,
    verificationCodeError,

    resendSeconds,

    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    newPasswordError,
    setNewPasswordError,
    confirmPasswordError,
    setConfirmPasswordError,

    isForgotSubmitting,
    isEmailValid,
    isLeaveConfirmVisible,

    handleSendForgotPasswordCode,
    handleVerificationCodeChange,
    handleResetPasswordSubmit,

    requestBackToLoginCanvas,
    confirmLeaveForgotPassword,
    cancelLeaveForgotPassword,
  };
}
