import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type SettingsCopy = {
  settings: string;
  subscription: string;
  accountPassword: string;
  languageSelect: string;
  addSong: string;
  addSongDescription: string;
  reportProblem: string;
  reportProblemDescription: string;

  planContent: string;
  cardManagement: string;
  account: string;
  password: string;

  back: string;
  complete: string;
  confirm: string;
  cancel: string;
  continue: string;
  leave: string;
  logout: string;
  deleteAccount: string;
  delete: string;
  clear: string;

  loadingSubscription: string;
  cardVerifiedDescription: string;

  orderNumber: string;
  orderDate: string;
  planSelection: string;
  paymentAccount: string;
  billingAddress: string;

  passwordChange: string;
  setPassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordPlaceholder: string;
  passwordRule: string;
  forgotPassword: string;
  passwordError: string;
  passwordFormatError: string;
  passwordRequiredAgain: string;
  passwordMismatch: string;
  passwordChangeFailed: string;

  leavePasswordTitle: string;
  leavePasswordDescription: string;

  permanentDeleteAccount: string;
  deleteAccountDescription: string;
  deleteAccountInstructionPrefix: string;
  deleteAccountInstructionSuffix: string;
  deleteAccountPlaceholder: string;
  required: string;
  inputError: string;
  deleteAccountFailed: string;

  accountEditTitle: string;
  emailTransferDescriptionPrefix: string;
  emailTransferHighlight: string;
  emailTransferDescriptionSuffix: string;
  emailSentNotice: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailFormatError: string;
  sendEmailFailed: string;
  resendEmailFailed: string;
  verificationCodeLabel: string;
  verificationCodeHint: string;
  verificationCodeError: string;
  resendCountdown: (seconds: number) => string;
  resendCode: string;

  scanReportProblem: string;
  scanAddSong: string;

  logoutConfirmTitle: string;
};

