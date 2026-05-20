export type AuthLoginRequest = {
  email: string;
  password: string;
};

export type AuthLoginResponse = {
  token: string;
  userId: string;
  userEmail: string;
  currentSubscription: string | null;
  PaymentMethods: string[];
  DefaultPaymentMethodId: string | null;
};

export type SendSignupCodeRequest = {
  email: string;
};

export type SendSignupCodeResponse = {
  message: string;
};

export type VerifySignupCodeRequest = {
  email: string;
  code: string;
};

export type VerifySignupCodeResponse = {
  message: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  code: string;
  name?: string;
};

export type SignupResponse = {
  message: string;
  userId: string;
  pendingPlaylistId: string;
  collectPlaylistId: string;
};

export type SendForgotCodeRequest = {
  email: string;
};

export type SendForgotCodeResponse = {
  message: string;
};

export type VerifyResetCodeRequest = {
  email: string;
  code: string;
};

export type VerifyResetCodeResponse = {
  message: string;
};

export type ResetPasswordRequest = {
  email: string;
  password: string;
  code: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export type DeleteAccountRequest = {
  confirmEmail: string;
};

export type DeleteAccountResponse = {
  message: string;
};

export type AuthSession = {
  token: string;
  userId: string;
  userEmail: string;
  currentSubscription: string | null;
  paymentMethods: string[];
  defaultPaymentMethodId: string | null;
};

type AuthMessageResponse = {
  message: string;
};

export type BillingPaymentMethod = {
  id: string;
  type: string | null;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  billingAddress: Record<string, unknown> | null;
  isDefault?: boolean;
};

export type BillingDiscount = {
  couponId: string;
  name: string | null;
  percentOff: number | null;
  amountOff: number | null;
  currency: string | null;
};

export type BillingLatestInvoice = {
  id: string;
  number: string | null;
  amountDue: number | null;
  amountPaid: number | null;
  amountRemaining: number | null;
  currency: string | null;
  hostedInvoiceUrl: string | null;
};

export type BillingSubscription = {
  id: string;
  status: string;
  orderNumber: string;
  subscribedAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;

  planName: string | null;
  priceId: string | null;
  productId: string | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;

  discount: BillingDiscount | null;
  latestInvoice: BillingLatestInvoice | null;
  defaultPaymentMethod: BillingPaymentMethod | null;
};

export type BillingSummaryResponse = {
  userId: string;
  userEmail: string;
  stripeCustomerId: string | null;
  subscription: BillingSubscription | null;
  paymentMethods: BillingPaymentMethod[];
};

export type SetDefaultPaymentMethodResponse = {
  message: string;
  defaultPaymentMethodId: string;
};

export type DeletePaymentMethodResponse = {
  message: string;
  paymentMethodId: string;
};
