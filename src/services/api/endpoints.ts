export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    sendSignupCode: '/auth/send-signup-code',
    verifySignupCode: '/auth/verify-signup-code',
    sendForgotCode: '/auth/send-forgot-code',
    verifyResetCode: '/auth/verify-reset-code',
    resetPassword: '/auth/reset-password',
    deleteAccount: '/auth/users/me',
  },
} as const;
