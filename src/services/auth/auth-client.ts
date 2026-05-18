import { apiRequest } from '../api/api-client';
import { ENDPOINTS } from '../api/endpoints';
import {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthSession,
  BillingSummaryResponse,
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
      path: ENDPOINTS.auth.login,
      body,
      timeoutMs: 30000,
    });

    return toAuthSession(response);
  },

  /**
   * 驗證目前本機 token 是否仍然有效。
   * 注意：這不是 refresh token。
   * 它只會確認 token 是否有效，成功代表可以繼續進入 home。
   */
  async me(token: string) {
    const response = await apiRequest<AuthLoginResponse, undefined>({
      method: 'GET',
      path: ENDPOINTS.user.me,
      token,
      timeoutMs: 15000,
    });

    return toAuthSession(response);
  },

  billingSummary(token: string) {
    return apiRequest<BillingSummaryResponse, undefined>({
      method: 'GET',
      path: ENDPOINTS.user.billing,
      token,
      timeoutMs: 15000,
    });
  },

  signup(body: SignupRequest) {
    return apiRequest<SignupResponse, SignupRequest>({
      method: 'PUT',
      path: ENDPOINTS.auth.signup,
      body,
    });
  },

  sendSignupCode(body: SendSignupCodeRequest) {
    return apiRequest<SendSignupCodeResponse, SendSignupCodeRequest>({
      method: 'POST',
      path: ENDPOINTS.auth.sendSignupCode,
      body,
    });
  },

  verifySignupCode(body: VerifySignupCodeRequest) {
    return apiRequest<VerifySignupCodeResponse, VerifySignupCodeRequest>({
      method: 'POST',
      path: ENDPOINTS.auth.verifySignupCode,
      body,
    });
  },

  sendForgotCode(body: SendForgotCodeRequest) {
    return apiRequest<SendForgotCodeResponse, SendForgotCodeRequest>({
      method: 'POST',
      path: ENDPOINTS.auth.sendForgotCode,
      body,
    });
  },

  verifyResetCode(body: VerifyResetCodeRequest) {
    return apiRequest<VerifyResetCodeResponse, VerifyResetCodeRequest>({
      method: 'POST',
      path: ENDPOINTS.auth.verifyResetCode,
      body,
    });
  },

  resetPassword(body: ResetPasswordRequest) {
    return apiRequest<ResetPasswordResponse, ResetPasswordRequest>({
      method: 'POST',
      path: ENDPOINTS.auth.resetPassword,
      body,
    });
  },

  deleteAccount({ token, body }: { token: string; body: DeleteAccountRequest }) {
    return apiRequest<DeleteAccountResponse, DeleteAccountRequest>({
      method: 'DELETE',
      path: ENDPOINTS.auth.deleteAccount,
      token,
      body,
    });
  },
};
