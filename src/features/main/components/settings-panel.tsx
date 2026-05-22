import {
  Modal,
  ImageBackground,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
  View,
} from 'react-native';
import { CustomEmailKeyboard } from '@/src/shared/components/custom-email-keyboard';
import { useEffect, useRef, useState } from 'react';
import type { SvgProps } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';

import { useAppLanguageStore } from '@/src/shared/i18n/language.store';

import { Ionicons } from '@expo/vector-icons';

import { LanguageSelectModal } from '@/src/features/main/components/language-select-modal';

// import { authClient } from '@/src/services/auth/auth-client';
// import { getAccessToken } from '@/src/services/auth/auth-token-store';

import { authClient } from '@/src/services/auth/auth-client';
import {
  clearAuthSession,
  getAccessToken,
  setAccessToken,
  setUserEmail,
} from '@/src/services/auth/auth-token-store';

import { useBillingSummaryStore } from '@/src/features/main/store/billing-summary.store';

import { SETTINGS_COPY } from '@/src/features/main/i18n/settings-copy';

import SettingIcon1 from '@/assets/images/setting/setting-1.svg';
import SettingIcon2 from '@/assets/images/setting/setting-2.svg';
import SettingIcon3 from '@/assets/images/setting/setting-3.svg';
import SettingIcon4 from '@/assets/images/setting/setting-4.svg';
import SettingIcon5 from '@/assets/images/setting/setting-5.svg';
import SettingIcon6 from '@/assets/images/setting/setting-5.svg';
import SettingIcon7 from '@/assets/images/setting/setting-5.svg';
import SettingPlanPersonIcon from '@/assets/images/setting/setting-plan-person.svg';
import SettingPlanCardIcon from '@/assets/images/setting/setting-plan-card.svg';
import SettingAccPassIcon from '@/assets/images/setting/setting-acc-password.svg';
import SettingAccExitIcon from '@/assets/images/setting/setting-acc-exit.svg';
import SettingAccDeleteIcon from '@/assets/images/setting/setting-acc-del.svg';

const SONG_REQUEST_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSePx-46WODS5R9q5sLPjtdkDEoW21ADfNFePcr7PrBiMnTVvA/viewform';
const REPORT_PROBLEM_URL = 'https://forms.gle/RTcaNSrmQPqn4Piv8';

type SettingItem = {
  id: string;
  title: string;
  description: string;
  Icon?: React.ComponentType<SvgProps>;
  isPlaceholder?: boolean;
};

type SettingsPage =
  | 'menu'
  | 'subscription'
  | 'account'
  | 'planContent'
  | 'cardManagement'
  | 'passwordChange'
  | 'deleteAccount'
  | 'emailChange';

type SubscriptionItem = {
  id: string;
  title: string;
  description: string;
  Icon: React.ComponentType<SvgProps>;
};

// const SUBSCRIPTION_ITEMS: SubscriptionItem[] = [
//   {
//     id: 'plan-content',
//     title: '方案內容',
//     description: '06/16/2025 - 06/16/2026',
//     Icon: SettingPlanPersonIcon,
//   },
//   {
//     id: 'card-management',
//     title: '卡片管理',
//     description: '',
//     Icon: SettingPlanCardIcon,
//   },
// ];

type AccountItem = {
  id: string;
  title: string;
  description: string;
  Icon: React.ComponentType<SvgProps>;
};

