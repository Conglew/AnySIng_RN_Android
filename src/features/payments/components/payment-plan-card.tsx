import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { PaymentPlanCopy } from '@/src/features/payments/i18n/payment-copy';
import { PaymentPlanType } from '@/src/features/payments/types/payment-plan.type';

type Props = {
  type: PaymentPlanType;
  copy: PaymentPlanCopy;
  onPress: () => void;
};

export function PaymentPlanCard({ type, copy, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.planCardPressable, pressed && styles.planCardPressed]}
      onPress={onPress}
    >
      <ImageBackground
        source={require('@/assets/images/payment-plan-bg.png')}
        style={[styles.planCard, type === 'yearly' && styles.yearlyPlanCard]}
        imageStyle={styles.planCardBackgroundImage}
        resizeMode="cover"
      >
        <View style={styles.planHeader}>
          <Image
            source={require('@/assets/images/payment-arrow.png')}
            style={styles.planArrowIcon}
            resizeMode="contain"
          />

          <Text style={styles.planTitle}>{copy.title}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{copy.price}</Text>

          <Text style={styles.originalPriceText}>{copy.originalPrice}</Text>

          <Text style={styles.periodText}>/{copy.period}</Text>
        </View>

        <View style={styles.planBenefitGroup}>
          {copy.benefits.map((item) => (
            <Text key={item} style={styles.planBenefitText}>
              ・{item}
            </Text>
          ))}
        </View>

        {copy.discountLabel && copy.discountValue ? (
          <View style={styles.discountBlock}>
            <Text style={styles.discountLabel}>{copy.discountLabel}</Text>
            <Text style={styles.discountText}>{copy.discountValue}</Text>
          </View>
        ) : null}

        <Image
          source={require('@/assets/images/payment-arrow.png')}
          style={styles.cardCornerArrow}
          resizeMode="contain"
        />
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  planCardPressable: {
    width: 340,
    height: 567,
    borderRadius: 4,
    overflow: 'hidden',
  },

  planCard: {
    width: '100%',
    height: '100%',
    paddingTop: 24,
    paddingHorizontal: 17,
    borderRadius: 4,
    overflow: 'hidden',
  },

  planCardBackgroundImage: {
    borderRadius: 4,
  },

  yearlyPlanCard: {
    // 如果年繳卡片要跟月繳不同，可以在這裡加 overlay 或其他樣式。
    // 目前使用同一張背景圖，所以先保留空樣式。
  },

  planCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 42,
  },

  planArrowIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },

  planTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 40,
  },

  priceText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },

  originalPriceText: {
    marginLeft: 6,
    color: 'rgba(255, 255, 255, 0.28)',
    fontSize: 36,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },

  periodText: {
    marginLeft: 2,
    marginBottom: 2,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },

  planBenefitGroup: {
    // gap: 18,
  },

  planBenefitText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 48,
  },

  discountBlock: {
    position: 'absolute',
    left: 20,
    bottom: 130,
    height: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  discountLabel: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
    marginRight: 6,
    marginBottom: 8,
  },

  discountText: {
    color: '#FFFFFF',
    fontSize: 64,
    lineHeight: 72,
    fontStyle: 'italic',
    fontWeight: '900',
  },

  cardCornerArrow: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 55,
    height: 55,
  },
});
