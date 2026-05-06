import { apiRequest } from '../api/api-client';
import {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthSession,
  DeleteAccountRequest,
  DeleteAccountResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SendForgotCodeRequest,
  SendForgotCodeResponse,
  SendSignupCodeRequest,
  SendSignupCodeResponse,
  SignupRequest,
  SignupResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  VerifySignupCodeRequest,
  VerifySignupCodeResponse,
} from './auth.types';

function toAuthSession(response: AuthLoginResponse): AuthSession {
  return {
    token: response.token,
    userId: response.userId,
    userEmail: response.userEmail,
    currentSubscription: response.currentSubscription,
    paymentMethods: response.PaymentMethods ?? [],
    defaultPaymentMethodId: response.DefaultPaymentMethodId ?? null,
  };
}

export const authClient = {
  async login(body: AuthLoginRequest) {
    const response = await apiRequest<AuthLoginResponse, AuthLoginRequest>({
      method: 'POST',
      path: '/auth/login',
      body,
    });

    return toAuthSession(response);
  },

  sendSignupCode(body: SendSignupCodeRequest) {
    return apiRequest<SendSignupCodeResponse, SendSignupCodeRequest>({
      method: 'POST',
      path: '/auth/send-signup-code',
      body,
    });
  },

  verifySignupCode(body: VerifySignupCodeRequest) {
    return apiRequest<VerifySignupCodeResponse, VerifySignupCodeRequest>({
      method: 'POST',
      path: '/auth/verify-signup-code',
      body,
    });
  },

  signup(body: SignupRequest) {
    return apiRequest<SignupResponse, SignupRequest>({
      method: 'PUT',
      path: '/auth/signup',
      body,
    });
  },

  sendForgotCode(body: SendForgotCodeRequest) {
    return apiRequest<SendForgotCodeResponse, SendForgotCodeRequest>({
      method: 'POST',
      path: '/auth/send-forgot-code',
      body,
    });
  },

  verifyResetCode(body: VerifyResetCodeRequest) {
    return apiRequest<VerifyResetCodeResponse, VerifyResetCodeRequest>({
      method: 'POST',
      path: '/auth/verify-reset-code',
      body,
    });
  },

  resetPassword(body: ResetPasswordRequest) {
    return apiRequest<ResetPasswordResponse, ResetPasswordRequest>({
      method: 'POST',
      path: '/auth/reset-password',
      body,
    });
  },

  deleteAccount({ token, body }: { token: string; body: DeleteAccountRequest }) {
    return apiRequest<DeleteAccountResponse, DeleteAccountRequest>({
      method: 'DELETE',
      path: '/auth/users/me',
      token,
      body,
    });
  },
};
