import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authClient } from '@/src/services/auth/auth-client';
import { saveAuthSession } from '@/src/services/auth/auth-token-store';
import {
  clearRememberedLogin,
  getRememberedLogin,
  saveRememberedLogin,
} from '@/src/services/auth/remembered-login-store';

import { ForgotPasswordCanvas } from '@/src/features/auth/components/forgot-password-canvas';

type LanguageValue = 'zh-CN' | 'zh-TW' | 'en' | 'ms';

type AuthCanvasMode = 'login' | 'register' | 'forgotPassword';

type LoginCopy = {
  register: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberMe: string;
  loginButton: string;
  forgotPassword: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
};

type SecondaryCanvasCopy = {
  title: string;
  descriptionBefore: string;
  descriptionHighlight: string;
  descriptionAfter: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitButton: string;
};

// type ForgotPasswordCopy = {
//   title: string;
//   descriptionBefore: string;
//   descriptionHighlight: string;
//   descriptionAfter: string;

//   emailLabel: string;
//   emailPlaceholder: string;
//   sendButton: string;

//   sentNotice: string;
//   resendCountdown: (seconds: number) => string;
//   resendButton: string;

//   codeLabel: string;
//   codeHint: string;
//   codeError: string;
//   verifyFailed: string;

//   resetTitle: string;
//   resetDescription: string;
//   newPasswordLabel: string;
//   confirmPasswordLabel: string;
//   passwordPlaceholder: string;
//   requiredError: string;
//   passwordMismatchError: string;
//   resetButton: string;
//   resetFailed: string;

//   successMessage: string;

//   leaveTitle: string;
//   leaveDescription: string;
//   leaveButton: string;
//   continueButton: string;
// };

type LoginLanguageOption = {
  label: string;
  value: LanguageValue;
};

// type ForgotPasswordStep = 'email' | 'code' | 'resetPassword' | 'success';

// type LeaveConfirmTarget = 'login' | null;

const LOGIN_LANGUAGE_OPTIONS: LoginLanguageOption[] = [
  {
    label: '簡體中文',
    value: 'zh-CN',
  },
  {
    label: '繁體中文',
    value: 'zh-TW',
  },
  {
    label: 'English',
    value: 'en',
  },
  {
    label: 'Bahasa Melayu',
    value: 'ms',
  },
];

const LOGIN_COPY: Record<LanguageValue, LoginCopy> = {
  'zh-CN': {
    register: '前往注册',
    emailLabel: '账号',
    emailPlaceholder: '请输入电子邮件',
    passwordLabel: '密码',
    passwordPlaceholder: '6-12位英数字',
    rememberMe: '记住账号密码',
    loginButton: '登录',
    forgotPassword: '忘记密码',
    welcomeTitle: '欢迎回来',
    welcomeSubtitle: '登录立即开唱',
  },
  'zh-TW': {
    register: '前往註冊',
    emailLabel: '帳號',
    emailPlaceholder: '請輸入電子郵件',
    passwordLabel: '密碼',
    passwordPlaceholder: '6-12位英數字',
    rememberMe: '記住帳號密碼',
    loginButton: '登入',
    forgotPassword: '忘記密碼',
    welcomeTitle: '歡迎回來',
    welcomeSubtitle: '登入立即開唱',
  },
  en: {
    register: 'Register',
    emailLabel: 'Email',
    emailPlaceholder: 'Please enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: '6-12 alphanumeric characters',
    rememberMe: 'Remember me',
    loginButton: 'Login',
    forgotPassword: 'Forgot password',
    welcomeTitle: 'Welcome Back!',
    welcomeSubtitle: 'Log in && Singing.',
  },
  ms: {
    register: 'Daftar',
    emailLabel: 'E-mel',
    emailPlaceholder: 'Sila masukkan e-mel anda',
    passwordLabel: 'Kata laluan',
    passwordPlaceholder: '6-12 aksara alfanumerik',
    rememberMe: 'Ingat saya',
    loginButton: 'Log Masuk',
    forgotPassword: 'Terlupa kata laluan',
    welcomeTitle: 'Selamat kembali!',
    welcomeSubtitle: 'Log Masuk Mula Menyanyi.',
  },
};

const REGISTER_COPY: Record<LanguageValue, SecondaryCanvasCopy> = {
  'zh-CN': {
    title: '快速注册账号',
    descriptionBefore: '此电子邮件将用于未来登录账号使用。',
    descriptionHighlight: '',
    descriptionAfter: '',
    emailLabel: '电子邮件',
    emailPlaceholder: 'Example@example.com',
    submitButton: '送出',
  },
  'zh-TW': {
    title: '快速註冊帳號',
    descriptionBefore: '此電子郵件將用於未來登入帳號使用。',
    descriptionHighlight: '',
    descriptionAfter: '',
    emailLabel: '電子郵件',
    emailPlaceholder: 'Example@example.com',
    submitButton: '送出',
  },
  en: {
    title: 'Quick Sign-Up',
    descriptionBefore: 'This email will be used to log in to your account in the future.',
    descriptionHighlight: '',
    descriptionAfter: '',
    emailLabel: 'Email',
    emailPlaceholder: 'Example@example.com',
    submitButton: 'Submit',
  },
  ms: {
    title: 'Daftar Pantas',
    descriptionBefore: 'E-mel ini akan digunakan untuk log masuk ke akaun anda pada masa hadapan.',
    descriptionHighlight: '',
    descriptionAfter: '',
    emailLabel: 'E-mel',
    emailPlaceholder: 'Example@example.com',
    submitButton: 'Hantar',
  },
};

