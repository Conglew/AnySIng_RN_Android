import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PaymentCopy } from '@/src/features/payments/i18n/payment-copy';
import { PaymentPlanType } from '@/src/features/payments/types/payment-plan.type';
import { CustomEmailKeyboard } from '@/src/shared/components/custom-email-keyboard';

type Props = {
  copy: PaymentCopy;
  selectedPlanType: PaymentPlanType;
  onChangePlanType: (type: PaymentPlanType) => void;
  onBackToPlans: () => void;
  onPaymentSuccess: () => void;
};

type KeyboardTarget = 'coupon' | null;

const VALID_COUPON_CODE = 'Abc2025';

export function PaymentConfirmCanvas({
  copy,
  selectedPlanType,
  onChangePlanType,
  onBackToPlans,
  onPaymentSuccess,
}: Props) {
  const couponInputRef = useRef<TextInput>(null);

  const [couponCode, setCouponCode] = useState('');
  const [keyboardTarget, setKeyboardTarget] = useState<KeyboardTarget>(null);
  const [hasTriedCoupon, setHasTriedCoupon] = useState(false);

  const [isCouponFocused, setIsCouponFocused] = useState(false);

  const selectedPlan = selectedPlanType === 'yearly' ? copy.yearlyPlan : copy.monthlyPlan;

  const isCouponValid = couponCode.trim() === VALID_COUPON_CODE;

  const finalPrice = useMemo(() => {
    if (selectedPlanType === 'yearly' && isCouponValid) {
      return '$1979';
    }

    return selectedPlan.price;
  }, [isCouponValid, selectedPlan.price, selectedPlanType]);

  const finalPricePrefix = useMemo(() => {
    if (selectedPlanType === 'yearly' && isCouponValid) {
      return '-';
    }

    return '';
  }, [isCouponValid, selectedPlanType]);

  const handlePaymentPress = () => {
    setKeyboardTarget(null);
    setIsCouponFocused(false);
    couponInputRef.current?.blur();

    // 目前先模擬付款成功，不 call API。
    setTimeout(() => {
      onPaymentSuccess();
    }, 450);
  };

  const hasCouponValue = couponCode.trim().length > 0;
  const shouldShowCouponError = hasTriedCoupon && hasCouponValue && !isCouponValid;
  const shouldShowCouponSuccess = hasCouponValue && isCouponValid;
  const shouldShowFocusedEmpty = isCouponFocused && !hasCouponValue;

  const couponCursorColor = shouldShowCouponError
    ? '#FF4D4F'
    : shouldShowCouponSuccess
      ? '#15C99A'
      : '#FF7A00';

  return (
    <View style={styles.canvas}>
      <View style={styles.content}>
        <Pressable style={styles.backButton} onPress={onBackToPlans}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <Text style={styles.title}>{copy.confirm.title}</Text>

        <View style={styles.formBlock}>
          <View style={styles.planRow}>
            <Pressable
              style={styles.planSelectButton}
              onPress={() => {
                onChangePlanType(selectedPlanType === 'yearly' ? 'monthly' : 'yearly');
              }}
            >
              <Text style={styles.planSelectText}>{selectedPlan.title}</Text>
              <Image
                source={require('@/assets/images/payment-plan-arrow.png')}
                style={styles.planSelectArrowIcon}
                resizeMode="contain"
              />
            </Pressable>

            <View style={styles.pricePreviewGroup}>
              <Text style={styles.originalPricePreview}>{selectedPlan.originalPrice}</Text>
              <Text style={styles.currentPricePreview}>{selectedPlan.price}</Text>
            </View>
          </View>

          <View style={styles.couponRow}>
            <Text style={styles.couponLabel}>{copy.confirm.couponLabel}</Text>

            <View
              style={[
                styles.couponInputWrapper,
                shouldShowFocusedEmpty ? styles.couponInputFocused : null,
                shouldShowCouponError ? styles.couponInputError : null,
                shouldShowCouponSuccess ? styles.couponInputSuccess : null,
              ]}
            >
              {!hasCouponValue ? (
                <Text style={styles.couponPlaceholderText}>{copy.confirm.couponPlaceholder}</Text>
              ) : null}

              <TextInput
                ref={couponInputRef}
                value={couponCode}
                onChangeText={() => {
                  // 使用自訂鍵盤，所以這裡不處理原生輸入。
                }}
                onPressIn={() => {
                  setKeyboardTarget('coupon');
                  setIsCouponFocused(true);
                  couponInputRef.current?.focus();
                }}
                placeholder=""
                autoCapitalize="none"
                autoCorrect={false}
                showSoftInputOnFocus={false}
                caretHidden={!isCouponFocused}
                selectionColor={couponCursorColor}
                style={[
                  styles.couponInput,
                  (shouldShowCouponError || shouldShowCouponSuccess) && styles.couponInputWithIcon,
                ]}
              />

              {shouldShowCouponError ? (
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#FF4D4F"
                  style={styles.couponStatusIcon}
                />
              ) : null}

              {shouldShowCouponSuccess ? (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#15C99A"
                  style={styles.couponStatusIcon}
                />
              ) : null}
            </View>

            {shouldShowCouponError ? (
              <Text style={styles.invalidCouponText}>{copy.confirm.invalidCouponText}</Text>
            ) : null}

            {shouldShowCouponSuccess ? (
              <Text style={styles.validCouponText}>{copy.confirm.validCouponText}</Text>
            ) : null}

            {shouldShowCouponSuccess ? (
              <Text style={styles.discountedPriceText}>
                {finalPricePrefix}
                {finalPrice}
              </Text>
            ) : null}

            {hasTriedCoupon && couponCode.length > 0 && !isCouponValid ? (
              <Text style={styles.invalidCouponText}>{copy.confirm.invalidCouponText}</Text>
            ) : null}
          </View>
        </View>

        {/* <View style={styles.divider} /> */}

        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>{copy.confirm.totalLabel}</Text>
          <View style={styles.divider} />
          <Text style={styles.totalPrice}>
            {finalPricePrefix}
            {finalPrice}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.payButton, pressed && styles.payButtonPressed]}
          onPress={handlePaymentPress}
        >
          <Text style={styles.payButtonText}>{copy.confirm.payButton}</Text>
        </Pressable>
      </View>

      <CustomEmailKeyboard
        visible={keyboardTarget === 'coupon'}
        onInput={(value) => {
          setCouponCode((current) => current + value);
          setHasTriedCoupon(true);
          setIsCouponFocused(true);
        }}
        onBackspace={() => {
          setCouponCode((current) => {
            const nextValue = current.slice(0, -1);

            if (nextValue.length === 0) {
              setHasTriedCoupon(false);
            }

            return nextValue;
          });

          setIsCouponFocused(true);
        }}
        onDone={() => {
          setKeyboardTarget(null);
          setIsCouponFocused(false);
          setHasTriedCoupon(true);
          couponInputRef.current?.blur();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },

  content: {
    flex: 1,
    width: 900,
    alignSelf: 'center',
    paddingTop: 54,
  },

  backButton: {
    position: 'absolute',
    left: 28,
    top: 48,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    zIndex: 5,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '300',
    marginBottom: 10,
    marginRight: 2,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },

  formBlock: {
    width: 966,
    // height: 62,
    alignSelf: 'center',
  },

  planRow: {
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 64,
    paddingRight: 16,
    marginBottom: 6,
  },

  planSelectButton: {
    position: 'absolute',
    left: 50,
    top: 5,
    height: 48,
    width: 154,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  planSelectText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },

  planSelectArrowIcon: {
    width: 24,
    height: 24,
    // marginLeft: 8,
  },

  pricePreviewGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },

  originalPricePreview: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontSize: 20,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },

  currentPricePreview: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  couponRow: {
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 70,
    paddingRight: 16,
  },

  couponLabel: {
    width: 96,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
  },

  couponInputWrapper: {
    width: 160,
    height: 50,
    marginLeft: 64,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  couponInputFocused: {
    borderColor: '#FF7A00',
  },

  couponInputError: {
    borderColor: '#FF4D4F',
  },

  couponInputSuccess: {
    borderColor: '#15C99A',
  },

  couponPlaceholderText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    color: 'rgba(255, 255, 255, 0.42)',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 50,
    pointerEvents: 'none',
  },

  couponInput: {
    width: '100%',
    height: '100%',
    paddingLeft: 20,
    paddingRight: 20,
    paddingVertical: 0,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'left',
    textAlignVertical: 'center',
  },

  couponInputWithIcon: {
    paddingRight: 40,
  },

  couponStatusIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 20,
    height: 20,
  },

  invalidCouponText: {
    marginLeft: 10,
    color: '#FF4D4F',
    fontSize: 20,
    fontWeight: '500',
  },

  validCouponText: {
    marginLeft: 10,
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 20,
    fontWeight: '500',
  },

  discountedPriceText: {
    marginLeft: 'auto',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  divider: {
    width: 966,
    height: 1,
    alignSelf: 'center',
    // marginTop: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },

  totalBlock: {
    width: 966,
    alignSelf: 'center',
    alignItems: 'flex-end',
    marginTop: 64,
  },

  totalLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 20,
    marginBottom: 12,
  },

  totalPrice: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  payButton: {
    width: 140,
    height: 36,
    alignSelf: 'center',
    marginTop: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(66, 196, 255, 0.36)',
  },

  payButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
});
