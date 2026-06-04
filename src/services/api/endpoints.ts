export const ENDPOINTS = {
  health: {
    check: '/health',
  },

  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    signup: '/auth/signup',
    sendSignupCode: '/auth/send-signup-code',
    verifySignupCode: '/auth/verify-signup-code',
    sendForgotCode: '/auth/send-forgot-code',
    verifyResetCode: '/auth/verify-reset-code',
    resetPassword: '/auth/reset-password',
    deleteAccount: '/auth/users/me',

    verifyCurrentPassword: '/auth/users/me/password/verify',
    changePassword: '/auth/users/me/password',
    sendChangeEmailCode: '/auth/users/me/email/code',
    changeEmail: '/auth/users/me/email',

    sendCurrentEmailCode: '/auth/users/me/email/current/code',
    verifyCurrentEmailCode: '/auth/users/me/email/current/verify',
  },

  user: {
    me: '/auth/users/me',
    billing: '/auth/users/me/billing',
    setDefaultPaymentMethod: (paymentMethodId: string) =>
      `/auth/users/me/payment-methods/${paymentMethodId}/default`,
    deletePaymentMethod: (paymentMethodId: string) =>
      `/auth/users/me/payment-methods/${paymentMethodId}`,
  },

  playlists: {
    user: '/playlist/user',
    now: '/playlist/user/now',
  },

  songs: {
    list: '/songs',
    search: '/songs/search',
    filterByLanguage: '/songs/filter-by-language',
    batch: '/songs/batch',
    detail: (songId: string) => `/songs/${songId}`,
    presignedUrls: '/songs/s3/presigned-urls',
    resolveFromS3: '/songs/s3/resolve',
  },

  categories: {
    list: '/category',
    detail: (categoryId: string) => `/category/${categoryId}`,
    songs: (categoryId: string) => `/category/${categoryId}/songs`,
  },

  singers: {
    list: '/artists',
    search: '/artists/search',
    detail: (singerId: string) => `/artists/${singerId}`,
    songs: (singerId: string) => `/artists/${singerId}/songs`,
  },

  payments: {
    getStripePrice: (productId: string) => `/payments/stripe/price/${productId}`,
    validatePromotionCode: '/payments/stripe/validate-promotion-code',
    createSubscriptionSession: '/payments/stripe/create-subscription-session',
    subscriptionStatus: '/payments/subscription/status',
  },
} as const;