export const SETTINGS_COPY: Record<LanguageValue, SettingsCopy> = {
  'zh-TW': {
    settings: '設定',
    subscription: '訂閱方案',
    accountPassword: '帳號密碼',
    languageSelect: '語言選擇',
    addSong: '新增歌曲',
    addSongDescription: '想要加入的歌曲',
    reportProblem: '回報問題',
    reportProblemDescription: '幫助您解決遇到的問題',

    planContent: '方案內容',
    cardManagement: '卡片管理',
    account: '帳號',
    password: '密碼',

    back: '返回',
    complete: '完成',
    confirm: '確認',
    cancel: '取消',
    continue: '繼續',
    leave: '離開',
    logout: '登出帳號',
    deleteAccount: '刪除帳號',
    delete: '刪除',
    clear: '清除',

    loadingSubscription: '載入訂閱資料中...',
    cardVerifiedDescription: '您的卡片資料已驗證並安全儲存。',

    orderNumber: '訂單號碼',
    orderDate: '訂購日期',
    planSelection: '方案選擇',
    paymentAccount: '扣款帳號',
    billingAddress: '帳單地址',

    passwordChange: '密碼修改',
    setPassword: '設定密碼',
    currentPassword: '原先密碼',
    newPassword: '新密碼',
    confirmPassword: '再次輸入密碼',
    passwordPlaceholder: '至少8位英數字',
    passwordRule:
      '密碼至少 8 個字，包含大小寫英文字母和數字。只接受英文字母、數字和常見符號（!@#|<_>）。',
    forgotPassword: '忘記密碼了?',
    passwordError: '密碼錯誤',
    passwordFormatError: '至少8位英數字，並包含大小寫英文與數字',
    passwordRequiredAgain: '請再次輸入密碼',
    passwordMismatch: '兩次密碼輸入不一致',
    passwordChangeFailed: '密碼修改失敗，請稍後再試',

    leavePasswordTitle: '尚未修改完成，要離開此頁面?',
    leavePasswordDescription: '離開後將不會保留填寫紀錄',

    permanentDeleteAccount: '永久刪除帳號',
    deleteAccountDescription: '刪除後帳號將無法復原。目前的訂閱將不再續扣，但不會退款。',
    deleteAccountInstructionPrefix: '若您仍希望刪除帳號，請輸入 "Delete"',
    deleteAccountInstructionSuffix: '確認',
    deleteAccountPlaceholder: '請輸入Delete',
    required: '必填',
    inputError: '輸入錯誤',
    deleteAccountFailed: '刪除失敗，請稍後再試',

    accountEditTitle: '帳號修改',
    emailTransferDescriptionPrefix: '修改帳號(電子郵件)後先前',
    emailTransferHighlight: '訂閱項目',
    emailTransferDescriptionSuffix: '將會移到新帳號中',
    emailSentNotice: '已發送電子郵件，請前往信箱查看。',
    emailLabel: '電子郵件',
    emailPlaceholder: '請輸入您的新電子郵件',
    emailFormatError: '電子郵件格式錯誤',
    sendEmailFailed: '發送失敗，請稍後再試',
    resendEmailFailed: '重發失敗，請稍後再試',
    verificationCodeLabel: '驗證碼',
    verificationCodeHint: '請輸入驗證碼',
    verificationCodeError: '驗證碼錯誤',
    resendCountdown: (seconds) => `${seconds}S 後可重發驗證碼`,
    resendCode: '重發驗證碼',

    scanReportProblem: '掃描回報問題',
    scanAddSong: '掃描新增歌曲',

    logoutConfirmTitle: '是否要登出帳號?',
  },

  'zh-CN': {
    settings: '设置',
    subscription: '订阅方案',
    accountPassword: '账号密码',
    languageSelect: '语言选择',
    addSong: '新增歌曲',
    addSongDescription: '想要加入的歌曲',
    reportProblem: '回报问题',
    reportProblemDescription: '帮助您解决遇到的问题',

    planContent: '方案内容',
    cardManagement: '卡片管理',
    account: '账号',
    password: '密码',

    back: '返回',
    complete: '完成',
    confirm: '确认',
    cancel: '取消',
    continue: '继续',
    leave: '离开',
    logout: '登出账号',
    deleteAccount: '删除账号',
    delete: '删除',
    clear: '清除',

    loadingSubscription: '载入订阅资料中...',
    cardVerifiedDescription: '您的卡片资料已验证并安全储存。',

    orderNumber: '订单号码',
    orderDate: '订购日期',
    planSelection: '方案选择',
    paymentAccount: '扣款账号',
    billingAddress: '账单地址',

    passwordChange: '密码修改',
    setPassword: '设置密码',
    currentPassword: '原先密码',
    newPassword: '新密码',
    confirmPassword: '再次输入密码',
    passwordPlaceholder: '至少8位英数字',
    passwordRule:
      '密码至少 8 个字，包含大小写英文字母和数字。只接受英文字母、数字和常见符号（!@#|<_>）。',
    forgotPassword: '忘记密码了?',
    passwordError: '密码错误',
    passwordFormatError: '至少8位英数字，并包含大小写英文与数字',
    passwordRequiredAgain: '请再次输入密码',
    passwordMismatch: '两次密码输入不一致',
    passwordChangeFailed: '密码修改失败，请稍后再试',

    leavePasswordTitle: '尚未修改完成，要离开此页面?',
    leavePasswordDescription: '离开后将不会保留填写记录',

    permanentDeleteAccount: '永久删除账号',
    deleteAccountDescription: '删除后账号将无法复原。目前的订阅将不再续扣，但不会退款。',
    deleteAccountInstructionPrefix: '若您仍希望删除账号，请输入 "Delete"',
    deleteAccountInstructionSuffix: '确认',
    deleteAccountPlaceholder: '请输入Delete',
    required: '必填',
    inputError: '输入错误',
    deleteAccountFailed: '删除失败，请稍后再试',

    accountEditTitle: '账号修改',
    emailTransferDescriptionPrefix: '修改账号(电子邮件)后先前',
    emailTransferHighlight: '订阅项目',
    emailTransferDescriptionSuffix: '将会移到新账号中',
    emailSentNotice: '已发送电子邮件，请前往信箱查看。',
    emailLabel: '电子邮件',
    emailPlaceholder: '请输入您的新电子邮件',
    emailFormatError: '电子邮件格式错误',
    sendEmailFailed: '发送失败，请稍后再试',
    resendEmailFailed: '重发失败，请稍后再试',
    verificationCodeLabel: '验证码',
    verificationCodeHint: '请输入验证码',
    verificationCodeError: '验证码错误',
    resendCountdown: (seconds) => `${seconds}S 后可重发验证码`,
    resendCode: '重发验证码',

    scanReportProblem: '扫描回报问题',
    scanAddSong: '扫描新增歌曲',

    logoutConfirmTitle: '是否要登出账号?',
  },

  en: {
    settings: 'Settings',
    subscription: 'Subscription',
    accountPassword: 'Account & Password',
    languageSelect: 'Language',
    addSong: 'Add Song',
    addSongDescription: 'Request a song',
    reportProblem: 'Report Issue',
    reportProblemDescription: 'Help us resolve your issue',

    planContent: 'Plan Details',
    cardManagement: 'Card Management',
    account: 'Account',
    password: 'Password',

    back: 'Back',
    complete: 'Done',
    confirm: 'Confirm',
    cancel: 'Cancel',
    continue: 'Continue',
    leave: 'Leave',
    logout: 'Log Out',
    deleteAccount: 'Delete Account',
    delete: 'Delete',
    clear: 'Clear',

    loadingSubscription: 'Loading subscription data...',
    cardVerifiedDescription: 'Your card has been verified and stored securely.',

    orderNumber: 'Order',
    orderDate: 'Order Date',
    planSelection: 'Plan',
    paymentAccount: 'Account',
    billingAddress: 'Address',

    passwordChange: 'Change Password',
    setPassword: 'Set Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    passwordPlaceholder: 'At least 8 characters',
    passwordRule:
      'Password must be at least 8 characters and include uppercase letters, lowercase letters, and numbers. Only letters, numbers, and common symbols are accepted.',
    forgotPassword: 'Forgot password?',
    passwordError: 'Incorrect password',
    passwordFormatError: 'Use at least 8 characters with uppercase, lowercase, and numbers',
    passwordRequiredAgain: 'Please enter the password again',
    passwordMismatch: 'Passwords do not match',
    passwordChangeFailed: 'Failed to change password. Please try again later.',

    leavePasswordTitle: 'Leave before saving changes?',
    leavePasswordDescription: 'Your entered information will not be saved.',

    permanentDeleteAccount: 'Permanently Delete Account',
    deleteAccountDescription:
      'Your account cannot be restored after deletion. Your current subscription will stop renewing, but payments will not be refunded.',
    deleteAccountInstructionPrefix: 'To delete your account, enter "Delete"',
    deleteAccountInstructionSuffix: 'to confirm',
    deleteAccountPlaceholder: 'Enter Delete',
    required: 'Required',
    inputError: 'Incorrect input',
    deleteAccountFailed: 'Failed to delete account. Please try again later.',

    accountEditTitle: 'Edit Account',
    emailTransferDescriptionPrefix: 'After changing your email, your previous',
    emailTransferHighlight: 'subscription items',
    emailTransferDescriptionSuffix: 'will be moved to the new account',
    emailSentNotice: 'Email sent. Please check your inbox.',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your new email',
    emailFormatError: 'Invalid email format',
    sendEmailFailed: 'Failed to send email. Please try again later.',
    resendEmailFailed: 'Failed to resend. Please try again later.',
    verificationCodeLabel: 'Verification Code',
    verificationCodeHint: 'Enter verification code',
    verificationCodeError: 'Incorrect verification code',
    resendCountdown: (seconds) => `Resend available in ${seconds}s`,
    resendCode: 'Resend code',

    scanReportProblem: 'Report Issue',
    scanAddSong: 'Request Song',

    logoutConfirmTitle: 'Log out of your account?',
  },

  ms: {
    settings: 'Tetapan',
    subscription: 'Langganan',
    accountPassword: 'Akaun & Kata Laluan',
    languageSelect: 'Bahasa',
    addSong: 'Tambah Lagu',
    addSongDescription: 'Minta lagu baharu',
    reportProblem: 'Laporkan Masalah',
    reportProblemDescription: 'Bantu kami menyelesaikan masalah anda',

    planContent: 'Butiran Pelan',
    cardManagement: 'Pengurusan Kad',
    account: 'Akaun',
    password: 'Kata Laluan',

    back: 'Kembali',
    complete: 'Selesai',
    confirm: 'Sahkan',
    cancel: 'Batal',
    continue: 'Teruskan',
    leave: 'Keluar',
    logout: 'Log Keluar',
    deleteAccount: 'Padam Akaun',
    delete: 'Padam',
    clear: 'Kosongkan',

    loadingSubscription: 'Memuatkan data langganan...',
    cardVerifiedDescription: 'Kad anda telah disahkan dan disimpan dengan selamat.',

    orderNumber: 'Pesanan',
    orderDate: 'Tarikh',
    planSelection: 'Pelan',
    paymentAccount: 'Akaun',
    billingAddress: 'Alamat Bil',

    passwordChange: 'Tukar Kata Laluan',
    setPassword: 'Tetapkan Kata Laluan',
    currentPassword: 'Kata Laluan Semasa',
    newPassword: 'Kata Laluan Baharu',
    confirmPassword: 'Sahkan Kata Laluan',
    passwordPlaceholder: 'Sekurang-kurangnya 8 aksara',
    passwordRule:
      'Kata laluan mestilah sekurang-kurangnya 8 aksara dan mengandungi huruf besar, huruf kecil, serta nombor. Hanya huruf, nombor dan simbol biasa diterima.',
    forgotPassword: 'Terlupa kata laluan?',
    passwordError: 'Kata laluan salah',
    passwordFormatError:
      'Gunakan sekurang-kurangnya 8 aksara dengan huruf besar, huruf kecil dan nombor',
    passwordRequiredAgain: 'Sila masukkan kata laluan sekali lagi',
    passwordMismatch: 'Kata laluan tidak sepadan',
    passwordChangeFailed: 'Gagal menukar kata laluan. Sila cuba lagi nanti.',

    leavePasswordTitle: 'Keluar sebelum perubahan selesai?',
    leavePasswordDescription: 'Maklumat yang diisi tidak akan disimpan.',

    permanentDeleteAccount: 'Padam Akaun Secara Kekal',
    deleteAccountDescription:
      'Akaun tidak boleh dipulihkan selepas dipadam. Langganan semasa tidak akan diperbaharui, tetapi bayaran tidak akan dikembalikan.',
    deleteAccountInstructionPrefix: 'Untuk memadam akaun, masukkan "Delete" ',
    deleteAccountInstructionSuffix: 'untuk pengesahan',
    deleteAccountPlaceholder: 'Masukkan Delete',
    required: 'Wajib diisi',
    inputError: 'Input salah',
    deleteAccountFailed: 'Gagal memadam akaun. Sila cuba lagi nanti.',

    accountEditTitle: 'Edit Akaun',
    emailTransferDescriptionPrefix: 'Selepas menukar e-mel,',
    emailTransferHighlight: 'item langganan',
    emailTransferDescriptionSuffix: 'akan dipindahkan ke akaun baharu',
    emailSentNotice: 'E-mel telah dihantar. Sila semak peti masuk anda.',
    emailLabel: 'E-mel',
    emailPlaceholder: 'Masukkan e-mel baharu anda',
    emailFormatError: 'Format e-mel tidak sah',
    sendEmailFailed: 'Gagal menghantar e-mel. Sila cuba lagi nanti.',
    resendEmailFailed: 'Gagal menghantar semula. Sila cuba lagi nanti.',
    verificationCodeLabel: 'Kod Pengesahan',
    verificationCodeHint: 'Masukkan kod pengesahan',
    verificationCodeError: 'Kod pengesahan salah',
    resendCountdown: (seconds) => `Boleh hantar semula dalam ${seconds}s`,
    resendCode: 'Hantar semula kod',

    scanReportProblem: 'Lapor Masalah',
    scanAddSong: 'Tambah Lagu',

    logoutConfirmTitle: 'Log keluar daripada akaun?',
  },
};
