export type PaymentPlanType = 'monthly' | 'yearly';

export type PaymentViewMode = 'plans' | 'confirm' | 'success';

export type ValidatePromotionCodeResponse = {
  ok: boolean;

  promotionCode: {
    id: string;
    code: string;
  };

  coupon: {
    id: string;
    name: string | null;

    percentOff: number | null;
    amountOff: number | null;

    currency: string | null;
  };
};
