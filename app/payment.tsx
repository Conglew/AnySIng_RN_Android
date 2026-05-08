import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PaymentBenefitCard } from '@/src/features/payments/components/payment-benefit-card';
import { PaymentConfirmCanvas } from '@/src/features/payments/components/payment-confirm-canvas';
import { PaymentPlanCard } from '@/src/features/payments/components/payment-plan-card';
import { LanguageValue, PAYMENT_COPY } from '@/src/features/payments/i18n/payment-copy';
import { PaymentPlanType, PaymentViewMode } from '@/src/features/payments/types/payment-plan.type';

const CURRENT_LANGUAGE: LanguageValue = 'zh-TW';

export default function PaymentScreen() {
  const [viewMode, setViewMode] = useState<PaymentViewMode>('plans');
  const [selectedPlanType, setSelectedPlanType] = useState<PaymentPlanType>('yearly');

  const paymentCopy = PAYMENT_COPY[CURRENT_LANGUAGE];

  useEffect(() => {
    if (viewMode !== 'success') {
      return;
    }

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [viewMode]);

  const handlePlanPress = (planType: PaymentPlanType) => {
    setSelectedPlanType(planType);
    setViewMode('confirm');
  };

  if (viewMode === 'success') {
    return (
      <ImageBackground
        source={require('@/assets/images/payment-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successPage}>
            <Text style={styles.successText}>{paymentCopy.confirm.successMessage}</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('@/assets/images/payment-bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          {viewMode === 'plans' ? (
            <Pressable
              style={styles.backButton}
              onPress={() => {
                router.replace('/login');
              }}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </Pressable>
          ) : null}

          {viewMode === 'plans' ? (
            <View style={styles.content}>
              <PaymentBenefitCard benefits={paymentCopy.benefits} note={paymentCopy.note} />

              <View style={styles.planSection}>
                <PaymentPlanCard
                  type="monthly"
                  copy={paymentCopy.monthlyPlan}
                  onPress={() => {
                    handlePlanPress('monthly');
                  }}
                />

                <PaymentPlanCard
                  type="yearly"
                  copy={paymentCopy.yearlyPlan}
                  onPress={() => {
                    handlePlanPress('yearly');
                  }}
                />
              </View>
            </View>
          ) : null}

          {viewMode === 'confirm' ? (
            <PaymentConfirmCanvas
              copy={paymentCopy}
              selectedPlanType={selectedPlanType}
              onChangePlanType={setSelectedPlanType}
              onBackToPlans={() => {
                setViewMode('plans');
              }}
              onPaymentSuccess={() => {
                setViewMode('success');
              }}
            />
          ) : null}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#020817',
  },

  safeArea: {
    flex: 1,
  },

  page: {
    flex: 1,
    paddingHorizontal: 36,
    paddingVertical: 24,
  },

  closeButton: {
    position: 'absolute',
    top: 18,
    right: 24,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '300',
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  planSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginLeft: 250,
  },

  successPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successText: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '500',
  },

  backButton: {
    position: 'absolute',
    top: 12,
    left: 14,
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
});
