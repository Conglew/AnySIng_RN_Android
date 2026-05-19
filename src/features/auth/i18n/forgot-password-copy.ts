// src/features/auth/i18n/forgot-password-copy.ts
import type { LanguageValue } from '@/src/shared/i18n/language.store';

// export type LanguageValue = 'zh-CN' | 'zh-TW' | 'en' | 'ms';

export type ForgotPasswordStep = 'email' | 'code' | 'resetPassword' | 'success';

export type ForgotPasswordCopy = {
  title: string;
  descriptionBefore: string;
  descriptionHighlight: string;
  descriptionAfter: string;
  emailLabel: string;
  emailPlaceholder: string;
  sendButton: string;
  sentNotice: string;
  resendCountdown: (seconds: number) => string;
  resendButton: string;
  codeLabel: string;
  codeHint: string;
  codeError: string;
  verifyFailed: string;
  resetTitle: string;
  resetDescription: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  passwordPlaceholder: string;
  requiredError: string;
  passwordMismatchError: string;
  resetButton: string;
  resetFailed: string;
  successMessage: string;
  leaveTitle: string;
  leaveDescription: string;
  leaveButton: string;
  continueButton: string;
};

export const FORGOT_PASSWORD_FLOW_COPY: Record<LanguageValue, ForgotPasswordCopy> = {
  'zh-CN': {
    title: '放心，我们将帮您找回密码。',
    descriptionBefore: '请输入您的注册电子邮件，我们将发送重设密码的',
    descriptionHighlight: '验证码',
    descriptionAfter: '到您的信箱内。',

    emailLabel: '电子邮件',
    emailPlaceholder: 'Example@example.com',
    sendButton: '发送',

    sentNotice: '已发送电子邮件，请前往信箱查看。',
    resendCountdown: (seconds) => `${seconds}s 后可重新发送验证码`,
    resendButton: '重新发送验证码',

    codeLabel: '验证码',
    codeHint: '请输入验证码',
    codeError: '验证码错误',
    verifyFailed: '验证失败，请稍后再试',

    resetTitle: '重设密码',
    resetDescription:
      '密码至少 8 个字，包含大小写英文和数字。只接受英文字母、数字和常用符号（!@#|>_<）。',
    newPasswordLabel: '新密码',
    confirmPasswordLabel: '再次输入新密码',
    passwordPlaceholder: '至少8位英数字',
    requiredError: '必填',
    passwordMismatchError: '密码不一致',
    resetButton: '完成',
    resetFailed: '重设密码失败，请稍后再试',

    successMessage: '恭喜，密码已经重设完成，即将返回登录页。',
    leaveTitle: '尚未完成，要离开此页面？',
    leaveDescription: '离开后将不会保留此流程',
    leaveButton: '离开',
    continueButton: '继续',
  },

  'zh-TW': {
    title: '放心，我們將幫您找回密碼。',
    descriptionBefore: '請輸入您的註冊電子郵件，我們將發送重設密碼的',
    descriptionHighlight: '驗證碼',
    descriptionAfter: '到您的信箱內。',

    emailLabel: '電子郵件',
    emailPlaceholder: 'Example@example.com',
    sendButton: '發送',

    sentNotice: '已發送電子郵件，請前往信箱查看。',
    resendCountdown: (seconds) => `${seconds}S 後可重新發送驗證碼`,
    resendButton: '重新發送驗證碼',

    codeLabel: '驗證碼',
    codeHint: '請輸入驗證碼',
    codeError: '驗證碼錯誤',
    verifyFailed: '驗證失敗，請稍後再試',

    resetTitle: '重設密碼',
    resetDescription:
      '密碼至少 8 個字，包含大小寫英文和數字。只接受英文字母、數字和常用符號（!@#|>_<）。',
    newPasswordLabel: '新密碼',
    confirmPasswordLabel: '再次輸入新密碼',
    passwordPlaceholder: '至少8位英數字',
    requiredError: '必填',
    passwordMismatchError: '密碼不一致',
    resetButton: '完成',
    resetFailed: '重設密碼失敗，請稍後再試',

    successMessage: '恭喜，密碼已經重設完成，即將返回登入頁。',
    leaveTitle: '尚未完成，要離開此頁面？',
    leaveDescription: '離開後將不會保留此流程',
    leaveButton: '離開',
    continueButton: '繼續',
  },

  en: {
    title: "Don't worry, we'll help you recover your password.",
    descriptionBefore: 'Enter your registered email. We will send a password reset ',
    descriptionHighlight: 'verification code',
    descriptionAfter: ' to your inbox.',

    emailLabel: 'Email',
    emailPlaceholder: 'Example@example.com',
    sendButton: 'Send',

    sentNotice: 'Email sent. Please check your inbox.',
    resendCountdown: (seconds) => `You can resend the code in ${seconds}s`,
    resendButton: 'Resend code',

    codeLabel: 'Verification Code',
    codeHint: 'Enter the verification code',
    codeError: 'Incorrect verification code',
    verifyFailed: 'Verification failed. Please try again later.',

    resetTitle: 'Reset Password',
    resetDescription:
      'Password must be at least 8 characters and include uppercase letters, lowercase letters, and numbers. Allowed symbols: !@#|>_<.',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
    passwordPlaceholder: 'At least 8 characters',
    requiredError: 'Required',
    passwordMismatchError: 'Passwords do not match',
    resetButton: 'Complete',
    resetFailed: 'Password reset failed. Please try again later.',

    successMessage: 'Your password has been reset. Returning to login.',
    leaveTitle: 'Leave before completing this process?',
    leaveDescription: 'Your progress will not be saved.',
    leaveButton: 'Leave',
    continueButton: 'Continue',
  },

  ms: {
    title: 'Jangan risau, kami akan bantu pulihkan kata laluan anda.',
    descriptionBefore: 'Masukkan e-mel berdaftar anda. Kami akan menghantar ',
    descriptionHighlight: 'kod pengesahan',
    descriptionAfter: ' untuk tetapan semula kata laluan ke peti masuk anda.',

    emailLabel: 'E-mel',
    emailPlaceholder: 'Example@example.com',
    sendButton: 'Hantar',

    sentNotice: 'E-mel telah dihantar. Sila semak peti masuk anda.',
    resendCountdown: (seconds) => `Anda boleh hantar semula kod dalam ${seconds}s`,
    resendButton: 'Hantar semula kod',

    codeLabel: 'Kod Pengesahan',
    codeHint: 'Masukkan kod pengesahan',
    codeError: 'Kod pengesahan salah',
    verifyFailed: 'Pengesahan gagal. Sila cuba lagi kemudian.',

    resetTitle: 'Tetapkan Semula Kata Laluan',
    resetDescription:
      'Kata laluan mesti sekurang-kurangnya 8 aksara dan mengandungi huruf besar, huruf kecil, serta nombor. Simbol dibenarkan: !@#|>_<.',
    newPasswordLabel: 'Kata Laluan Baharu',
    confirmPasswordLabel: 'Sahkan Kata Laluan Baharu',
    passwordPlaceholder: 'Sekurang-kurangnya 8 aksara',
    requiredError: 'Wajib diisi',
    passwordMismatchError: 'Kata laluan tidak sepadan',
    resetButton: 'Selesai',
    resetFailed: 'Tetapan semula kata laluan gagal. Sila cuba lagi kemudian.',

    successMessage: 'Kata laluan anda telah ditetapkan semula. Kembali ke halaman log masuk.',
    leaveTitle: 'Keluar sebelum proses selesai?',
    leaveDescription: 'Kemajuan anda tidak akan disimpan.',
    leaveButton: 'Keluar',
    continueButton: 'Teruskan',
  },
};
