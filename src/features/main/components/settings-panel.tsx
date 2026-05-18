import {
  Modal,
  ImageBackground,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import type { SvgProps } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';

import { LanguageSelectModal } from '@/src/features/main/components/language-select-modal';

// import { authClient } from '@/src/services/auth/auth-client';
// import { getAccessToken } from '@/src/services/auth/auth-token-store';

import { useBillingSummaryStore } from '@/src/features/main/store/billing-summary.store';

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

type SettingsPage = 'menu' | 'subscription' | 'account' | 'planContent' | 'cardManagement';

type SubscriptionItem = {
  id: string;
  title: string;
  description: string;
  Icon: React.ComponentType<SvgProps>;
};

const SUBSCRIPTION_ITEMS: SubscriptionItem[] = [
  {
    id: 'plan-content',
    title: '方案內容',
    description: '06/16/2025 - 06/16/2026',
    Icon: SettingPlanPersonIcon,
  },
  {
    id: 'card-management',
    title: '卡片管理',
    description: '',
    Icon: SettingPlanCardIcon,
  },
];

type AccountItem = {
  id: string;
  title: string;
  description: string;
  Icon: React.ComponentType<SvgProps>;
};

const ACCOUNT_ITEMS: AccountItem[] = [
  {
    id: 'email',
    title: '帳號',
    description: 'poccccc@gmail.com',
    Icon: SettingIcon2,
  },
  {
    id: 'password',
    title: '密碼',
    description: '••••••',
    Icon: SettingAccPassIcon,
  },
];

const SETTINGS_ITEMS: SettingItem[] = [
  {
    id: 'subscription',
    title: '訂閱方案',
    description: '年繳',
    Icon: SettingIcon1,
  },
  {
    id: 'account',
    title: '帳號密碼',
    description: 'poccccc@gmail.com',
    Icon: SettingIcon2,
  },
  {
    id: 'language',
    title: '語言選擇',
    description: '繁體中文',
    Icon: SettingIcon3,
  },
  {
    id: 'add-song',
    title: '新增歌曲',
    description: '想要加入的歌曲',
    Icon: SettingIcon4,
  },
  {
    id: 'report',
    title: '回報問題',
    description: '幫助您解決遇到的問題',
    Icon: SettingIcon5,
  },
  {
    id: 'placeholder',
    title: '',
    description: '',
    isPlaceholder: true,
  },
];

type LanguageOption = {
  id: string;
  label: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'zh-CN',
    label: '简体中文',
  },
  {
    id: 'zh-TW',
    label: '繁體中文',
  },
  {
    id: 'en',
    label: 'English',
  },
  {
    id: 'ms',
    label: 'Bahasa Melayu',
  },
];

type PlanContentRow = {
  id: string;
  label: string;
  value: string;
  rightValue?: string;
  rightMutedValue?: string;
};

const PLAN_CONTENT_ROWS: PlanContentRow[] = [
  {
    id: 'subscription-code',
    label: '訂單號碼',
    value: 'as_000000000000015',
  },
  {
    id: 'subscription-date',
    label: '訂購日期',
    value: '6月18日2025年',
  },
  {
    id: 'plan',
    label: '方案選擇',
    value: '年繳計畫',
    rightMutedValue: '$2,988',
    rightValue: 'NT$1,980',
  },
  {
    id: 'coupon',
    label: '優惠折抵',
    value: 'Abc2025615',
    rightValue: '-NT$1,979',
  },
  {
    id: 'card',
    label: '扣款帳號',
    value: '**** 0000',
  },
  {
    id: 'address',
    label: '帳單地址',
    value: '地址是地址',
  },
];

type PaymentCardItem = {
  id: string;
  brand: string;
  number: string;
  isDefault?: boolean;
};