// const FORGOT_PASSWORD_COPY: Record<LanguageValue, SecondaryCanvasCopy> = {
//   'zh-CN': {
//     title: '放心，我们将帮您找回密码。',
//     descriptionBefore: '请输入您的注册电子邮件，我们将发送重设密码的',
//     descriptionHighlight: '验证码',
//     descriptionAfter: '到您的信箱内。',
//     emailLabel: '电子邮件',
//     emailPlaceholder: 'Example@example.com',
//     submitButton: '发送',
//   },
//   'zh-TW': {
//     title: '放心，我們將幫您找回密碼。',
//     descriptionBefore: '請輸入您的註冊電子郵件，我們將發送重設密碼的',
//     descriptionHighlight: '驗證碼',
//     descriptionAfter: '到您的信箱內。',
//     emailLabel: '電子郵件',
//     emailPlaceholder: 'Example@example.com',
//     submitButton: '發送',
//   },
//   en: {
//     title: "Don't worry, we'll help you recover your password.",
//     descriptionBefore: 'Enter your registered email. We will send a password reset ',
//     descriptionHighlight: 'verification code',
//     descriptionAfter: ' to your inbox.',
//     emailLabel: 'Email',
//     emailPlaceholder: 'Example@example.com',
//     submitButton: 'Send',
//   },
//   ms: {
//     title: 'Jangan risau, kami akan bantu pulihkan kata laluan anda.',
//     descriptionBefore: 'Masukkan e-mel berdaftar anda. Kami akan menghantar ',
//     descriptionHighlight: 'kod pengesahan',
//     descriptionAfter: ' untuk tetapan semula kata laluan ke peti masuk anda.',
//     emailLabel: 'E-mel',
//     emailPlaceholder: 'Example@example.com',
//     submitButton: 'Hantar',
//   },
// };

// const FORGOT_PASSWORD_FLOW_COPY: Record<LanguageValue, ForgotPasswordCopy> = {
//   'zh-CN': {
//     title: '放心，我们将帮您找回密码。',
//     descriptionBefore: '请输入您的注册电子邮件，我们将发送重设密码的',
//     descriptionHighlight: '验证码',
//     descriptionAfter: '到您的信箱内。',

//     emailLabel: '电子邮件',
//     emailPlaceholder: 'Example@example.com',
//     sendButton: '发送',

//     sentNotice: '已发送电子邮件，请前往信箱查看。',
//     resendCountdown: (seconds) => `${seconds}s 后可重新发送验证码`,
//     resendButton: '重新发送验证码',

//     codeLabel: '验证码',
//     codeHint: '请输入验证码',
//     codeError: '验证码错误',
//     verifyFailed: '验证失败，请稍后再试',

//     resetTitle: '重设密码',
//     resetDescription:
//       '密码至少 8 个字，包含大小写英文和数字。只接受英文字母、数字和常用符号（!@#|>_<）。',
//     newPasswordLabel: '新密码',
//     confirmPasswordLabel: '再次输入新密码',
//     passwordPlaceholder: '至少8位英数字',
//     requiredError: '必填',
//     passwordMismatchError: '密码不一致',
//     resetButton: '完成',
//     resetFailed: '重设密码失败，请稍后再试',

//     successMessage: '恭喜，密码已经重设完成，即将返回登录页。',
//     leaveTitle: '尚未完成，要离开此页面？',
//     leaveDescription: '离开后将不会保留此流程',
//     leaveButton: '离开',
//     continueButton: '继续',
//   },

//   'zh-TW': {
//     title: '放心，我們將幫您找回密碼。',
//     descriptionBefore: '請輸入您的註冊電子郵件，我們將發送重設密碼的',
//     descriptionHighlight: '驗證碼',
//     descriptionAfter: '到您的信箱內。',

//     emailLabel: '電子郵件',
//     emailPlaceholder: 'Example@example.com',
//     sendButton: '發送',

//     sentNotice: '已發送電子郵件，請前往信箱查看。',
//     resendCountdown: (seconds) => `${seconds}S 後可重新發送驗證碼`,
//     resendButton: '重新發送驗證碼',

//     codeLabel: '驗證碼',
//     codeHint: '請輸入驗證碼',
//     codeError: '驗證碼錯誤',
//     verifyFailed: '驗證失敗，請稍後再試',

//     resetTitle: '重設密碼',
//     resetDescription:
//       '密碼至少 8 個字，包含大小寫英文和數字。只接受英文字母、數字和常用符號（!@#|>_<）。',
//     newPasswordLabel: '新密碼',
//     confirmPasswordLabel: '再次輸入新密碼',
//     passwordPlaceholder: '至少8位英數字',
//     requiredError: '必填',
//     passwordMismatchError: '密碼不一致',
//     resetButton: '完成',
//     resetFailed: '重設密碼失敗，請稍後再試',

//     successMessage: '恭喜，密碼已經重設完成，即將返回登入頁。',
//     leaveTitle: '尚未完成，要離開此頁面？',
//     leaveDescription: '離開後將不會保留此流程',
//     leaveButton: '離開',
//     continueButton: '繼續',
//   },

//   en: {
//     title: "Don't worry, we'll help you recover your password.",
//     descriptionBefore: 'Enter your registered email. We will send a password reset ',
//     descriptionHighlight: 'verification code',
//     descriptionAfter: ' to your inbox.',

//     emailLabel: 'Email',
//     emailPlaceholder: 'Example@example.com',
//     sendButton: 'Send',

//     sentNotice: 'Email sent. Please check your inbox.',
//     resendCountdown: (seconds) => `You can resend the code in ${seconds}s`,
//     resendButton: 'Resend code',

//     codeLabel: 'Verification Code',
//     codeHint: 'Enter the verification code',
//     codeError: 'Incorrect verification code',
//     verifyFailed: 'Verification failed. Please try again later.',

//     resetTitle: 'Reset Password',
//     resetDescription:
//       'Password must be at least 8 characters and include uppercase letters, lowercase letters, and numbers. Allowed symbols: !@#|>_<.',
//     newPasswordLabel: 'New Password',
//     confirmPasswordLabel: 'Confirm New Password',
//     passwordPlaceholder: 'At least 8 characters',
//     requiredError: 'Required',
//     passwordMismatchError: 'Passwords do not match',
//     resetButton: 'Complete',
//     resetFailed: 'Password reset failed. Please try again later.',

