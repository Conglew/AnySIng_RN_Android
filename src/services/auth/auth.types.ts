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