const PAYMENT_CARD_ITEMS: PaymentCardItem[] = [
  {
    id: 'card-1',
    brand: 'VISA',
    number: '**** 0000',
    isDefault: true,
  },
  {
    id: 'card-2',
    brand: 'VISA',
    number: '**** 0000',
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsPanel({ visible, onClose }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [currentPage, setCurrentPage] = useState<SettingsPage>('menu');
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);

  const [isLanguageSelectVisible, setIsLanguageSelectVisible] = useState(false);
  const [qrModalType, setQrModalType] = useState<'add-song' | 'report' | null>(null);

  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const settingsBilling = useBillingSummaryStore((state) => state.settingsBilling);
  const isBillingLoading = useBillingSummaryStore((state) => state.isLoading);
  const billingErrorMessage = useBillingSummaryStore((state) => state.errorMessage);
  const fetchBillingSummaryOnce = useBillingSummaryStore((state) => state.fetchBillingSummaryOnce);

  // useEffect(() => {
  //   if (!visible) {
  //     return;
  //   }

  //   let isMounted = true;

  //   async function fetchSettingsUserData() {
  //     try {
  //       const token = await getAccessToken();

  //       if (!token) {
  //         console.log('[SettingsPanel] missing access token');
  //         return;
  //       }

  //       const session = await authClient.me(token);

  //       if (!isMounted) {
  //         return;
  //       }

  //       console.log(
  //         '[SettingsPanel] authClient.me response:',
  //         JSON.stringify(session, null, 2),
  //       );
  //     } catch (error) {
  //       console.log('[SettingsPanel] failed to fetch user data:', error);
  //     }
  //   }

  //   fetchSettingsUserData();

  //   return () => {
  //     isMounted = false;
  //   };
  // }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setCurrentPage('menu');
    setIsLogoutConfirmVisible(false);
    setIsLanguageModalVisible(false);
    setQrModalType(null);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    fetchBillingSummaryOnce();
  }, [fetchBillingSummaryOnce, visible]);

  const panelHorizontalPadding = 54 * 2;
  const cardGap = 30;
  const cardColumnCount = 3;

  const cardWidth = Math.floor(
    (width - panelHorizontalPadding - cardGap * (cardColumnCount - 1)) / cardColumnCount,
  );

  const qrModalTitle = qrModalType === 'report' ? '掃描回報問題' : '掃描新增歌曲';
  const qrModalUrl = qrModalType === 'report' ? REPORT_PROBLEM_URL : SONG_REQUEST_URL;

  const planContentRows = [
    {
      id: 'subscription-code',
      label: '訂單號碼',
      value: settingsBilling?.orderNumber ?? '-',
    },
    {
      id: 'subscription-date',
      label: '訂購日期',
      value: settingsBilling?.orderDate ?? '-',
    },
    {
      id: 'plan',
      label: '方案選擇',
      value: settingsBilling?.planName ?? '-',
      rightValue: settingsBilling?.planAmount ?? '-',
    },
    {
      id: 'card',
      label: '扣款帳號',
      value: settingsBilling?.paymentAccount ?? '-',
    },
    {
      id: 'address',
      label: '帳單地址',
      value: settingsBilling?.billingAddress ?? '-',
    },
  ];

  const accountItems: AccountItem[] = [
    {
      id: 'email',
      title: '帳號',
      description: settingsBilling?.userEmail ?? '-',
      Icon: SettingIcon2,
    },
    {
      id: 'password',
      title: '密碼',
      description: '••••••',
      Icon: SettingAccPassIcon,
    },
  ];

  const settingItems = SETTINGS_ITEMS.map((item) => {
    if (item.id === 'subscription') {
      return {
        ...item,
        description: settingsBilling?.planName ?? placeholderText,
      };
    }

    if (item.id === 'account') {
      return {
        ...item,
        description: settingsBilling?.userEmail ?? placeholderText,
      };
    }

    return item;
  });

  const rawBilling = useBillingSummaryStore((state) => state.rawBilling);

  const paymentCardItems =
    rawBilling?.paymentMethods.map((paymentMethod) => ({
      id: paymentMethod.id,
      brand: paymentMethod.brand?.toUpperCase() ?? 'CARD',
      number: paymentMethod.last4 ? `**** ${paymentMethod.last4}` : '****',
      isDefault: paymentMethod.isDefault,
    })) ?? [];

  const handlePressBack = () => {
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

    /**
     * 如果你有 auth store / token store，正式版應該在這裡清除登入資料。
     * 例如：
     * await clearAuthTokens();
     * useAuthStore.getState().logout();
     */

    onClose();

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        router.replace('/login');
      }, 0);
    });
  };

  const placeholderText = isBillingLoading ? '...' : '-';

  const subscriptionItems = SUBSCRIPTION_ITEMS.map((item) => {
    if (item.id === 'plan-content') {
      return {
        ...item,
        description: settingsBilling?.subscriptionPeriod ?? placeholderText,
      };
    }
  
    return item;
  });

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.title}>
          {currentPage === 'subscription'
            ? '訂閱方案'
            : currentPage === 'account'
              ? '帳號密碼'
              : currentPage === 'planContent'
                ? '方案內容'
                : currentPage === 'cardManagement'
                  ? '卡片管理'
                  : '設定'}
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
              <Text style={styles.planStatusText}>載入訂閱資料中...</Text>
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
            <Text style={styles.cardManagementDescription}>您的卡片資料已驗證並安全儲存。</Text>

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
                    <Text style={styles.paymentCardMore}>...</Text>
                  </View>

                  <View style={styles.paymentCardBottomRow}>
                    <Text style={styles.paymentCardNumber}>{card.number}</Text>

                    {card.isDefault ? (
                      <View style={styles.defaultCardBadge}>
                        <Text style={styles.defaultCardBadgeText}>預設</Text>
                      </View>
                    ) : null}
                  </View>
                </ImageBackground>
              ))}
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
                  <Text style={styles.accountActionText}>登出帳號</Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.accountActionButton, pressed && styles.cardPressed]}
                onPress={() => {
                  console.log('[SettingsPanel] press delete account');
                }}
              >
                <View style={styles.accountActionContent}>
                  <SettingAccDeleteIcon width={24} height={24} />
                  <Text style={styles.deleteAccountText}>刪除帳號</Text>
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
          <Text style={styles.backButtonText}>返回</Text>
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
              <Text style={styles.logoutConfirmTitle}>是否要登出帳號?</Text>

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
                  <Text style={styles.logoutCancelText}>取消</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.logoutConfirmButton,
                    pressed && styles.confirmButtonPressed,
                  ]}
                  onPress={handleConfirmLogout}
                >
                  <Text style={styles.logoutConfirmButtonText}>登出</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>
      ) : null}

      {/* <Modal
        visible={isLanguageSelectVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => {
          setIsLanguageSelectVisible(false);
        }}
      >
        <Pressable
          style={styles.languageModalOverlay}
          onPress={() => {
            setIsLanguageSelectVisible(false);
          }}
        >
          <BlurView
            intensity={28}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
            experimentalBlurMethod="dimezisBlurView"
          />

          <View style={styles.languageModalDarkLayer} />

          <Pressable
            style={styles.languagePopupBox}
            onPress={(event) => {
              event.stopPropagation();
            }}
          >
            {LANGUAGE_OPTIONS.map((option) => {
              const isActive = option.id === 'zh-TW';

              return (
                <Pressable
                  key={option.id}
                  style={[styles.languageOptionRow, isActive && styles.languageOptionRowActive]}
                  onPress={() => {
                    console.log('[SettingsPanel] press language option:', option);
                  }}
                >
                  <Text
                    style={[styles.languageOptionText, isActive && styles.languageOptionTextActive]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal> */}

      <LanguageSelectModal
        visible={isLanguageModalVisible}
        selectedLanguageId="zh-TW"
        onClose={() => {
          setIsLanguageModalVisible(false);
        }}
        onPressLanguage={(option) => {
          console.log('[MainHeader] press language:', option);

          /**
           * 功能先不做：
           * 之後可以在這裡接語系 store / i18n 切換。
           */
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
});