//     successMessage: 'Your password has been reset. Returning to login.',
//     leaveTitle: 'Leave before completing this process?',
//     leaveDescription: 'Your progress will not be saved.',
//     leaveButton: 'Leave',
//     continueButton: 'Continue',
//   },

//   ms: {
//     title: 'Jangan risau, kami akan bantu pulihkan kata laluan anda.',
//     descriptionBefore: 'Masukkan e-mel berdaftar anda. Kami akan menghantar ',
//     descriptionHighlight: 'kod pengesahan',
//     descriptionAfter: ' untuk tetapan semula kata laluan ke peti masuk anda.',

//     emailLabel: 'E-mel',
//     emailPlaceholder: 'Example@example.com',
//     sendButton: 'Hantar',

//     sentNotice: 'E-mel telah dihantar. Sila semak peti masuk anda.',
//     resendCountdown: (seconds) => `Anda boleh hantar semula kod dalam ${seconds}s`,
//     resendButton: 'Hantar semula kod',

//     codeLabel: 'Kod Pengesahan',
//     codeHint: 'Masukkan kod pengesahan',
//     codeError: 'Kod pengesahan salah',
//     verifyFailed: 'Pengesahan gagal. Sila cuba lagi kemudian.',

//     resetTitle: 'Tetapkan Semula Kata Laluan',
//     resetDescription:
//       'Kata laluan mesti sekurang-kurangnya 8 aksara dan mengandungi huruf besar, huruf kecil, serta nombor. Simbol dibenarkan: !@#|>_<.',
//     newPasswordLabel: 'Kata Laluan Baharu',
//     confirmPasswordLabel: 'Sahkan Kata Laluan Baharu',
//     passwordPlaceholder: 'Sekurang-kurangnya 8 aksara',
//     requiredError: 'Wajib diisi',
//     passwordMismatchError: 'Kata laluan tidak sepadan',
//     resetButton: 'Selesai',
//     resetFailed: 'Tetapan semula kata laluan gagal. Sila cuba lagi kemudian.',

//     successMessage: 'Kata laluan anda telah ditetapkan semula. Kembali ke halaman log masuk.',
//     leaveTitle: 'Keluar sebelum proses selesai?',
//     leaveDescription: 'Kemajuan anda tidak akan disimpan.',
//     leaveButton: 'Keluar',
//     continueButton: 'Teruskan',
//   },
// };

