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

  songs: {
    list: '/songs',
    search: '/songs/search',
    filterByLanguage: '/songs/filter-by-language',
    batch: '/songs/batch',
    detail: (songId: string) => `/songs/${songId}`,
    presignedUrls: '/songs/s3/presigned-urls',
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
} as const;