// const SETTINGS_ITEMS: SettingItem[] = [
//   {
//     id: 'subscription',
//     title: '訂閱方案',
//     description: '年繳',
//     Icon: SettingIcon1,
//   },
//   {
//     id: 'account',
//     title: '帳號密碼',
//     description: 'poccccc@gmail.com',
//     Icon: SettingIcon2,
//   },
//   {
//     id: 'language',
//     title: '語言選擇',
//     description: '繁體中文',
//     Icon: SettingIcon3,
//   },
//   {
//     id: 'add-song',
//     title: '新增歌曲',
//     description: '想要加入的歌曲',
//     Icon: SettingIcon4,
//   },
//   {
//     id: 'report',
//     title: '回報問題',
//     description: '幫助您解決遇到的問題',
//     Icon: SettingIcon5,
//   },
//   {
//     id: 'placeholder',
//     title: '',
//     description: '',
//     isPlaceholder: true,
//   },
// ];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsPanel({ visible, onClose }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const language = useAppLanguageStore((state) => state.language);
  const setLanguage = useAppLanguageStore((state) => state.setLanguage);
  const copy = SETTINGS_COPY[language];

  const [currentPage, setCurrentPage] = useState<SettingsPage>('menu');
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);

  const [qrModalType, setQrModalType] = useState<'add-song' | 'report' | null>(null);

  const [activePaymentMethodId, setActivePaymentMethodId] = useState<string | null>(null);
  const setDefaultPaymentMethod = useBillingSummaryStore((state) => state.setDefaultPaymentMethod);
  const deletePaymentMethod = useBillingSummaryStore((state) => state.deletePaymentMethod);

  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const settingsBilling = useBillingSummaryStore((state) => state.settingsBilling);
  const isBillingLoading = useBillingSummaryStore((state) => state.isLoading);
  const billingErrorMessage = useBillingSummaryStore((state) => state.errorMessage);
  const fetchBillingSummaryOnce = useBillingSummaryStore((state) => state.fetchBillingSummaryOnce);

  const [passwordStep, setPasswordStep] = useState<'current' | 'newPassword'>('current');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfirmPasswordInputVisible, setIsConfirmPasswordInputVisible] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isPasswordLeaveConfirmVisible, setIsPasswordLeaveConfirmVisible] = useState(false);

  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const [emailChangeStep, setEmailChangeStep] = useState<'verifyCurrentEmail' | 'newEmail'>(
    'verifyCurrentEmail',
  );
  const [emailVerifyPassword, setEmailVerifyPassword] = useState('');
  const [isEmailVerifyPasswordVisible, setIsEmailVerifyPasswordVisible] = useState(false);
  const emailVerifyPasswordInputRef = useRef<TextInput>(null);

  const [activeCustomKeyboardInput, setActiveCustomKeyboardInput] = useState<
    | 'currentPassword'
    | 'newPassword'
    | 'confirmPassword'
    | 'deleteAccount'
    | 'emailVerifyPassword'
    | 'emailChange'
    | `emailCode-${number}`
    | null
  >(null);

  const isValidPassword = (value: string) => {
    /**
     * 密碼規則：
     * 1. 至少 8 個字
     * 2. 至少一個小寫英文字母
     * 3. 至少一個大寫英文字母
     * 4. 至少一個數字
     * 5. 只允許英文字母、數字、常見符號
     */
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]{8,}$/;

    return passwordPattern.test(value);
  };

  const isValidEmail = (value: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value.trim());
  };

  const [isCurrentPasswordChecking, setIsCurrentPasswordChecking] = useState(false);

  const currentPasswordInputRef = useRef<TextInput>(null);
  const newPasswordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const deleteAccountInputRef = useRef<TextInput>(null);
  const emailChangeInputRef = useRef<TextInput>(null);
  const emailCodeInputRefs = useRef<Array<TextInput | null>>([]);

  const hasPasswordDraft =
    currentPassword.trim().length > 0 ||
    newPassword.trim().length > 0 ||
    confirmPassword.trim().length > 0;

  const [deleteAccountText, setDeleteAccountText] = useState('');
  const [deleteAccountErrorMessage, setDeleteAccountErrorMessage] = useState('');
  const [isDeleteAccountSubmitting, setIsDeleteAccountSubmitting] = useState(false);

  const [emailChangeText, setEmailChangeText] = useState('');
  const [emailChangeErrorMessage, setEmailChangeErrorMessage] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState(['', '', '', '', '']);
  const [isEmailVerificationSent, setIsEmailVerificationSent] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailResendSeconds, setEmailResendSeconds] = useState(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setCurrentPage('menu');
    setIsLogoutConfirmVisible(false);
    setIsLanguageModalVisible(false);
    setQrModalType(null);

    setPasswordStep('current');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrorMessage('');
    setIsConfirmPasswordInputVisible(false);
    setIsPasswordSubmitting(false);
    setIsCurrentPasswordChecking(false);
    setIsCurrentPasswordVisible(false);
    setIsNewPasswordVisible(false);
    setIsConfirmPasswordVisible(false);

    setEmailChangeText('');
    setEmailChangeErrorMessage('');
    setEmailVerificationCode(['', '', '', '', '']);
    setIsEmailVerificationSent(false);
    setIsEmailSubmitting(false);
    setEmailResendSeconds(0);

    setActiveCustomKeyboardInput(null);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    fetchBillingSummaryOnce();
  }, [fetchBillingSummaryOnce, visible]);

  useEffect(() => {
    if (!isEmailVerificationSent || emailResendSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setEmailResendSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [emailResendSeconds, isEmailVerificationSent]);

  const panelHorizontalPadding = 54 * 2;
  const cardGap = 30;
  const cardColumnCount = 3;

  const cardWidth = Math.floor(
    (width - panelHorizontalPadding - cardGap * (cardColumnCount - 1)) / cardColumnCount,
  );

  const qrModalTitle = qrModalType === 'report' ? copy.scanReportProblem : copy.scanAddSong;
  const qrModalUrl = qrModalType === 'report' ? REPORT_PROBLEM_URL : SONG_REQUEST_URL;

  const placeholderText = isBillingLoading ? '...' : '-';
  const currentAccountEmail = settingsBilling?.userEmail ?? '';

  const planContentRows = [
    {
      id: 'subscription-code',
      label: copy.orderNumber,
      value: settingsBilling?.orderNumber ?? '-',
    },
    {
      id: 'subscription-date',
      label: copy.orderDate,
      value: settingsBilling?.orderDate ?? '-',
    },
    {
      id: 'plan',
      label: copy.planSelection,
      value: settingsBilling?.planName ?? '-',
      rightValue: settingsBilling?.planAmount ?? '-',
    },
    {
      id: 'card',
      label: copy.paymentAccount,
      value: settingsBilling?.paymentAccount ?? '-',
    },
    {
      id: 'address',
      label: copy.billingAddress,
      value: settingsBilling?.billingAddress ?? '-',
    },
  ];

  const accountItems: AccountItem[] = [
    {
      id: 'email',
      title: copy.account,
      description: settingsBilling?.userEmail ?? '-',
      Icon: SettingIcon2,
    },
    {
      id: 'password',
      title: copy.password,
      description: '••••••',
      Icon: SettingAccPassIcon,
    },
  ];

  const settingItems: SettingItem[] = [
    {
      id: 'subscription',
      title: copy.subscription,
      description: settingsBilling?.planName ?? placeholderText,
      Icon: SettingIcon1,
    },
    {
      id: 'account',
      title: copy.accountPassword,
      description: settingsBilling?.userEmail ?? placeholderText,
      Icon: SettingIcon2,
    },
    {
      id: 'language',
      title: copy.languageSelect,
      description:
        language === 'zh-TW'
          ? '繁體中文'
          : language === 'zh-CN'
            ? '简体中文'
            : language === 'en'
              ? 'English'
              : 'Bahasa Melayu',
      Icon: SettingIcon3,
    },
    {
      id: 'add-song',
      title: copy.addSong,
      description: copy.addSongDescription,
      Icon: SettingIcon4,
    },
    {
      id: 'report',
      title: copy.reportProblem,
      description: copy.reportProblemDescription,
      Icon: SettingIcon5,
    },
    {
      id: 'placeholder',
      title: '',
      description: '',
      isPlaceholder: true,
    },
  ];

  const subscriptionItems: SubscriptionItem[] = [
    {
      id: 'plan-content',
      title: copy.planContent,
      description: settingsBilling?.subscriptionPeriod ?? placeholderText,
      Icon: SettingPlanPersonIcon,
    },
    {
      id: 'card-management',
      title: copy.cardManagement,
      description: '',
      Icon: SettingPlanCardIcon,
    },
  ];

  // const settingItems = SETTINGS_ITEMS.map((item) => {
  //   if (item.id === 'subscription') {
  //     return {
  //       ...item,
  //       description: settingsBilling?.planName ?? placeholderText,
  //     };
  //   }

  //   if (item.id === 'account') {
  //     return {
  //       ...item,
  //       description: settingsBilling?.userEmail ?? placeholderText,
  //     };
  //   }

  //   return item;
  // });

  const rawBilling = useBillingSummaryStore((state) => state.rawBilling);

  const paymentCardItems =
    rawBilling?.paymentMethods.map((paymentMethod) => ({
      id: paymentMethod.id,
      brand: paymentMethod.brand?.toUpperCase() ?? 'CARD',
      number: paymentMethod.last4 ? `**** ${paymentMethod.last4}` : '****',
      isDefault: paymentMethod.isDefault === true,
    })) ?? [];

  const resetPasswordChangeState = () => {
    setPasswordStep('current');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsConfirmPasswordInputVisible(false);
    setPasswordErrorMessage('');
    setIsCurrentPasswordChecking(false);
    setIsPasswordSubmitting(false);
    setIsCurrentPasswordVisible(false);
    setIsNewPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
    setActiveCustomKeyboardInput(null);
    setIsPasswordLeaveConfirmVisible(false);
  };

  const leavePasswordChangePage = () => {
    resetPasswordChangeState();
    setCurrentPage('account');
  };

  const resetDeleteAccountState = () => {
    setDeleteAccountText('');
    setDeleteAccountErrorMessage('');
    setIsDeleteAccountSubmitting(false);
    setActiveCustomKeyboardInput(null);
  };

  const resetEmailChangeState = () => {
    setEmailChangeStep('verifyCurrentEmail');

    setEmailChangeText('');
    setEmailChangeErrorMessage('');
    setEmailVerificationCode(['', '', '', '', '']);
    setIsEmailVerificationSent(false);
    setIsEmailSubmitting(false);
    setEmailResendSeconds(0);
    setActiveCustomKeyboardInput(null);
  };

  const handlePressBack = () => {
    if (currentPage === 'passwordChange') {
      if (isCurrentPasswordChecking || isPasswordSubmitting) {
        return;
      }

      if (hasPasswordDraft) {
        setActiveCustomKeyboardInput(null);
        setIsPasswordLeaveConfirmVisible(true);
        return;
      }

      leavePasswordChangePage();
      return;
    }

    if (currentPage === 'deleteAccount') {
      if (isDeleteAccountSubmitting) {
        return;
      }

      resetDeleteAccountState();
      setCurrentPage('account');
      return;
    }

    if (currentPage === 'emailChange') {
      if (isEmailSubmitting) {
        return;
      }

      resetEmailChangeState();
      setCurrentPage('account');
      return;
    }

    if (currentPage === 'planContent' || currentPage === 'cardManagement') {
      setCurrentPage('subscription');
      return;
    }

    if (currentPage !== 'menu') {
      setCurrentPage('menu');
      return;
    }

    onClose();
  };

  const handleConfirmLogout = async () => {
    console.log('[SettingsPanel] confirm logout');

    setIsLogoutConfirmVisible(false);

    try {
      /**
       * 清除 auth token
       */
      await clearAuthSession();

      /**
       * 清除 billing summary cache
       */
      useBillingSummaryStore.getState().reset();

      onClose();

      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          router.replace('/login');
        }, 0);
      });
    } catch (error) {
      console.log('[SettingsPanel] logout failed:', error);
    }
  };

  // const placeholderText = isBillingLoading ? '...' : '-';

  // const subscriptionItems = SUBSCRIPTION_ITEMS.map((item) => {
  //   if (item.id === 'plan-content') {
  //     return {
  //       ...item,
  //       description: settingsBilling?.subscriptionPeriod ?? placeholderText,
  //     };
  //   }

  //   return item;
  // });

  const handlePasswordKeyboardInput = (value: string) => {
    if (!activeCustomKeyboardInput) {
      return;
    }

    setPasswordErrorMessage('');

    if (activeCustomKeyboardInput === 'emailVerifyPassword') {
      setEmailVerifyPassword((current) => `${current}${value}`);
      setEmailChangeErrorMessage('');
      return;
    }

    if (activeCustomKeyboardInput === 'currentPassword') {
      setCurrentPassword((current) => `${current}${value}`);
      return;
    }

    if (activeCustomKeyboardInput === 'newPassword') {
      setNewPassword((current) => `${current}${value}`);

      /**
       * 使用者只要重新輸入新密碼，就關閉確認密碼欄位。
       * 必須再按一次「完成」才會進入確認密碼階段。
       */
      setConfirmPassword('');
      setIsConfirmPasswordInputVisible(false);

      return;
    }

    if (activeCustomKeyboardInput === 'confirmPassword') {
      setConfirmPassword((current) => `${current}${value}`);
      return;
    }

    if (activeCustomKeyboardInput === 'deleteAccount') {
      setDeleteAccountText((current) => `${current}${value}`);
      setDeleteAccountErrorMessage('');
    }

    if (activeCustomKeyboardInput === 'emailChange') {
      setEmailChangeText((current) => `${current}${value}`);
      setEmailChangeErrorMessage('');
      return;
    }

    if (activeCustomKeyboardInput.startsWith('emailCode-')) {
      const index = Number(activeCustomKeyboardInput.replace('emailCode-', ''));

      if (!Number.isInteger(index) || index < 0 || index > 4) {
        return;
      }

      const nextDigit = value.slice(-1);

      /**
       * 驗證碼只允許單一字元。
       * 如果你的驗證碼只允許數字，可以打開下面這段。
       */
      if (!/^\d$/.test(nextDigit)) {
        return;
      }

      setEmailVerificationCode((current) => {
        const next = [...current];
        next[index] = nextDigit;

        /**
         * 第 1～4 碼：輸入後自動跳下一格。
         */
        if (index < 4) {
          requestAnimationFrame(() => {
            emailCodeInputRefs.current[index + 1]?.focus();
            setActiveCustomKeyboardInput(`emailCode-${index + 1}`);
          });
        }

        /**
         * 第 5 碼：輸入完成後自動送出。
         */
        if (index === 4) {
          const code = next.join('');

          requestAnimationFrame(() => {
            submitEmailVerificationCode(code);
          });
        }

        return next;
      });

      setEmailChangeErrorMessage('');
      return;
    }
  };

  const handlePasswordKeyboardBackspace = () => {
    if (!activeCustomKeyboardInput) {
      return;
    }

    setPasswordErrorMessage('');

    if (activeCustomKeyboardInput === 'emailVerifyPassword') {
      setEmailVerifyPassword((current) => current.slice(0, -1));
      setEmailChangeErrorMessage('');
      return;
    }

    if (activeCustomKeyboardInput === 'currentPassword') {
      setCurrentPassword((current) => current.slice(0, -1));
      return;
    }

    if (activeCustomKeyboardInput === 'newPassword') {
      setNewPassword((current) => current.slice(0, -1));

      /**
       * 使用者刪除新密碼後，確認密碼必須重新輸入。
       */
      setConfirmPassword('');
      setIsConfirmPasswordInputVisible(false);

      return;
    }

    if (activeCustomKeyboardInput === 'confirmPassword') {
      setConfirmPassword((current) => current.slice(0, -1));
      return;
    }

    if (activeCustomKeyboardInput === 'deleteAccount') {
      setDeleteAccountText((current) => current.slice(0, -1));
      setDeleteAccountErrorMessage('');
    }

    if (activeCustomKeyboardInput === 'emailChange') {
      setEmailChangeText((current) => current.slice(0, -1));
      setEmailChangeErrorMessage('');
      return;
    }

    if (activeCustomKeyboardInput.startsWith('emailCode-')) {
      const index = Number(activeCustomKeyboardInput.replace('emailCode-', ''));

      if (!Number.isInteger(index) || index < 0 || index > 4) {
        return;
      }

      setEmailVerificationCode((current) => {
        const next = [...current];

        if (next[index]) {
          next[index] = '';
          return next;
        }

        if (index > 0) {
          next[index - 1] = '';

          requestAnimationFrame(() => {
            emailCodeInputRefs.current[index - 1]?.focus();
            setActiveCustomKeyboardInput(`emailCode-${index - 1}`);
          });
        }

        return next;
      });

      setEmailChangeErrorMessage('');
      return;
    }
  };

  const submitEmailVerificationCode = async (code: string) => {
    if (isEmailSubmitting) {
      return;
    }

    if (code.length < 5) {
      setEmailChangeErrorMessage(copy.verificationCodeError);
      return;
    }

    setIsEmailSubmitting(true);
    setEmailChangeErrorMessage('');
    setActiveCustomKeyboardInput(null);

    emailCodeInputRefs.current.forEach((inputRef) => {
      inputRef?.blur();
    });

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      if (emailChangeStep === 'verifyCurrentEmail') {
        await authClient.verifyCurrentEmailCode({
          token,
          body: {
            code,
          },
        });

        setEmailChangeStep('newEmail');
        setEmailChangeText('');
        setIsEmailVerificationSent(false);
        setEmailVerificationCode(['', '', '', '', '']);
        setEmailResendSeconds(0);
        setEmailChangeErrorMessage('');

        requestAnimationFrame(() => {
          emailChangeInputRef.current?.focus();
          setActiveCustomKeyboardInput('emailChange');
        });

        return;
      }

      const response = await authClient.changeEmail({
        token,
        body: {
          newEmail: emailChangeText.trim(),
          code,
        },
      });

      await setAccessToken(response.token);
      await setUserEmail(response.userEmail);

      await fetchBillingSummaryOnce();

      console.log('[SettingsPanel] email changed:', {
        userId: response.userId,
        userEmail: response.userEmail,
        sessionVersion: response.sessionVersion,
      });

      resetEmailChangeState();
      setCurrentPage('account');
    } catch (error) {
      console.log('[SettingsPanel] verify email code failed:', error);

      const message = error instanceof Error ? error.message : String(error);
      setEmailChangeErrorMessage(message || copy.verificationCodeError);

      setEmailVerificationCode(['', '', '', '', '']);

      requestAnimationFrame(() => {
        emailCodeInputRefs.current[0]?.focus();
        setActiveCustomKeyboardInput('emailCode-0');
      });
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handlePasswordKeyboardDone = () => {
    currentPasswordInputRef.current?.blur();
    newPasswordInputRef.current?.blur();
    confirmPasswordInputRef.current?.blur();
    deleteAccountInputRef.current?.blur();
    emailChangeInputRef.current?.blur();
    emailVerifyPasswordInputRef.current?.blur();

    emailCodeInputRefs.current.forEach((inputRef) => {
      inputRef?.blur();
    });

    setActiveCustomKeyboardInput(null);
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.title}>
          {currentPage === 'subscription'
            ? copy.subscription
            : currentPage === 'account'
              ? copy.accountPassword
              : currentPage === 'planContent'
                ? copy.planContent
                : currentPage === 'cardManagement'
                  ? copy.cardManagement
                  : currentPage === 'passwordChange'
                    ? ''
                    : currentPage === 'deleteAccount'
                      ? ''
                      : currentPage === 'emailChange'
                        ? ''
                        : copy.settings}
        </Text>

        {currentPage === 'subscription' ? (
          <View style={styles.subscriptionGrid}>
            {subscriptionItems.map((item) => {
              const Icon = item.Icon;

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.subscriptionCard,
                    { width: cardWidth },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => {
                    console.log('[SettingsPanel] press subscription item:', item.title);

                    if (item.id === 'plan-content') {
                      setCurrentPage('planContent');
                      return;
                    }

                    if (item.id === 'card-management') {
                      setCurrentPage('cardManagement');
                    }
                  }}
                >
                  <ImageBackground
                    source={require('@/assets/images/home-panel-background.png')}
                    style={styles.cardBackground}
                    imageStyle={styles.cardBackgroundImage}
                    resizeMode="cover"
                  >
                    <View style={styles.cardTitleRow}>
                      <Icon width={32} height={32} />
                      <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>

                    {item.description ? (
                      <Text style={styles.cardDescription}>{item.description}</Text>
                    ) : (
                      <View />
                    )}
                  </ImageBackground>
                </Pressable>
              );
            })}
          </View>
        ) : currentPage === 'planContent' ? (
          <View style={styles.planContentPage}>
            {isBillingLoading ? (
              <Text style={styles.planStatusText}>{copy.loadingSubscription}</Text>
            ) : billingErrorMessage ? (
              <Text style={styles.planErrorText}>{billingErrorMessage}</Text>
            ) : (
              <View style={styles.planRows}>
                {planContentRows.map((row) => (
                  <View key={row.id} style={styles.planRow}>
                    <Text style={styles.planRowLabel}>{row.label}</Text>

                    <View style={styles.planRowValueArea}>
                      <Text style={styles.planRowValue}>{row.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : currentPage === 'cardManagement' ? (
          <View style={styles.cardManagementPage}>
            <Text style={styles.cardManagementDescription}>{copy.cardVerifiedDescription}</Text>

            <View style={styles.paymentCardGrid}>
              {paymentCardItems.map((card) => (
                <ImageBackground
                  key={card.id}
                  source={require('@/assets/images/home-panel-background.png')}
                  style={styles.paymentCard}
                  imageStyle={styles.cardBackgroundImage}
                  resizeMode="cover"
                >
                  <View style={styles.paymentCardTopRow}>
                    <Text style={styles.paymentCardBrand}>{card.brand}</Text>
                    {/* <Text style={styles.paymentCardMore}>...</Text> */}
                    <Pressable
                      style={styles.paymentCardMoreButton}
                      onPress={() => {
                        setActivePaymentMethodId((currentId) =>
                          currentId === card.id ? null : card.id,
                        );
                      }}
                    >
                      <Text style={styles.paymentCardMore}>...</Text>
                    </Pressable>
                  </View>

                  <View style={styles.paymentCardBottomRow}>
                    <Text style={styles.paymentCardNumber}>{card.number}</Text>

                    {card.isDefault ? (
                      <View style={styles.defaultCardBadge}>
                        <Text style={styles.defaultCardBadgeText}>預設</Text>
                      </View>
                    ) : null}
                  </View>

                  {activePaymentMethodId === card.id ? (
                    <View style={styles.paymentMethodMenu}>
                      <Pressable
                        style={styles.paymentMethodMenuItem}
                        disabled={card.isDefault}
                        onPress={async () => {
                          setActivePaymentMethodId(null);
                          await setDefaultPaymentMethod(card.id);
                        }}
                      >
                        <Text
                          style={[
                            styles.paymentMethodMenuText,
                            card.isDefault && styles.paymentMethodMenuTextDisabled,
                          ]}
                        >
                          設為預設
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.paymentMethodMenuItem}
                        onPress={async () => {
                          setActivePaymentMethodId(null);
                          await deletePaymentMethod(card.id);
                        }}
                      >
                        <Text style={styles.paymentMethodMenuDeleteText}>刪除卡片</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </ImageBackground>
              ))}
            </View>
          </View>
        ) : currentPage === 'passwordChange' ? (
          <View style={styles.passwordChangePage}>
            <Text style={styles.passwordChangeTitle}>
              {passwordStep === 'current' ? copy.passwordChange : copy.setPassword}
            </Text>

            <Text style={styles.passwordRuleText}>
              密碼至少 8
              個字，包含大小寫英文字母和數字。只接受英文字母、數字和常見符號（!@#|&lt;_&gt;）。
            </Text>

            {passwordStep === 'current' ? (
              <View style={styles.passwordCurrentBlock}>
                <View style={styles.passwordInputGroup}>
                  <Text style={styles.passwordInputLabel}>{copy.currentPassword}</Text>

                  <View
                    style={[
                      styles.passwordInputWrapper,
                      passwordErrorMessage && styles.passwordInputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={currentPasswordInputRef}
                      value={currentPassword}
                      onChangeText={(value) => {
                        setCurrentPassword(value);
                        setPasswordErrorMessage('');
                      }}
                      secureTextEntry={!isCurrentPasswordVisible}
                      placeholder={copy.passwordPlaceholder}
                      placeholderTextColor="rgba(255, 255, 255, 0.42)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      showSoftInputOnFocus={false}
                      caretHidden={false}
                      selectionColor="#FF7A00"
                      cursorColor="#FF7A00"
                      onFocus={() => {
                        setActiveCustomKeyboardInput('currentPassword');
                      }}
                      onPressIn={() => {
                        setActiveCustomKeyboardInput('currentPassword');
                      }}
                      style={styles.passwordInput}
                    />
                    <Pressable
                      style={styles.passwordEyeButton}
                      hitSlop={10}
                      onPress={() => {
                        setIsCurrentPasswordVisible((current) => !current);
                      }}
                    >
                      <Ionicons
                        name={isCurrentPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                        size={24}
                        color="rgba(255, 255, 255, 0.72)"
                      />
                    </Pressable>
                  </View>

                  {passwordErrorMessage ? (
                    <Text style={styles.passwordErrorText}>{passwordErrorMessage}</Text>
                  ) : null}
                </View>

                <View style={styles.passwordActionGroup}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.passwordConfirmButton,
                      pressed && !isCurrentPasswordChecking && styles.passwordConfirmButtonPressed,
                      (currentPassword.length === 0 || isCurrentPasswordChecking) &&
                        styles.passwordConfirmButtonDisabled,
                    ]}
                    disabled={currentPassword.length === 0 || isCurrentPasswordChecking}
                    onPress={async () => {
                      if (currentPassword.length < 8) {
                        setPasswordErrorMessage(copy.passwordError);
                        return;
                      }

                      setIsCurrentPasswordChecking(true);
                      setPasswordErrorMessage('');
                      setActiveCustomKeyboardInput(null);

                      // try {
                      //   /**
                      //    * 這裡之後替換成正式驗證原密碼 API。
                      //    * 例如：
                      //    * await authClient.verifyCurrentPassword({
                      //    *   currentPassword,
                      //    * });
                      //    */
                      //   await new Promise((resolve) => setTimeout(resolve, 800));

                      //   setPasswordStep('newPassword');
                      //   setPasswordErrorMessage('');
                      // } catch (error) {
                      //   console.log('[SettingsPanel] current password check failed:', error);
                      //   setPasswordErrorMessage(copy.passwordError);
                      // } finally {
                      //   setIsCurrentPasswordChecking(false);
                      // }

                      try {
                        const token = await getAccessToken();

                        if (!token) {
                          throw new Error('Missing access token.');
                        }

                        await authClient.verifyCurrentPassword({
                          token,
                          body: {
                            currentPassword,
                          },
                        });

                        setPasswordStep('newPassword');
                        setPasswordErrorMessage('');
                      } catch (error) {
                        console.log('[SettingsPanel] current password check failed:', error);

                        const message = error instanceof Error ? error.message : String(error);
                        setPasswordErrorMessage(message || copy.passwordError);
                      } finally {
                        setIsCurrentPasswordChecking(false);
                      }
                    }}
                  >
                    {isCurrentPasswordChecking ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.passwordConfirmButtonText}>{copy.confirm}</Text>
                    )}
                  </Pressable>

                  <Pressable
                    disabled={isCurrentPasswordChecking}
                    onPress={() => {
                      console.log('[SettingsPanel] press forgot password');
                    }}
                  >
                    <Text
                      style={[
                        styles.forgotPasswordText,
                        isCurrentPasswordChecking && styles.forgotPasswordTextDisabled,
                      ]}
                    >
                      {copy.forgotPassword}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.passwordNewBlock}>
                <View style={styles.passwordInputGroup}>
                  <Text style={styles.passwordInputLabel}>{copy.newPassword}</Text>

                  <View
                    style={[
                      styles.passwordInputWrapper,
                      passwordErrorMessage &&
                        !isConfirmPasswordInputVisible &&
                        styles.passwordInputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={newPasswordInputRef}
                      value={newPassword}
                      onChangeText={(value) => {
                        setNewPassword(value);
                        setPasswordErrorMessage('');

                        /**
                         * 使用者只要重新修改新密碼，
                         * 就必須重新按一次「完成」確認格式。
                         */
                        setConfirmPassword('');
                        setIsConfirmPasswordInputVisible(false);

                        if (activeCustomKeyboardInput === 'confirmPassword') {
                          setActiveCustomKeyboardInput('newPassword');
                        }
                      }}
                      secureTextEntry={!isNewPasswordVisible}
                      placeholder={copy.passwordPlaceholder}
                      placeholderTextColor="rgba(255, 255, 255, 0.42)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      showSoftInputOnFocus={false}
                      caretHidden={false}
                      selectionColor="#FF7A00"
                      cursorColor="#FF7A00"
                      onFocus={() => {
                        setActiveCustomKeyboardInput('newPassword');
                      }}
                      onPressIn={() => {
                        setActiveCustomKeyboardInput('newPassword');
                      }}
                      style={styles.passwordInput}
                    />

                    <Pressable
                      style={styles.passwordEyeButton}
                      hitSlop={10}
                      onPress={() => {
                        setIsNewPasswordVisible((current) => !current);
                      }}
                    >
                      <Ionicons
                        name={isNewPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                        size={24}
                        color="rgba(255, 255, 255, 0.72)"
                      />
                    </Pressable>
                  </View>

                  {passwordErrorMessage && !isConfirmPasswordInputVisible ? (
                    <Text style={styles.passwordErrorText}>{passwordErrorMessage}</Text>
                  ) : null}
                </View>

                {isConfirmPasswordInputVisible ? (
                  <View style={styles.passwordInputGroup}>
                    <Text style={styles.passwordInputLabel}>{copy.confirmPassword}</Text>

                    <View
                      style={[
                        styles.passwordInputWrapper,
                        passwordErrorMessage && styles.passwordInputWrapperError,
                      ]}
                    >
                      <TextInput
                        ref={confirmPasswordInputRef}
                        value={confirmPassword}
                        onChangeText={(value) => {
                          setConfirmPassword(value);
                          setPasswordErrorMessage('');
                        }}
                        secureTextEntry={!isConfirmPasswordVisible}
                        placeholder={copy.passwordPlaceholder}
                        placeholderTextColor="rgba(255, 255, 255, 0.42)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        showSoftInputOnFocus={false}
                        caretHidden={false}
                        selectionColor="#FF7A00"
                        cursorColor="#FF7A00"
                        onFocus={() => {
                          setActiveCustomKeyboardInput('confirmPassword');
                        }}
                        onPressIn={() => {
                          setActiveCustomKeyboardInput('confirmPassword');
                        }}
                        style={styles.passwordInput}
                      />

                      <Pressable
                        style={styles.passwordEyeButton}
                        hitSlop={10}
                        onPress={() => {
                          setIsConfirmPasswordVisible((current) => !current);
                        }}
                      >
                        <Ionicons
                          name={isConfirmPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                          size={24}
                          color="rgba(255, 255, 255, 0.72)"
                        />
                      </Pressable>
                    </View>

                    {passwordErrorMessage ? (
                      <Text style={styles.passwordErrorText}>{passwordErrorMessage}</Text>
                    ) : null}
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.passwordDoneButton,
                    pressed && !isPasswordSubmitting && styles.passwordConfirmButtonPressed,
                    (newPassword.length === 0 || isPasswordSubmitting) &&
                      styles.passwordConfirmButtonDisabled,
                  ]}
                  disabled={newPassword.length === 0 || isPasswordSubmitting}
                  onPress={async () => {
                    /**
                     * 第一階段：
                     * 還沒顯示確認密碼欄位時，這個「完成」只負責驗證新密碼格式。
                     */
                    if (!isConfirmPasswordInputVisible) {
                      if (!isValidPassword(newPassword)) {
                        setPasswordErrorMessage(copy.passwordFormatError);
                        return;
                      }

                      setPasswordErrorMessage('');
                      setConfirmPassword('');
                      setIsConfirmPasswordInputVisible(true);

                      requestAnimationFrame(() => {
                        confirmPasswordInputRef.current?.focus();
                        setActiveCustomKeyboardInput('confirmPassword');
                      });

                      return;
                    }

                    /**
                     * 第二階段：
                     * 確認密碼欄位已經出現後，這個「完成」才負責送出。
                     */
                    if (confirmPassword.length === 0) {
                      setPasswordErrorMessage(copy.passwordRequiredAgain);
                      return;
                    }

                    if (newPassword !== confirmPassword) {
                      setPasswordErrorMessage(copy.passwordMismatch);
                      return;
                    }

                    setIsPasswordSubmitting(true);
                    setActiveCustomKeyboardInput(null);

                    // try {
                    //   console.log('[SettingsPanel] password change submit:', {
                    //     newPasswordLength: newPassword.length,
                    //   });

                    //   /**
                    //    * 這裡之後替換成正式 API。
                    //    * 例如：
                    //    * await authClient.changePassword({
                    //    *   oldPassword: currentPassword,
                    //    *   newPassword,
                    //    * });
                    //    */
                    //   await new Promise((resolve) => setTimeout(resolve, 800));

                    //   // handlePressBack();
                    //   leavePasswordChangePage();
                    // } catch (error) {
                    //   console.log('[SettingsPanel] password change failed:', error);
                    //   setPasswordErrorMessage(copy.passwordChangeFailed);
                    // } finally {
                    //   setIsPasswordSubmitting(false);
                    // }

                    try {
                      const token = await getAccessToken();

                      if (!token) {
                        throw new Error('Missing access token.');
                      }

                      const response = await authClient.changePassword({
                        token,
                        body: {
                          currentPassword,
                          newPassword,
                        },
                      });

                      await setAccessToken(response.token);
                      await setUserEmail(response.userEmail);

                      console.log('[SettingsPanel] password changed:', {
                        userId: response.userId,
                        userEmail: response.userEmail,
                        sessionVersion: response.sessionVersion,
                      });

                      leavePasswordChangePage();
                    } catch (error) {
                      console.log('[SettingsPanel] password change failed:', error);

                      const message = error instanceof Error ? error.message : String(error);
                      setPasswordErrorMessage(message || copy.passwordChangeFailed);
                    } finally {
                      setIsPasswordSubmitting(false);
                    }
                  }}
                >
                  {isPasswordSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.passwordConfirmButtonText}>{copy.complete}</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        ) : currentPage === 'deleteAccount' ? (
          <View style={styles.deleteAccountPage}>
            <Text style={styles.deleteAccountTitle}>{copy.permanentDeleteAccount}</Text>

            <Text style={styles.deleteAccountDescription}>{copy.deleteAccountDescription}</Text>

            <Text style={styles.deleteAccountInstruction}>
              {copy.deleteAccountInstructionPrefix}
              {copy.deleteAccountInstructionSuffix}
            </Text>

            <View style={styles.deleteAccountFormRow}>
              <View
                style={[
                  styles.deleteAccountInputWrapper,
                  deleteAccountErrorMessage && styles.deleteAccountInputWrapperError,
                  deleteAccountText === 'Delete' && styles.deleteAccountInputWrapperValid,
                ]}
              >
                <TextInput
                  ref={deleteAccountInputRef}
                  value={deleteAccountText}
                  onChangeText={(value) => {
                    setDeleteAccountText(value);
                    setDeleteAccountErrorMessage('');
                  }}
                  placeholder={copy.deleteAccountPlaceholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.42)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  showSoftInputOnFocus={false}
                  caretHidden={false}
                  selectionColor="#FF7A00"
                  cursorColor="#FF7A00"
                  editable={!isDeleteAccountSubmitting}
                  onFocus={() => {
                    setActiveCustomKeyboardInput('deleteAccount');
                  }}
                  onPressIn={() => {
                    setActiveCustomKeyboardInput('deleteAccount');
                  }}
                  style={styles.deleteAccountInput}
                />

                {deleteAccountText === 'Delete' ? (
                  <Ionicons name="checkmark-circle-outline" size={22} color="#00C853" />
                ) : deleteAccountText.length > 0 ? (
                  <Ionicons name="alert-circle-outline" size={22} color="#FF3B5C" />
                ) : null}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.deleteAccountButton,
                  pressed && !isDeleteAccountSubmitting && styles.passwordConfirmButtonPressed,
                  isDeleteAccountSubmitting && styles.passwordConfirmButtonDisabled,
                ]}
                disabled={isDeleteAccountSubmitting}
                onPress={async () => {
                  if (deleteAccountText.trim().length === 0) {
                    setDeleteAccountErrorMessage(copy.required);
                    return;
                  }

                  if (deleteAccountText !== 'Delete') {
                    setDeleteAccountErrorMessage(copy.inputError);
                    return;
                  }

                  const currentEmail = settingsBilling?.userEmail ?? '';

                  if (!currentEmail) {
                    setDeleteAccountErrorMessage(copy.deleteAccountFailed);
                    return;
                  }

                  setIsDeleteAccountSubmitting(true);
                  setDeleteAccountErrorMessage('');

                  // try {
                  //   console.log('[SettingsPanel] delete account submit');

                  //   /**
                  //    * 這裡之後替換成正式刪除帳號 API。
                  //    * 例如：
                  //    * await authClient.deleteAccount();
                  //    *
                  //    * API 成功後也應該清除本地 token / auth store。
                  //    */

                  //   await new Promise((resolve) => setTimeout(resolve, 900));

                  //   resetDeleteAccountState();
                  //   onClose();

                  //   InteractionManager.runAfterInteractions(() => {
                  //     setTimeout(() => {
                  //       router.replace('/login');
                  //     }, 0);
                  //   });
                  // } catch (error) {
                  //   console.log('[SettingsPanel] delete account failed:', error);
                  //   setDeleteAccountErrorMessage(copy.deleteAccountFailed);
                  // } finally {
                  //   setIsDeleteAccountSubmitting(false);
                  // }

                  try {
                    const token = await getAccessToken();

                    if (!token) {
                      throw new Error('Missing access token.');
                    }

                    await authClient.deleteAccount({
                      token,
                      body: {
                        confirmEmail: currentEmail,
                      },
                    });

                    await clearAuthSession();

                    useBillingSummaryStore.getState().reset();

                    resetDeleteAccountState();
                    onClose();

                    InteractionManager.runAfterInteractions(() => {
                      setTimeout(() => {
                        router.replace('/login');
                      }, 0);
                    });
                  } catch (error) {
                    console.log('[SettingsPanel] delete account failed:', error);

                    const message = error instanceof Error ? error.message : String(error);
                    setDeleteAccountErrorMessage(message || copy.deleteAccountFailed);
                  } finally {
                    setIsDeleteAccountSubmitting(false);
                  }
                }}
              >
                {isDeleteAccountSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteAccountButtonText}>{copy.delete}</Text>
                )}
              </Pressable>
            </View>

            {deleteAccountErrorMessage ? (
              <Text style={styles.deleteAccountErrorText}>{deleteAccountErrorMessage}</Text>
            ) : null}
          </View>
        ) : currentPage === 'emailChange' ? (
          <View style={styles.emailChangePage}>
            <Text style={styles.emailChangeTitle}>{copy.accountEditTitle}</Text>

            {!isEmailVerificationSent ? (
              <Text style={styles.emailChangeDescription}>
                {copy.emailTransferDescriptionPrefix}
                <Text style={styles.emailChangeHighlight}>{copy.emailTransferHighlight}</Text>
                {copy.emailTransferDescriptionSuffix}
              </Text>
            ) : (
              <Text style={styles.emailChangeSentText}>{copy.emailSentNotice}</Text>
            )}

            <View style={styles.emailChangeContent}>
              {emailChangeStep === 'verifyCurrentEmail' ? (
                <>
                  <Text style={styles.emailChangeLabel}>{copy.emailLabel}</Text>

                  <View style={styles.emailChangeRow}>
                    <View
                      style={[
                        styles.emailChangeInputWrapper,
                        styles.emailChangeInputWrapperDisabled,
                      ]}
                    >
                      <TextInput
                        value={currentAccountEmail}
                        editable={false}
                        selectTextOnFocus={false}
                        placeholder={copy.emailPlaceholder}
                        placeholderTextColor="rgba(255, 255, 255, 0.42)"
                        style={[styles.emailChangeInput, styles.emailChangeInputDisabled]}
                      />

                      {currentAccountEmail ? (
                        <Ionicons
                          name="lock-closed-outline"
                          size={22}
                          color="rgba(255, 255, 255, 0.56)"
                        />
                      ) : null}
                    </View>

                    {!isEmailVerificationSent ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.emailChangeButton,
                          pressed && !isEmailSubmitting && styles.passwordConfirmButtonPressed,
                          (isEmailSubmitting || !currentAccountEmail) &&
                            styles.passwordConfirmButtonDisabled,
                        ]}
                        disabled={isEmailSubmitting || !currentAccountEmail}
                        onPress={async () => {
                          setIsEmailSubmitting(true);
                          setEmailChangeErrorMessage('');
                          setActiveCustomKeyboardInput(null);

                          try {
                            const token = await getAccessToken();

                            if (!token) {
                              throw new Error('Missing access token.');
                            }

                            await authClient.sendCurrentEmailCode({
                              token,
                            });

                            setIsEmailVerificationSent(true);
                            setEmailResendSeconds(90);
                            setEmailVerificationCode(['', '', '', '', '']);

                            requestAnimationFrame(() => {
                              emailCodeInputRefs.current[0]?.focus();
                              setActiveCustomKeyboardInput('emailCode-0');
                            });
                          } catch (error) {
                            console.log('[SettingsPanel] send current email code failed:', error);

                            const message = error instanceof Error ? error.message : String(error);
                            setEmailChangeErrorMessage(message || copy.sendEmailFailed);
                          } finally {
                            setIsEmailSubmitting(false);
                          }
                        }}
                      >
                        {isEmailSubmitting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.emailChangeButtonText}>{copy.complete}</Text>
                        )}
                      </Pressable>
                    ) : emailResendSeconds > 0 ? (
                      <Text style={styles.emailResendText}>
                        {copy.resendCountdown(emailResendSeconds)}
                      </Text>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [
                          styles.emailResendButton,
                          pressed && !isEmailSubmitting && styles.passwordConfirmButtonPressed,
                          isEmailSubmitting && styles.passwordConfirmButtonDisabled,
                        ]}
                        disabled={isEmailSubmitting}
                        onPress={async () => {
                          setIsEmailSubmitting(true);
                          setEmailChangeErrorMessage('');
                          setEmailVerificationCode(['', '', '', '', '']);
                          setActiveCustomKeyboardInput(null);

                          try {
                            const token = await getAccessToken();

                            if (!token) {
                              throw new Error('Missing access token.');
                            }

                            await authClient.sendCurrentEmailCode({
                              token,
                            });

                            setEmailResendSeconds(90);

                            requestAnimationFrame(() => {
                              emailCodeInputRefs.current[0]?.focus();
                              setActiveCustomKeyboardInput('emailCode-0');
                            });
                          } catch (error) {
                            console.log('[SettingsPanel] resend current email code failed:', error);

                            const message = error instanceof Error ? error.message : String(error);
                            setEmailChangeErrorMessage(message || copy.resendEmailFailed);
                          } finally {
                            setIsEmailSubmitting(false);
                          }
                        }}
                      >
                        {isEmailSubmitting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.emailResendButtonText}>{copy.resendCode}</Text>
                        )}
                      </Pressable>
                    )}
                  </View>

                  {emailChangeErrorMessage && !isEmailVerificationSent ? (
                    <Text style={styles.emailChangeErrorText}>{emailChangeErrorMessage}</Text>
                  ) : null}

                  {isEmailVerificationSent ? (
                    <View style={styles.emailCodeBlock}>
                      <View style={styles.emailCodeLabelRow}>
                        <Text style={styles.emailCodeLabel}>{copy.verificationCodeLabel}</Text>

                        {emailChangeErrorMessage ? (
                          <Text style={styles.emailCodeErrorText}>{emailChangeErrorMessage}</Text>
                        ) : (
                          <Text style={styles.emailCodeHintText}>{copy.verificationCodeHint}</Text>
                        )}
                      </View>

                      <View style={styles.emailCodeRow}>
                        {emailVerificationCode.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => {
                              emailCodeInputRefs.current[index] = ref;
                            }}
                            value={digit}
                            onChangeText={(value) => {
                              const nextDigit = value.slice(-1);

                              if (nextDigit && !/^\d$/.test(nextDigit)) {
                                return;
                              }

                              setEmailVerificationCode((current) => {
                                const next = [...current];
                                next[index] = nextDigit;

                                if (nextDigit && index < 4) {
                                  requestAnimationFrame(() => {
                                    emailCodeInputRefs.current[index + 1]?.focus();
                                    setActiveCustomKeyboardInput(`emailCode-${index + 1}`);
                                  });
                                }

                                if (nextDigit && index === 4) {
                                  const code = next.join('');

                                  requestAnimationFrame(() => {
                                    submitEmailVerificationCode(code);
                                  });
                                }

                                return next;
                              });

                              setEmailChangeErrorMessage('');
                            }}
                            showSoftInputOnFocus={false}
                            caretHidden={false}
                            selectionColor="#FF7A00"
                            cursorColor="#FF7A00"
                            editable={!isEmailSubmitting}
                            onFocus={() => {
                              setActiveCustomKeyboardInput(`emailCode-${index}`);
                            }}
                            onPressIn={() => {
                              setActiveCustomKeyboardInput(`emailCode-${index}`);
                            }}
                            style={[
                              styles.emailCodeInput,
                              emailChangeErrorMessage && styles.emailCodeInputError,
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.emailChangeLabel}>{copy.emailLabel}</Text>

                  <View style={styles.emailChangeRow}>
                    <View
                      style={[
                        styles.emailChangeInputWrapper,
                        emailChangeErrorMessage &&
                          !isEmailVerificationSent &&
                          styles.emailChangeInputWrapperError,
                        isValidEmail(emailChangeText) && styles.emailChangeInputWrapperValid,
                      ]}
                    >
                      <TextInput
                        ref={emailChangeInputRef}
                        value={emailChangeText}
                        onChangeText={(value) => {
                          setEmailChangeText(value);
                          setEmailChangeErrorMessage('');
                        }}
                        placeholder={copy.emailPlaceholder}
                        placeholderTextColor="rgba(255, 255, 255, 0.42)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        showSoftInputOnFocus={false}
                        caretHidden={false}
                        selectionColor="#FF7A00"
                        cursorColor="#FF7A00"
                        editable={!isEmailSubmitting && !isEmailVerificationSent}
                        onFocus={() => {
                          if (!isEmailVerificationSent) {
                            setActiveCustomKeyboardInput('emailChange');
                          }
                        }}
                        onPressIn={() => {
                          if (!isEmailVerificationSent) {
                            setActiveCustomKeyboardInput('emailChange');
                          }
                        }}
                        style={styles.emailChangeInput}
                      />

                      {isValidEmail(emailChangeText) ? (
                        <Ionicons name="checkmark-circle-outline" size={22} color="#00C853" />
                      ) : emailChangeText.length > 0 ? (
                        <Ionicons name="alert-circle-outline" size={22} color="#FF3B5C" />
                      ) : null}
                    </View>

                    {!isEmailVerificationSent ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.emailChangeButton,
                          pressed && !isEmailSubmitting && styles.passwordConfirmButtonPressed,
                          isEmailSubmitting && styles.passwordConfirmButtonDisabled,
                        ]}
                        disabled={isEmailSubmitting}
                        onPress={async () => {
                          if (emailChangeText.trim().length === 0) {
                            setEmailChangeErrorMessage(copy.required);
                            return;
                          }

                          if (!isValidEmail(emailChangeText)) {
                            setEmailChangeErrorMessage(copy.emailFormatError);
                            return;
                          }

                          const normalizedNewEmail = emailChangeText.trim().toLowerCase();
                          const normalizedCurrentEmail = currentAccountEmail.trim().toLowerCase();

                          if (normalizedNewEmail === normalizedCurrentEmail) {
                            setEmailChangeErrorMessage('新電子郵件不可與目前帳號相同');
                            return;
                          }

                          setIsEmailSubmitting(true);
                          setEmailChangeErrorMessage('');
                          setActiveCustomKeyboardInput(null);
                          emailChangeInputRef.current?.blur();

                          try {
                            const token = await getAccessToken();

                            if (!token) {
                              throw new Error('Missing access token.');
                            }

                            await authClient.sendChangeEmailCode({
                              token,
                              body: {
                                newEmail: emailChangeText.trim(),
                              },
                            });

                            setIsEmailVerificationSent(true);
                            setEmailResendSeconds(90);
                            setEmailVerificationCode(['', '', '', '', '']);

                            requestAnimationFrame(() => {
                              emailCodeInputRefs.current[0]?.focus();
                              setActiveCustomKeyboardInput('emailCode-0');
                            });
                          } catch (error) {
                            console.log(
                              '[SettingsPanel] send new email verification failed:',
                              error,
                            );

                            const message = error instanceof Error ? error.message : String(error);
                            setEmailChangeErrorMessage(message || copy.sendEmailFailed);
                          } finally {
                            setIsEmailSubmitting(false);
                          }
                        }}
                      >
                        {isEmailSubmitting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.emailChangeButtonText}>{copy.complete}</Text>
                        )}
                      </Pressable>
                    ) : emailResendSeconds > 0 ? (
                      <Text style={styles.emailResendText}>
                        {copy.resendCountdown(emailResendSeconds)}
                      </Text>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [
                          styles.emailResendButton,
                          pressed && !isEmailSubmitting && styles.passwordConfirmButtonPressed,
                          isEmailSubmitting && styles.passwordConfirmButtonDisabled,
                        ]}
                        disabled={isEmailSubmitting}
                        onPress={async () => {
                          if (emailChangeText.trim().length === 0) {
                            setEmailChangeErrorMessage(copy.required);
                            return;
                          }

                          if (!isValidEmail(emailChangeText)) {
                            setEmailChangeErrorMessage(copy.emailFormatError);
                            return;
                          }

                          setIsEmailSubmitting(true);
                          setEmailChangeErrorMessage('');
                          setEmailVerificationCode(['', '', '', '', '']);
                          setActiveCustomKeyboardInput(null);

                          try {
                            const token = await getAccessToken();

                            if (!token) {
                              throw new Error('Missing access token.');
                            }

                            await authClient.sendChangeEmailCode({
                              token,
                              body: {
                                newEmail: emailChangeText.trim(),
                              },
                            });

                            setEmailResendSeconds(90);

                            requestAnimationFrame(() => {
                              emailCodeInputRefs.current[0]?.focus();
                              setActiveCustomKeyboardInput('emailCode-0');
                            });
                          } catch (error) {
                            console.log(
                              '[SettingsPanel] resend new email verification failed:',
                              error,
                            );

                            const message = error instanceof Error ? error.message : String(error);
                            setEmailChangeErrorMessage(message || copy.resendEmailFailed);
                          } finally {
                            setIsEmailSubmitting(false);
                          }
                        }}
                      >
                        {isEmailSubmitting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.emailResendButtonText}>{copy.resendCode}</Text>
                        )}
                      </Pressable>
                    )}
                  </View>

                  {emailChangeErrorMessage && !isEmailVerificationSent ? (
                    <Text style={styles.emailChangeErrorText}>{emailChangeErrorMessage}</Text>
                  ) : null}

                  {isEmailVerificationSent ? (
                    <View style={styles.emailCodeBlock}>
                      <View style={styles.emailCodeLabelRow}>
                        <Text style={styles.emailCodeLabel}>{copy.verificationCodeLabel}</Text>

                        {emailChangeErrorMessage ? (
                          <Text style={styles.emailCodeErrorText}>{emailChangeErrorMessage}</Text>
                        ) : (
                          <Text style={styles.emailCodeHintText}>{copy.verificationCodeHint}</Text>
                        )}
                      </View>

                      <View style={styles.emailCodeRow}>
                        {emailVerificationCode.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => {
                              emailCodeInputRefs.current[index] = ref;
                            }}
                            value={digit}
                            onChangeText={(value) => {
                              const nextDigit = value.slice(-1);

                              if (nextDigit && !/^\d$/.test(nextDigit)) {
                                return;
                              }

                              setEmailVerificationCode((current) => {
                                const next = [...current];
                                next[index] = nextDigit;

                                if (nextDigit && index < 4) {
                                  requestAnimationFrame(() => {
                                    emailCodeInputRefs.current[index + 1]?.focus();
                                    setActiveCustomKeyboardInput(`emailCode-${index + 1}`);
                                  });
                                }

                                if (nextDigit && index === 4) {
                                  const code = next.join('');

                                  requestAnimationFrame(() => {
                                    submitEmailVerificationCode(code);
                                  });
                                }

                                return next;
                              });

                              setEmailChangeErrorMessage('');
                            }}
                            showSoftInputOnFocus={false}
                            caretHidden={false}
                            selectionColor="#FF7A00"
                            cursorColor="#FF7A00"
                            editable={!isEmailSubmitting}
                            onFocus={() => {
                              setActiveCustomKeyboardInput(`emailCode-${index}`);
                            }}
                            onPressIn={() => {
                              setActiveCustomKeyboardInput(`emailCode-${index}`);
                            }}
                            style={[
                              styles.emailCodeInput,
                              emailChangeErrorMessage && styles.emailCodeInputError,
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </View>
        ) : currentPage === 'account' ? (
          <View style={styles.accountPage}>
            <View style={styles.accountGrid}>
              {accountItems.map((item) => {
                const Icon = item.Icon;

                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.accountCard,
                      { width: cardWidth },
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => {
                      console.log('[SettingsPanel] press account item:', item.title);

                      if (item.id === 'email') {
                        resetEmailChangeState();
                        setCurrentPage('emailChange');
                        return;
                      }

                      if (item.id === 'password') {
                        setCurrentPage('passwordChange');
                        setPasswordStep('current');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordErrorMessage('');
                        setIsConfirmPasswordInputVisible(false);
                      }
                    }}
                  >
                    <ImageBackground
                      source={require('@/assets/images/home-panel-background.png')}
                      style={styles.cardBackground}
                      imageStyle={styles.cardBackgroundImage}
                      resizeMode="cover"
                    >
                      <View style={styles.cardTitleRow}>
                        <Icon width={32} height={32} />
                        <Text style={styles.cardTitle}>{item.title}</Text>
                      </View>

                      <Text style={styles.cardDescription}>{item.description}</Text>
                    </ImageBackground>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.accountActions}>
              <Pressable
                style={({ pressed }) => [styles.accountActionButton, pressed && styles.cardPressed]}
                onPress={() => {
                  console.log('[SettingsPanel] press logout');
                  setIsLogoutConfirmVisible(true);
                }}
              >
                <View style={styles.accountActionContent}>
                  <SettingAccExitIcon width={24} height={24} />
                  <Text style={styles.accountActionText}>{copy.logout}</Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.accountActionButton, pressed && styles.cardPressed]}
                onPress={() => {
                  resetDeleteAccountState();
                  setCurrentPage('deleteAccount');
                }}
              >
                <View style={styles.accountActionContent}>
                  <SettingAccDeleteIcon width={24} height={24} />
                  <Text style={styles.deleteAccountText}>{copy.deleteAccount}</Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.grid}>
            {settingItems.map((item) => {
              const Icon = item.Icon;

              if (item.isPlaceholder) {
                return (
                  <View
                    key={item.id}
                    style={[styles.card, { width: cardWidth }, styles.placeholderCard]}
                  />
                );
              }

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.card,
                    { width: cardWidth },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => {
                    console.log('[SettingsPanel] press setting item:', item.title);

                    if (item.id === 'subscription') {
                      setCurrentPage('subscription');
                      return;
                    }

                    if (item.id === 'account') {
                      setCurrentPage('account');
                    }

                    if (item.id === 'language') {
                      setIsLanguageModalVisible(true);
                    }

                    if (item.id === 'add-song') {
                      setQrModalType('add-song');
                      return;
                    }

                    if (item.id === 'report') {
                      setQrModalType('report');
                    }
                  }}
                >
                  <ImageBackground
                    source={require('@/assets/images/home-panel-background.png')}
                    style={styles.cardBackground}
                    imageStyle={styles.cardBackgroundImage}
                    resizeMode="cover"
                  >
                    <View style={styles.cardTitleRow}>
                      {Icon ? <Icon width={32} height={32} /> : null}
                      <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>

                    <Text style={styles.cardDescription}>{item.description}</Text>
                  </ImageBackground>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          //   onPress={onClose}
          onPress={handlePressBack}
        >
          <Text style={styles.backButtonText}>{copy.back}</Text>
        </Pressable>
      </View>

      {isLogoutConfirmVisible ? (
        <View style={styles.confirmOverlay}>
          <ImageBackground
            source={require('@/assets/images/language-bg.jpg')}
            style={styles.logoutConfirmBox}
            imageStyle={styles.logoutConfirmBoxImage}
            resizeMode="cover"
          >
            <View style={styles.logoutConfirmDarkOverlay} />

            <View style={styles.logoutConfirmContent}>
              <Text style={styles.logoutConfirmTitle}>{copy.logoutConfirmTitle}</Text>

              <View style={styles.logoutConfirmActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.logoutCancelButton,
                    pressed && styles.confirmButtonPressed,
                  ]}
                  onPress={() => {
                    setIsLogoutConfirmVisible(false);
                  }}
                >
                  <Text style={styles.logoutCancelText}>{copy.cancel}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.logoutConfirmButton,
                    pressed && styles.confirmButtonPressed,
                  ]}
                  onPress={handleConfirmLogout}
                >
                  <Text style={styles.logoutConfirmButtonText}>{copy.logout}</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>
      ) : null}

      {isPasswordLeaveConfirmVisible ? (
        <View style={styles.confirmOverlay}>
          <ImageBackground
            source={require('@/assets/images/language-bg.jpg')}
            style={styles.passwordLeaveConfirmBox}
            imageStyle={styles.passwordLeaveConfirmBoxImage}
            resizeMode="cover"
          >
            <View style={styles.passwordLeaveConfirmDarkOverlay} />

            <View style={styles.passwordLeaveConfirmContent}>
              <Text style={styles.passwordLeaveConfirmTitle}>{copy.leavePasswordTitle}</Text>

              <Text style={styles.passwordLeaveConfirmDescription}>
                {copy.leavePasswordDescription}
              </Text>

              <View style={styles.passwordLeaveConfirmActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.passwordLeaveButton,
                    pressed && styles.confirmButtonPressed,
                  ]}
                  onPress={leavePasswordChangePage}
                >
                  <Text style={styles.passwordLeaveButtonText}>{copy.leave}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.passwordContinueButton,
                    pressed && styles.confirmButtonPressed,
                  ]}
                  onPress={() => {
                    setIsPasswordLeaveConfirmVisible(false);
                  }}
                >
                  <Text style={styles.passwordContinueButtonText}>{copy.continue}</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>
      ) : null}

      <LanguageSelectModal
        visible={isLanguageModalVisible}
        selectedLanguageId={language}
        onClose={() => {
          setIsLanguageModalVisible(false);
        }}
        onPressLanguage={async (option) => {
          await setLanguage(option.id);
          setIsLanguageModalVisible(false);
        }}
      />

      <Modal
        visible={qrModalType !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => {
          setQrModalType(null);
        }}
      >
        <Pressable
          style={styles.qrModalOverlay}
          onPress={() => {
            setQrModalType(null);
          }}
        >
          <BlurView
            intensity={28}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
            experimentalBlurMethod="dimezisBlurView"
          />

          <View style={styles.qrModalDarkLayer} />

          <Pressable
            style={styles.qrModalBox}
            onPress={(event) => {
              event.stopPropagation();
            }}
          >
            <Text style={styles.qrModalTitle}>{qrModalTitle}</Text>

            <View style={styles.qrContainer}>
              <QRCode value={qrModalUrl} size={160} color="#222222" backgroundColor="#FFFFFF" />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <CustomEmailKeyboard
        visible={
          (currentPage === 'passwordChange' ||
            currentPage === 'deleteAccount' ||
            currentPage === 'emailChange') &&
          activeCustomKeyboardInput !== null
        }
        onInput={handlePasswordKeyboardInput}
        onBackspace={handlePasswordKeyboardBackspace}
        onDone={handlePasswordKeyboardDone}
        offsetY={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    elevation: 80,
    // backgroundColor: 'rgba(0, 0, 0, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  panel: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 18,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 20,
  },

  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 30,
    rowGap: 30,
    // paddingHorizontal: 30,
    justifyContent: 'center',
    alignContent: 'center',
  },

  card: {
    // width: 284,
    height: 195,
    borderRadius: 8,
    overflow: 'hidden',
  },

  cardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  cardBackground: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },

  cardBackgroundImage: {
    borderRadius: 8,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  cardDescription: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 16,
    fontWeight: '600',
  },

  backButton: {
    position: 'absolute',
    right: 24,
    bottom: 16,
    width: 154,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  placeholderCard: {
    opacity: 0,
  },

  subscriptionGrid: {
    width: '100%',
    flexDirection: 'row',
    columnGap: 30,
    paddingHorizontal: 30,
  },

  subscriptionCard: {
    height: 195,
    borderRadius: 8,
    overflow: 'hidden',
  },

  accountPage: {
    flex: 1,
  },

  accountGrid: {
    width: '100%',
    flexDirection: 'row',
    columnGap: 30,
    paddingHorizontal: 30,
  },

  accountCard: {
    height: 195,
    borderRadius: 8,
    overflow: 'hidden',
  },

  accountActions: {
    marginTop: 81,
    paddingHorizontal: 0,
    rowGap: 8,
  },

  accountActionButton: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },

  accountActionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  deleteAccountText: {
    color: '#FF3B5C',
    fontSize: 20,
    fontWeight: '800',
  },

  accountActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  planContentPage: {
    flex: 1,
  },

  cancelSubscriptionButton: {
    position: 'absolute',
    right: 0,
    top: -48,
    width: 82,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },

  cancelSubscriptionText: {
    color: '#FF3B5C',
    fontSize: 13,
    fontWeight: '800',
  },

  planRows: {
    width: '100%',
    rowGap: 5,
  },

  planRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
  },

  planRowLabel: {
    width: 200,
    paddingLeft: 50,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  planRowValueArea: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 42,
  },

  planRowValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  planRowRightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },

  planRowMutedValue: {
    color: 'rgba(255, 255, 255, 0.46)',
    fontSize: 20,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },

  planRowRightValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  cardManagementPage: {
    flex: 1,
  },

  cardManagementDescription: {
    marginTop: -4,
    marginBottom: 22,
    color: 'rgba(255, 255, 255, 0.64)',
    fontSize: 12,
    fontWeight: '600',
  },

  paymentCardGrid: {
    flexDirection: 'row',
    columnGap: 58,
  },

  paymentCard: {
    width: 500,
    height: 252,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'space-between',
    borderRadius: 6,
    overflow: 'hidden',
  },

  paymentCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  paymentCardBrand: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },

  paymentCardMore: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 17,
  },

  paymentCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  paymentCardNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },

  defaultCardBadge: {
    minWidth: 81,
    height: 34,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },

  defaultCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1200,
    elevation: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutConfirmBox: {
    width: 500,
    height: 236,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
  },

  logoutConfirmBoxImage: {
    borderRadius: 20,
  },

  logoutConfirmDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  logoutConfirmContent: {
    flex: 1,
    paddingTop: 50,
    // paddingHorizontal: 48,
  },

  logoutConfirmTitle: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 38,
  },

  logoutConfirmActions: {
    width: 500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutCancelButton: {
    width: 200,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutCancelText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },

  logoutConfirmButton: {
    width: 200,
    height: 68,
    borderRadius: 42,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FF7A00',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  confirmButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  //   languagePopupOverlay: {
  //     ...StyleSheet.absoluteFillObject,
  //     zIndex: 9999,
  //     elevation: 9999,
  //     alignItems: 'center',
  //     justifyContent: 'center',
  //     backgroundColor: 'rgba(0, 0, 0, 0.6)',
  //   },

  languageModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  languageModalDarkLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  languagePopupBox: {
    width: 485,
    height: 240,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },

  languageOptionRow: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 50,
  },

  languageOptionRowActive: {
    backgroundColor: '#FF7A00',
  },

  languageOptionText: {
    color: '#7C8287',
    fontSize: 16,
    fontWeight: '800',
  },

  languageOptionTextActive: {
    color: '#FFFFFF',
  },

  addSongModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addSongModalDarkLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  addSongQrBox: {
    width: 240,
    height: 298,
    borderRadius: 8,
    backgroundColor: 'rgba(110, 110, 110, 0.96)',
    alignItems: 'center',
    paddingTop: 36,
    zIndex: 2,
    elevation: 2,
  },

  addSongQrTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 22,
  },

  //   qrContainer: {
  //     width: 200,
  //     height: 200,
  //     borderRadius: 8,
  //     backgroundColor: 'rgba(255, 255, 255, 0.16)',
  //     alignItems: 'center',
  //     justifyContent: 'center',
  //   },

  qrGrid: {
    width: 154,
    height: 154,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: 12,
  },

  qrLargeBlock: {
    width: 66,
    height: 66,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  qrInnerBlock: {
    width: 30,
    height: 30,
    borderRadius: 3,
    backgroundColor: '#6E6E6E',
  },

  qrSmallBlock: {
    width: 20,
    height: 20,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  qrMediumBlock: {
    width: 34,
    height: 34,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  qrModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  qrModalDarkLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  qrModalBox: {
    width: 274,
    height: 340,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    paddingTop: 36,
    zIndex: 2,
    elevation: 2,
  },

  qrModalTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 22,
  },

  qrContainer: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  planStatusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  planErrorText: {
    color: '#FF5C7A',
    fontSize: 16,
    fontWeight: '700',
  },

  paymentCardMoreButton: {
    width: 40,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  paymentMethodMenu: {
    position: 'absolute',
    right: 10,
    top: 45,
    width: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 30,
    elevation: 30,
  },

  paymentMethodMenuItem: {
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },

  paymentMethodMenuText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  paymentMethodMenuTextDisabled: {
    color: 'rgba(255, 255, 255, 0.38)',
  },

  paymentMethodMenuDeleteText: {
    color: '#FF5C5C',
    fontSize: 20,
    fontWeight: '800',
  },

  passwordChangePage: {
    flex: 1,
    // paddingHorizontal: 54,
    paddingTop: 30,
  },

  passwordBackButton: {
    position: 'absolute',
    left: 74,
    top: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
  },

  passwordBackButtonText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 38,
    marginTop: -4,
  },

  passwordChangeTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 32,
  },

  passwordRuleText: {
    color: '#7C8287',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 42,
  },

  passwordCurrentBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    columnGap: 8,
  },

  passwordNewBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    columnGap: 18,
  },

  passwordInputGroup: {
    width: 475,
    position: 'relative',
  },

  passwordInputLabel: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 14,
  },

  passwordInputWrapper: {
    height: 68,
    borderRadius: 30,
    borderWidth: 1,
    // borderColor: '#FF7802',
    borderColor: '#B2B6BA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 10,
    // backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },

  passwordInputWrapperError: {
    borderColor: '#FF3B5C',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    padding: 0,
  },

  passwordEyeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  passwordEyeText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11,
    fontWeight: '800',
  },

  passwordErrorText: {
    position: 'absolute',
    left: 8,
    top: 130,

    color: '#FF3B5C',
    fontSize: 20,
    fontWeight: '800',
  },

  passwordActionGroup: {
    width: 160,
    alignItems: 'center',
    justifyContent: 'flex-end',
    transform: [{ translateY: 22 }],
  },

  passwordConfirmButton: {
    width: 156,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7A00',
    marginBottom: 14,
  },

  passwordDoneButton: {
    width: 156,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7A00',
  },

  passwordConfirmButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  passwordConfirmButtonDisabled: {
    opacity: 0.35,
  },

  passwordConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.64)',
    fontSize: 14,
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
  forgotPasswordTextDisabled: {
    opacity: 0.35,
  },

  passwordLeaveConfirmBox: {
    width: 500,
    height: 284,
    paddingTop: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
  },

  passwordLeaveConfirmBoxImage: {
    borderRadius: 28,
  },

  passwordLeaveConfirmDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  passwordLeaveConfirmContent: {
    flex: 1,
    // paddingTop: 88,
    justifyContent: 'center',
    alignItems: 'center',
  },

  passwordLeaveConfirmTitle: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },

  passwordLeaveConfirmDescription: {
    color: '#B2B6BA',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },

  passwordLeaveConfirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 0,
  },

  passwordLeaveButton: {
    width: 210,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },

  passwordLeaveButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  passwordContinueButton: {
    width: 200,
    height: 68,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FF7802',
    alignItems: 'center',
    justifyContent: 'center',
  },

  passwordContinueButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  deleteAccountPage: {
    flex: 1,
    paddingTop: 30,
    alignItems: 'center',
  },

  deleteAccountTitle: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 46,
  },

  deleteAccountDescription: {
    color: '#B2B6BA',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 52,
  },

  deleteAccountInstruction: {
    width: 685,
    color: '#B2B6BA',
    fontSize: 24,
    marginBottom: 22,
  },

  deleteAccountKeyword: {
    color: '#FF7802',
  },

  deleteAccountFormRow: {
    width: 685,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 18,
  },

  deleteAccountInputWrapper: {
    width: 475,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#7C8287',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 26,
    paddingRight: 18,
  },

  deleteAccountInputWrapperError: {
    borderColor: '#FF3B5C',
  },

  deleteAccountInputWrapperValid: {
    borderColor: '#1DD75F',
  },

  deleteAccountInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    padding: 0,
  },

  deleteAccountButton: {
    width: 200,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7A00',
  },

  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  deleteAccountErrorText: {
    width: 685,
    marginTop: 14,
    paddingLeft: 8,
    color: '#FF3B5C',
    fontSize: 18,
    fontWeight: '800',
  },

  emailChangePage: {
    flex: 1,
    // paddingTop: 30,
    alignItems: 'center',
  },

  emailChangeTitle: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 46,
  },

  emailChangeDescription: {
    color: '#7C8287',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 52,
  },

  emailChangeHighlight: {
    color: '#FF7802',
    fontWeight: '900',
  },

  emailChangeSentText: {
    color: '#FF7802',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 62,
  },

  emailChangeContent: {
    width: 685,
    alignItems: 'center',
  },

  emailChangeLabel: {
    width: 475,
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 18,
  },

  emailChangeRow: {
    position: 'relative',
    width: 475,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emailChangeInputWrapper: {
    width: 475,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#7C8287',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 26,
    paddingRight: 18,
  },

  emailChangeInputWrapperError: {
    borderColor: '#FF3B5C',
  },

  emailChangeInputWrapperValid: {
    borderColor: '#393E43',
  },

  emailChangeInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    padding: 0,
  },

  emailChangeButton: {
    position: 'absolute',
    left: 493,
    width: 200,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7A00',
  },

  emailChangeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  emailChangeErrorText: {
    width: 475,
    marginTop: 14,
    paddingLeft: 26,
    color: '#FF3B5C',
    fontSize: 18,
    fontWeight: '800',
  },

  emailResendText: {
    position: 'absolute',
    left: 500,
    top: 24,
    color: '#3DA8FF',
    fontSize: 16,
    fontWeight: '800',
  },

  emailCodeBlock: {
    width: 475,
    marginTop: 34,
  },

  emailCodeLabelRow: {
    width: 475,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  emailCodeLabel: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '900',
    marginRight: 8,
  },

  emailCodeHintText: {
    color: '#7C8287',
    fontSize: 20,
    fontWeight: '700',
  },

  emailCodeErrorText: {
    color: '#FF3B5C',
    fontSize: 16,
    fontWeight: '800',
  },

  emailCodeRow: {
    width: 475,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  emailCodeInput: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7C8287',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
  },

  emailCodeInputError: {
    borderColor: '#FF3B5C',
  },

  emailVerifyButton: {
    marginTop: 28,
    width: 200,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7A00',
  },

  emailVerifyButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  emailResendButton: {
    position: 'absolute',
    left: 500,
    top: 0,
    height: 68,
    justifyContent: 'center',
  },

  emailResendButtonText: {
    color: '#3DA8FF',
    fontSize: 16,
    fontWeight: '800',
  },

  emailChangeInputWrapperDisabled: {
    borderColor: '#393E43',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },

  emailChangeInputDisabled: {
    color: 'rgba(255, 255, 255, 0.56)',
  },
});