function normalizeLanguage(value: unknown): LanguageValue {
  if (value === 'zh-CN' || value === 'zh-TW' || value === 'en' || value === 'ms') {
    return value;
  }

  return 'zh-TW';
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ lang?: string }>();

  const initialLanguage = useMemo(() => {
    return normalizeLanguage(params.lang);
  }, [params.lang]);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const secondaryEmailInputRef = useRef<TextInput>(null);

  const [language, setLanguage] = useState<LanguageValue>(initialLanguage);
  const [canvasMode, setCanvasMode] = useState<AuthCanvasMode>('login');
  const [isLanguagePanelVisible, setIsLanguagePanelVisible] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [secondaryEmail, setSecondaryEmail] = useState('');
  // const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');

  // const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  // const verificationCodeInputRef = useRef<TextInput>(null);
  // const [verificationCode, setVerificationCode] = useState('');
  // const [verificationCodeDigits, setVerificationCodeDigits] = useState(['', '', '', '', '']);
  // const [verificationCodeError, setVerificationCodeError] = useState('');

  // const [resendSeconds, setResendSeconds] = useState(0);

  // const [newPassword, setNewPassword] = useState('');
  // const [confirmNewPassword, setConfirmNewPassword] = useState('');
  // const [newPasswordError, setNewPasswordError] = useState('');
  // const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // const [leaveConfirmTarget, setLeaveConfirmTarget] = useState<LeaveConfirmTarget>(null);

  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const pushDebugLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();

    setDebugLogs((currentLogs) => {
      const nextLogs = [`${time} ${message}`, ...currentLogs];

      return nextLogs.slice(0, 12);
    });

    console.log(message);
  }, []);

  useEffect(() => {
    const keyboardShowSub = Keyboard.addListener('keyboardDidShow', (event) => {
      pushDebugLog(`[Keyboard] keyboardDidShow height=${event.endCoordinates.height}`);
    });

    const keyboardHideSub = Keyboard.addListener('keyboardDidHide', () => {
      pushDebugLog('[Keyboard] keyboardDidHide');
    });

    return () => {
      keyboardShowSub.remove();
      keyboardHideSub.remove();
    };
  }, [pushDebugLog]);

  useEffect(() => {
    const restoreRememberedLogin = async () => {
      try {
        const rememberedLogin = await getRememberedLogin();

        if (!rememberedLogin) {
          pushDebugLog('[RememberLogin] no remembered login');
          return;
        }

        setEmail(rememberedLogin.email);
        setPassword(rememberedLogin.password);
        setRememberMe(rememberedLogin.rememberMe);

        pushDebugLog('[RememberLogin] restored email and password');
      } catch (error) {
        pushDebugLog(
          `[RememberLogin] restore failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    };

    restoreRememberedLogin();
  }, [pushDebugLog]);

  useEffect(() => {
    pushDebugLog(`[Canvas] mode=${canvasMode}, language=${language}`);
  }, [canvasMode, language, pushDebugLog]);

  // useEffect(() => {
  //   if (resendSeconds <= 0) {
  //     return;
  //   }

  //   const timer = setTimeout(() => {
  //     setResendSeconds((current) => Math.max(current - 1, 0));
  //   }, 1000);

  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [resendSeconds]);

  const loginCopy = LOGIN_COPY[language];
  // const forgotCopy = FORGOT_PASSWORD_FLOW_COPY[language];

  // const secondaryCopy =
  //   canvasMode === 'register' ? REGISTER_COPY[language] : FORGOT_PASSWORD_COPY[language];

  const secondaryCopy = REGISTER_COPY[language];

  const getBackButtonPositionStyle = () => {
    const isChineseLanguage = language === 'zh-CN' || language === 'zh-TW';

    if (canvasMode === 'register') {
      return isChineseLanguage ? styles.backButtonRegisterChinese : styles.backButtonRegisterOther;
    }

    if (canvasMode === 'forgotPassword') {
      return isChineseLanguage
        ? styles.backButtonForgotPasswordChinese
        : styles.backButtonForgotPasswordOther;
    }

    return styles.backButtonRegisterChinese;
  };

  const focusInputWithLog = (inputRef: React.RefObject<TextInput | null>, inputName: string) => {
    pushDebugLog(`[${inputName}] force focus scheduled`);

    setTimeout(() => {
      pushDebugLog(`[${inputName}] force focus execute`);
      inputRef.current?.focus();
    }, 50);
  };

  const handleLogin = async () => {
    if (isLoginSubmitting) {
      return;
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      pushDebugLog('[LoginScreen] login failed: email or password is empty');
      return;
    }

    setIsLoginSubmitting(true);
    pushDebugLog('[LoginScreen] login pressed');

    try {
      const session = await authClient.login({
        email: normalizedEmail,
        password,
      });

      await saveAuthSession(session);

      if (rememberMe) {
        await saveRememberedLogin({
          email: normalizedEmail,
          password,
        });

        pushDebugLog('[RememberLogin] saved email and password');
      } else {
        await clearRememberedLogin();

        pushDebugLog('[RememberLogin] cleared remembered login');
      }

      pushDebugLog('[LoginScreen] login success');

      console.log('[LoginScreen] login session:', session);

      router.replace('/(tabs)/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown login error.';

      pushDebugLog(`[LoginScreen] login failed: ${message}`);

      console.log('[LoginScreen] login error:', error);
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  // const isValidEmail = (value: string) => {
  //   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  // };

  // const isValidPassword = (value: string) => {
  //   return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9!@#|><_.]{8,}$/.test(value);
  // };

  // const getForgotPasswordHasProgress = () => {
  //   if (forgotPasswordStep !== 'email') {
  //     return true;
  //   }

  //   if (forgotPasswordEmail.trim().length > 0) {
  //     return true;
  //   }

  //   // if (verificationCodeDigits.some((digit) => digit.length > 0)) {
  //   //   return true;
  //   // }
  //   if (verificationCode.length > 0) {
  //     return true;
  //   }

  //   if (newPassword.length > 0 || confirmNewPassword.length > 0) {
  //     return true;
  //   }

  //   return false;
  // };

  // const resetForgotPasswordFlow = () => {
  //   setForgotPasswordStep('email');
  //   setForgotPasswordEmail('');
  //   // setVerificationCodeDigits(['', '', '', '', '']);
  //   setVerificationCode('');
  //   setVerificationCodeError('');
  //   setResendSeconds(0);
  //   setNewPassword('');
  //   setConfirmNewPassword('');
  //   setNewPasswordError('');
  //   setConfirmPasswordError('');
  //   setIsForgotSubmitting(false);
  // };

  // const requestBackToLoginCanvas = () => {
  //   if (canvasMode === 'forgotPassword' && getForgotPasswordHasProgress()) {
  //     setLeaveConfirmTarget('login');
  //     return;
  //   }

  //   handleBackToLoginCanvas();
  // };

  // const confirmBackToLoginCanvas = () => {
  //   setLeaveConfirmTarget(null);
  //   resetForgotPasswordFlow();
  //   handleBackToLoginCanvas();
  // };

  // const cancelBackToLoginCanvas = () => {
  //   setLeaveConfirmTarget(null);
  // };

  const handleOpenRegisterCanvas = () => {
    pushDebugLog('[LoginScreen] open register canvas');
    setCanvasMode('register');
    setSecondaryEmail('');
    setIsLanguagePanelVisible(false);
  };

  const handleOpenForgotPasswordCanvas = () => {
    pushDebugLog('[LoginScreen] open forgot password canvas');
    setCanvasMode('forgotPassword');
    setSecondaryEmail('');
    setIsLanguagePanelVisible(false);
  };

  const handleBackToLoginCanvas = () => {
    pushDebugLog('[LoginScreen] back to login canvas');
    setCanvasMode('login');
    setSecondaryEmail('');
    setIsLanguagePanelVisible(false);
  };

  const handleToggleLanguagePanel = () => {
    pushDebugLog('[LoginScreen] toggle language panel');
    setIsLanguagePanelVisible((current) => !current);
  };

  const handleSelectLanguage = (nextLanguage: LanguageValue) => {
    pushDebugLog(`[LoginScreen] select language=${nextLanguage}`);
    setLanguage(nextLanguage);
    setIsLanguagePanelVisible(false);
  };

  const handleSecondarySubmit = () => {
    pushDebugLog(`[LoginScreen] secondary submit mode=${canvasMode}`);

    console.log('[LoginScreen] secondary submit:', {
      canvasMode,
      language,
      email: secondaryEmail,
    });
  };

  // const handleSendForgotPasswordCode = async () => {
  //   const normalizedEmail = forgotPasswordEmail.trim();

  //   if (!isValidEmail(normalizedEmail)) {
  //     return;
  //   }

  //   setIsForgotSubmitting(true);
  //   pushDebugLog('[ForgotPassword] send code pressed');

  //   try {
  //     // TODO: 之後這裡改成 authClient.sendForgotCode({ email: normalizedEmail })
  //     await new Promise((resolve) => setTimeout(resolve, 1500));

  //     setForgotPasswordStep('code');
  //     setResendSeconds(90);
  //     setVerificationCodeError('');
  //     pushDebugLog('[ForgotPassword] mock code sent');
  //   } catch (error) {
  //     pushDebugLog(
  //       `[ForgotPassword] send code failed: ${
  //         error instanceof Error ? error.message : 'Unknown error'
  //       }`,
  //     );
  //   } finally {
  //     setIsForgotSubmitting(false);
  //   }
  // };

  // const handleVerificationCodeDigitChange = (value: string, index: number) => {
  //   const digit = value.replace(/\D/g, '').slice(0, 1);

  //   setVerificationCodeError('');

  //   setVerificationCodeDigits((currentDigits) => {
  //     const nextDigits = [...currentDigits];
  //     nextDigits[index] = digit;

  //     return nextDigits;
  //   });
  // };
  // const handleVerificationCodeChange = (value: string) => {
  //   const normalizedCode = value.replace(/\D/g, '').slice(0, 5);

  //   setVerificationCodeError('');
  //   setVerificationCode(normalizedCode);
  // };

  // useEffect(() => {
  //   if (forgotPasswordStep !== 'code') {
  //     return;
  //   }

  //   if (verificationCode.length !== 5) {
  //     return;
  //   }

  //   Keyboard.dismiss();

  //   const verifyCode = async () => {
  //     setIsForgotSubmitting(true);

  //     try {
  //       // TODO: 之後改成 authClient.verifyResetCode({
  //       //   email: forgotPasswordEmail.trim(),
  //       //   code: verificationCode,
  //       // })

  //       await new Promise((resolve) => setTimeout(resolve, 500));

  //       // Mock 規則：12345 代表驗證成功
  //       if (verificationCode !== '12345') {
  //         setVerificationCodeError(forgotCopy.codeError);
  //         return;
  //       }

  //       setVerificationCodeError('');
  //       setForgotPasswordStep('resetPassword');
  //     } catch {
  //       setVerificationCodeError(forgotCopy.verifyFailed);
  //     } finally {
  //       setIsForgotSubmitting(false);
  //     }
  //   };

  //   verifyCode();
  // }, [verificationCode, forgotPasswordStep, forgotPasswordEmail, forgotCopy]);

  // const handleResetPasswordSubmit = async () => {
  //   setNewPasswordError('');
  //   setConfirmPasswordError('');

  //   if (!isValidPassword(newPassword)) {
  //     setNewPasswordError('必填');
  //     return;
  //   }

  //   if (newPassword !== confirmNewPassword) {
  //     setConfirmPasswordError('密碼不一致');
  //     return;
  //   }

  //   setIsForgotSubmitting(true);
  //   pushDebugLog('[ForgotPassword] reset password pressed');

  //   try {
  //     // TODO: 之後這裡改成 authClient.resetPassword({ email, code, password })
  //     await new Promise((resolve) => setTimeout(resolve, 700));

  //     setForgotPasswordStep('success');
  //     pushDebugLog('[ForgotPassword] reset password success');

  //     setTimeout(() => {
  //       resetForgotPasswordFlow();
  //       setCanvasMode('login');
  //     }, 1200);
  //   } catch (error) {
  //     setConfirmPasswordError('重設密碼失敗，請稍後再試');
  //   } finally {
  //     setIsForgotSubmitting(false);
  //   }
  // };

  // const renderForgotPasswordCanvas = () => {
  //   const isEmailValid = isValidEmail(forgotPasswordEmail);

  //   if (forgotPasswordStep === 'success') {
  //     return (
  //       <View style={styles.forgotSuccessContent}>
  //         <Text style={styles.forgotSuccessText}>{forgotCopy.successMessage}</Text>
  //       </View>
  //     );
  //   }

  //   return (
  //     <View style={styles.secondaryContent}>
  //       <View style={styles.forgotTitleSlot}>
  //         <Text style={styles.secondaryTitle}>{forgotCopy.title}</Text>
  //       </View>

  //       <View style={styles.forgotDescriptionSlot}>
  //         {forgotPasswordStep === 'email' ? (
  //           <Text style={styles.secondaryDescription}>
  //             {forgotCopy.descriptionBefore}
  //             <Text style={styles.secondaryDescriptionHighlight}>
  //               {forgotCopy.descriptionHighlight}
  //             </Text>
  //             {forgotCopy.descriptionAfter}
  //           </Text>
  //         ) : (
  //           <Text style={styles.forgotNoticeText}>{forgotCopy.sentNotice}</Text>
  //         )}
  //       </View>

  //       <View style={styles.forgotEmailCenterBlock}>
  //         <View style={styles.forgotEmailInputGroup}>
  //           <Text style={styles.secondaryLabel}>{forgotCopy.emailLabel}</Text>

  //           <TextInput
  //             value={forgotPasswordEmail}
  //             onChangeText={(value) => {
  //               setForgotPasswordEmail(value);
  //               setVerificationCodeError('');
  //             }}
  //             placeholder={forgotCopy.emailPlaceholder}
  //             placeholderTextColor="rgba(255, 255, 255, 0.42)"
  //             keyboardType="email-address"
  //             autoCapitalize="none"
  //             autoCorrect={false}
  //             editable={forgotPasswordStep === 'email'}
  //             showSoftInputOnFocus={true}
  //             style={styles.secondaryInput}
  //           />
  //         </View>

  //         {forgotPasswordStep !== 'email' ? (
  //           <View style={styles.resendSlotAbsolute}>
  //             <Text style={styles.resendText}>
  //               {resendSeconds > 0
  //                 ? forgotCopy.resendCountdown(resendSeconds)
  //                 : forgotCopy.resendButton}
  //             </Text>
  //           </View>
  //         ) : null}
  //       </View>

  //       <View style={styles.forgotActionSlot}>
  //         {forgotPasswordStep === 'email' ? (
  //           <Pressable
  //             disabled={!isEmailValid || isForgotSubmitting}
  //             style={({ pressed }) => [
  //               styles.secondarySubmitButton,
  //               pressed && !isForgotSubmitting && styles.secondarySubmitButtonPressed,
  //               !isEmailValid && styles.hiddenActionButton,
  //               isForgotSubmitting && styles.secondarySubmitButtonLoading,
  //             ]}
  //             onPress={handleSendForgotPasswordCode}
  //           >
  //             {isForgotSubmitting ? (
  //               <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.86)" />
  //             ) : (
  //               <Text style={styles.secondarySubmitButtonText}>{forgotCopy.sendButton}</Text>
  //             )}
  //           </Pressable>
  //         ) : null}

  //         {forgotPasswordStep === 'code' ? (
  //           <View style={styles.verificationArea}>
  //             <View style={styles.verificationLabelRow}>
  //               <Text style={styles.verificationLabel}>{forgotCopy.codeLabel}</Text>
  //               <Text style={styles.verificationHint}>{forgotCopy.codeHint}</Text>
  //             </View>

  //             {verificationCodeError ? (
  //               <Text style={styles.verificationErrorText}>{verificationCodeError}</Text>
  //             ) : null}

  //             <Pressable
  //               style={styles.verificationCodePressArea}
  //               onPress={() => verificationCodeInputRef.current?.focus()}
  //             >
  //               <TextInput
  //                 ref={verificationCodeInputRef}
  //                 value={verificationCode}
  //                 onChangeText={handleVerificationCodeChange}
  //                 keyboardType="number-pad"
  //                 maxLength={5}
  //                 caretHidden={true}
  //                 showSoftInputOnFocus={true}
  //                 style={styles.hiddenVerificationCodeInput}
  //               />

  //               <View style={styles.verificationCodeRow}>
  //                 {Array.from({ length: 5 }).map((_, index) => {
  //                   const digit = verificationCode[index] ?? '';

  //                   return (
  //                     <View
  //                       key={`verification-code-box-${index}`}
  //                       style={[
  //                         styles.verificationCodeInput,
  //                         verificationCodeError && styles.verificationCodeInputError,
  //                       ]}
  //                     >
  //                       <Text style={styles.verificationCodeDigitText}>{digit}</Text>
  //                     </View>
  //                   );
  //                 })}
  //               </View>
  //             </Pressable>
  //           </View>
  //         ) : null}
  //       </View>

  //       {forgotPasswordStep === 'resetPassword' ? (
  //         <View style={styles.resetPasswordArea}>
  //           <Text style={styles.resetPasswordTitle}>{forgotCopy.resetTitle}</Text>

  //           <Text style={styles.resetPasswordDescription}>{forgotCopy.resetDescription}</Text>

  //           <View style={styles.resetPasswordRow}>
  //             <View style={styles.resetPasswordInputGroup}>
  //               <Text style={styles.secondaryLabel}>{forgotCopy.newPasswordLabel}</Text>

  //               <TextInput
  //                 value={newPassword}
  //                 onChangeText={(value) => {
  //                   setNewPassword(value);
  //                   setNewPasswordError('');
  //                 }}
  //                 placeholder={forgotCopy.passwordPlaceholder}
  //                 placeholderTextColor="rgba(255, 255, 255, 0.42)"
  //                 secureTextEntry={true}
  //                 autoCapitalize="none"
  //                 autoCorrect={false}
  //                 style={[styles.secondaryInput, newPasswordError && styles.inputError]}
  //               />

  //               {newPasswordError ? (
  //                 <Text style={styles.fieldErrorText}>{newPasswordError}</Text>
  //               ) : null}
  //             </View>

  //             <View style={styles.resetPasswordInputGroup}>
  //               <Text style={styles.secondaryLabel}>{forgotCopy.confirmPasswordLabel}</Text>

  //               <TextInput
  //                 value={confirmNewPassword}
  //                 onChangeText={(value) => {
  //                   setConfirmNewPassword(value);
  //                   setConfirmPasswordError('');
  //                 }}
  //                 placeholder={forgotCopy.passwordPlaceholder}
  //                 placeholderTextColor="rgba(255, 255, 255, 0.42)"
  //                 secureTextEntry={true}
  //                 autoCapitalize="none"
  //                 autoCorrect={false}
  //                 style={[styles.secondaryInput, confirmPasswordError && styles.inputError]}
  //               />

  //               {confirmPasswordError ? (
  //                 <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
  //               ) : null}
  //             </View>
  //           </View>

  //           <Pressable
  //             style={({ pressed }) => [
  //               styles.secondarySubmitButton,
  //               pressed && styles.secondarySubmitButtonPressed,
  //             ]}
  //             onPress={handleResetPasswordSubmit}
  //           >
  //             <Text style={styles.secondarySubmitButtonText}>{forgotCopy.resetButton}</Text>
  //           </Pressable>
  //         </View>
  //       ) : null}
  //     </View>
  //   );
  // };

  const renderLanguagePanel = () => {
    if (!isLanguagePanelVisible) {
      return null;
    }

    return (
      <View style={styles.languagePanel}>
        {LOGIN_LANGUAGE_OPTIONS.map((option) => {
          const isSelected = option.value === language;

          return (
            <Pressable
              key={option.value}
              style={[styles.languagePanelItem, isSelected && styles.languagePanelItemSelected]}
              onPress={() => handleSelectLanguage(option.value)}
            >
              <Text style={styles.languagePanelText}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderDebugPanel = () => {
    return (
      <View style={styles.debugPanel} pointerEvents="none">
        <Text style={styles.debugTitle}>Debug Log</Text>

        {debugLogs.map((log, index) => (
          <Text key={`${log}-${index}`} style={styles.debugText}>
            {log}
          </Text>
        ))}
      </View>
    );
  };

  const renderFullScreenLoading = () => {
    if (!isLoginSubmitting) {
      return null;
    }

    return (
      <View style={styles.fullScreenLoading} pointerEvents="auto">
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  };

  // const renderLeaveConfirmModal = () => {
  //   return (
  //     <Modal
  //       visible={leaveConfirmTarget !== null}
  //       transparent={true}
  //       animationType="fade"
  //       onRequestClose={cancelBackToLoginCanvas}
  //     >
  //       <View style={styles.confirmModalOverlay}>
  //         <View style={styles.confirmModalCard}>
  //           <Text style={styles.confirmModalTitle}>{forgotCopy.leaveTitle}</Text>

  //           <Text style={styles.confirmModalDescription}>{forgotCopy.leaveDescription}</Text>

  //           <View style={styles.confirmModalButtonRow}>
  //             <Pressable style={styles.confirmModalGhostButton} onPress={confirmBackToLoginCanvas}>
  //               <Text style={styles.confirmModalGhostButtonText}>{forgotCopy.leaveButton}</Text>
  //             </Pressable>

  //             <Pressable style={styles.confirmModalPrimaryButton} onPress={cancelBackToLoginCanvas}>
  //               <Text style={styles.confirmModalPrimaryButtonText}>
  //                 {forgotCopy.continueButton}
  //               </Text>
  //             </Pressable>
  //           </View>
  //         </View>
  //       </View>
  //     </Modal>
  //   );
  // };

  const renderLoginCanvas = () => {
    return (
      <View style={styles.page}>
        <View style={styles.leftPanel}>
          <Image
            source={require('@/assets/images/login-Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Text style={styles.welcomeTitle}>{loginCopy.welcomeTitle}</Text>
          <Text style={styles.welcomeSubtitle}>{loginCopy.welcomeSubtitle}</Text>
        </View>

        <View style={styles.rightPanel}>
          {renderLanguagePanel()}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.emailHeaderRow}>
                <Text style={styles.label}>{loginCopy.emailLabel}</Text>

                <View style={styles.topActionRow}>
                  <Pressable onPress={handleOpenRegisterCanvas}>
                    <Text style={styles.registerText}>{loginCopy.register}</Text>
                  </Pressable>

                  <Pressable style={styles.languageIconButton} onPress={handleToggleLanguagePanel}>
                    <Image
                      source={require('@/assets/images/login-language-btn.png')}
                      style={styles.languageIconImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
              </View>

              <TextInput
                ref={emailInputRef}
                value={email}
                onChangeText={setEmail}
                onPressIn={() => {
                  pushDebugLog('[EmailInput] onPressIn');
                  focusInputWithLog(emailInputRef, 'EmailInput');
                }}
                onFocus={() => {
                  pushDebugLog('[EmailInput] onFocus');
                }}
                onBlur={() => {
                  pushDebugLog('[EmailInput] onBlur');
                }}
                placeholder={loginCopy.emailPlaceholder}
                placeholderTextColor="rgba(255, 255, 255, 0.42)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                focusable={true}
                showSoftInputOnFocus={true}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  pushDebugLog('[EmailInput] submit editing -> password focus');
                  passwordInputRef.current?.focus();
                }}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.passwordLabel}>{loginCopy.passwordLabel}</Text>

              <TextInput
                ref={passwordInputRef}
                value={password}
                onChangeText={setPassword}
                onPressIn={() => {
                  pushDebugLog('[PasswordInput] onPressIn');
                  focusInputWithLog(passwordInputRef, 'PasswordInput');
                }}
                onFocus={() => {
                  pushDebugLog('[PasswordInput] onFocus');
                }}
                onBlur={() => {
                  pushDebugLog('[PasswordInput] onBlur');
                }}
                placeholder={loginCopy.passwordPlaceholder}
                placeholderTextColor="rgba(255, 255, 255, 0.42)"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                focusable={true}
                showSoftInputOnFocus={true}
                returnKeyType="done"
                style={styles.input}
              />
            </View>

            <Pressable
              style={styles.rememberRow}
              onPress={() => setRememberMe((current) => !current)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>

              <Text style={styles.rememberText}>{loginCopy.rememberMe}</Text>
            </Pressable>

            <Pressable
              disabled={isLoginSubmitting}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
                isLoginSubmitting && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>{loginCopy.loginButton}</Text>
            </Pressable>

            <Pressable onPress={handleOpenForgotPasswordCanvas}>
              <Text style={styles.forgotPasswordText}>{loginCopy.forgotPassword}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderSecondaryCanvas = () => {
    if (canvasMode === 'forgotPassword') {
      return (
        <ForgotPasswordCanvas
          language={language}
          styles={styles}
          backButtonPositionStyle={getBackButtonPositionStyle()}
          onBackToLogin={handleBackToLoginCanvas}
          pushDebugLog={pushDebugLog}
        />
      );
    }

    return (
      <View style={styles.secondaryPage}>
        <Pressable
          style={[styles.backButton, getBackButtonPositionStyle()]}
          onPress={handleBackToLoginCanvas}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.secondaryContent}>
          <Text style={styles.secondaryTitle}>{secondaryCopy.title}</Text>

          <Text style={styles.secondaryDescription}>
            {secondaryCopy.descriptionBefore}
            {secondaryCopy.descriptionHighlight ? (
              <Text style={styles.secondaryDescriptionHighlight}>
                {secondaryCopy.descriptionHighlight}
              </Text>
            ) : null}
            {secondaryCopy.descriptionAfter}
          </Text>

          <View style={styles.secondaryInputGroup}>
            <Text style={styles.secondaryLabel}>{secondaryCopy.emailLabel}</Text>

            <TextInput
              ref={secondaryEmailInputRef}
              value={secondaryEmail}
              onChangeText={setSecondaryEmail}
              onPressIn={() => {
                pushDebugLog('[SecondaryEmailInput] onPressIn');
                focusInputWithLog(secondaryEmailInputRef, 'SecondaryEmailInput');
              }}
              onFocus={() => {
                pushDebugLog('[SecondaryEmailInput] onFocus');
              }}
              onBlur={() => {
                pushDebugLog('[SecondaryEmailInput] onBlur');
              }}
              placeholder={secondaryCopy.emailPlaceholder}
              placeholderTextColor="rgba(255, 255, 255, 0.42)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
              focusable={true}
              showSoftInputOnFocus={true}
              returnKeyType="done"
              style={styles.secondaryInput}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.secondarySubmitButton,
              pressed && styles.secondarySubmitButtonPressed,
            ]}
            onPress={handleSecondarySubmit}
          >
            <Text style={styles.secondarySubmitButtonText}>{secondaryCopy.submitButton}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('@/assets/images/language-bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          {canvasMode === 'login' ? renderLoginCanvas() : renderSecondaryCanvas()}
        </SafeAreaView>

        {/* {renderDebugPanel()} */}
        {renderFullScreenLoading()}
        {/* {renderLeaveConfirmModal()} */}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  safeArea: {
    flex: 1,
  },
  page: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 88,
    paddingTop: 80,
    paddingBottom: 100,
  },
  logoImage: {
    width: 1280,
    height: 480,
    marginBottom: -170,
    marginLeft: -450,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 42,
  },
  welcomeSubtitle: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 42,
  },
  rightPanel: {
    position: 'relative',
    width: 520,
    paddingTop: 106,
    paddingRight: 88,
  },
  form: {
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 28,
  },
  emailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 22,
    fontWeight: '600',
  },
  passwordLabel: {
    marginBottom: 10,
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 22,
    fontWeight: '600',
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  registerText: {
    color: '#FF7A00',
    fontSize: 20,
    fontWeight: '700',
  },
  languageIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageIconImage: {
    width: 34,
    height: 34,
  },
  languagePanel: {
    position: 'absolute',
    top: 150,
    right: 88,
    width: 260,
    height: 240,
    overflow: 'hidden',
    borderRadius: 32,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    zIndex: 20,
    elevation: 20,
  },
  languagePanelItem: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  languagePanelItemSelected: {
    backgroundColor: 'rgb(255, 123, 0)',
  },
  languagePanelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 58,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 29,
    paddingHorizontal: 26,
    color: '#FFFFFF',
    fontSize: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  rememberRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 42,
    paddingVertical: 6,
  },
  checkbox: {
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
  },
  checkboxMark: {
    color: '#6F6F6F',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  rememberText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 21,
    fontWeight: '500',
  },
  loginButton: {
    alignSelf: 'center',
    width: 306,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#FF7A00',
  },
  loginButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '600',
  },
  forgotPasswordText: {
    marginTop: 24,
    color: 'rgba(255, 255, 255, 0.76)',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  secondaryPage: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    zIndex: 10,
  },
  backButtonRegisterChinese: {
    left: 400,
    top: 165,
  },
  backButtonRegisterOther: {
    left: 350,
    top: 165,
  },
  backButtonForgotPasswordChinese: {
    left: 330,
    top: 160,
  },
  backButtonForgotPasswordOther: {
    left: 260,
    top: 160,
  },
  backButtonText: {
    marginTop: -3,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 36,
  },
  secondaryContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 36,
  },
  secondaryTitle: {
    width: 720,
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryDescription: {
    width: 720,
    color: 'rgba(255, 255, 255, 0.42)',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
  secondaryInputGroup: {
    width: 420,
  },
  secondaryLabel: {
    marginBottom: 10,
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '600',
  },
  secondaryInput: {
    height: 54,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 27,
    paddingHorizontal: 24,
    color: '#FFFFFF',
    fontSize: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  secondarySubmitButton: {
    width: 250,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    borderRadius: 27,
    backgroundColor: '#FF7A00',
  },
  secondarySubmitButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
  secondarySubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  debugPanel: {
    position: 'absolute',
    left: 48,
    top: 48,
    width: 420,
    maxHeight: 260,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 9999,
    elevation: 9999,
  },
  debugTitle: {
    marginBottom: 6,
    color: '#FF7A00',
    fontSize: 14,
    fontWeight: '800',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 16,
  },

  loginButtonDisabled: {
    opacity: 0.56,
  },
  fullScreenLoading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    zIndex: 10000,
    elevation: 10000,
  },
  loadingCard: {
    minWidth: 180,
    minHeight: 128,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    // backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryDescriptionHighlight: {
    color: '#FF7A00',
    fontWeight: '700',
  },
  secondarySubmitButtonLoading: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },

  forgotNoticeText: {
    color: '#FF7A00',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },

  forgotEmailCenterBlock: {
    position: 'relative',
    width: 720,
    alignItems: 'center',
  },

  forgotEmailInputGroup: {
    width: 420,
  },
  forgotTitleSlot: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  forgotDescriptionSlot: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resendSlotAbsolute: {
    position: 'absolute',
    left: 590,
    bottom: 20,
    width: 220,
    justifyContent: 'center',
  },

  resendText: {
    color: 'rgba(255, 255, 255, 0.56)',
    fontSize: 14,
    fontWeight: '500',
  },

  verificationArea: {
    width: 420,
  },

  verificationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  verificationLabel: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '600',
  },

  verificationHint: {
    marginLeft: 8,
    color: 'rgba(255, 255, 255, 0.42)',
    fontSize: 20,
    fontWeight: '500',
  },

  verificationErrorText: {
    marginBottom: 8,
    color: '#FF4D36',
    fontSize: 13,
    fontWeight: '600',
  },

  verificationCodePressArea: {
    position: 'relative',
  },

  hiddenVerificationCodeInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  verificationCodeRow: {
    flexDirection: 'row',
    gap: 20,
  },

  verificationCodeInput: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },

  verificationCodeDigitText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },

  verificationCodeInputError: {
    borderColor: '#FF4D36',
  },

  resetPasswordArea: {
    width: 720,
    alignItems: 'center',
  },

  resetPasswordTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  resetPasswordDescription: {
    width: 720,
    marginTop: 22,
    marginBottom: 36,
    color: 'rgba(255, 255, 255, 0.52)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },

  resetPasswordRow: {
    width: 720,
    flexDirection: 'row',
    gap: 24,
  },

  resetPasswordInputGroup: {
    flex: 1,
  },

  inputError: {
    borderColor: '#FF4D36',
  },

  fieldErrorText: {
    marginTop: 8,
    color: '#FF4D36',
    fontSize: 13,
    fontWeight: '600',
  },

  forgotSuccessContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  forgotSuccessText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  confirmModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },

  confirmModalCard: {
    width: 420,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 30, 30, 0.92)',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },

  confirmModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  confirmModalDescription: {
    marginTop: 10,
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 14,
    textAlign: 'center',
  },

  confirmModalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 14,
  },

  confirmModalGhostButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  confirmModalGhostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  confirmModalPrimaryButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FF7A00',
  },

  confirmModalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotActionSlot: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },

  hiddenActionButton: {
    opacity: 0,
  },
});
