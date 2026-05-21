export type LanguageValue = 'zh-CN' | 'zh-TW' | 'en' | 'ms';

export type PaymentPlanCopy = {
  title: string;
  price: string;
  originalPrice: string;
  period: string;
  benefits: string[];
  discountLabel?: string;
  discountValue?: string;
};

export type PaymentConfirmCopy = {
  title: string;
  couponLabel: string;
  couponPlaceholder: string;
  invalidCouponText: string;
  validCouponText: string;
  totalLabel: string;
  payButton: string;
  successMessage: string;
};

export type PaymentCopy = {
  benefits: string[];
  note: string;
  monthlyPlan: PaymentPlanCopy;
  yearlyPlan: PaymentPlanCopy;
  confirm: PaymentConfirmCopy;
  closeButtonLabel: string;
};

export const PAYMENT_COPY: Record<LanguageValue, PaymentCopy> = {
  'zh-TW': {
    benefits: [
      '超過 500,000 首優質曲庫，想唱就唱',
      '每月持續更新，新歌搶先唱',
      '一鍵錄音，隨時發布',
      '收藏歌曲，建立我的歌單',
      '支援多語言介面',
    ],
    note: '※月/年繳 計畫皆包含上述功能',
    monthlyPlan: {
      title: '月繳計畫',
      price: 'RM199',
      originalPrice: 'RM20',
      period: '月',
      benefits: ['訂閱皆包含完整功能', '一個帳號限綁定一部設備', '後續隨時可取消續訂'],
    },
    yearlyPlan: {
      title: '年繳計畫',
      price: 'RM1,980',
      originalPrice: 'RM180',
      period: '年',
      benefits: ['訂閱皆包含完整功能', '一個帳號限綁定一部設備', '後續隨時可取消續訂'],
      discountLabel: '立即省下',
      discountValue: '33%',
    },
    confirm: {
      title: '確認付款資訊',
      couponLabel: '優惠折抵',
      couponPlaceholder: '輸入優惠碼',
      invalidCouponText: '無此優惠碼',
      validCouponText: '專屬優惠，新帳一年優惠',
      totalLabel: '實際扣款金額',
      payButton: '付款',
      successMessage: '訂閱成功！歡迎你的加入',
    },
    closeButtonLabel: '關閉付款頁',
  },

  'zh-CN': {
    benefits: [
      '超过 500,000 首优质曲库，想唱就唱',
      '每月持续更新，新歌抢先唱',
      '一键录音，随时发布',
      '收藏歌曲，建立我的歌单',
      '支持多语言界面',
    ],
    note: '※月/年缴 计划皆包含上述功能',
    monthlyPlan: {
      title: '月缴计划',
      price: 'RM199',
      originalPrice: 'RM20',
      period: '月',
      benefits: ['订阅皆包含完整功能', '一个账号限绑定一部设备', '后续随时可取消续订'],
    },
    yearlyPlan: {
      title: '年缴计划',
      price: 'RM1,980',
      originalPrice: 'RM180',
      period: '年',
      benefits: ['订阅皆包含完整功能', '一个账号限绑定一部设备', '后续随时可取消续订'],
      discountLabel: '立即省下',
      discountValue: '33%',
    },
    confirm: {
      title: '确认付款资讯',
      couponLabel: '优惠折抵',
      couponPlaceholder: '输入优惠码',
      invalidCouponText: '无此优惠码',
      validCouponText: '专属优惠，新账号一年优惠',
      totalLabel: '实际扣款金额',
      payButton: '付款',
      successMessage: '订阅成功！欢迎你的加入',
    },
    closeButtonLabel: '关闭付款页',
  },

  en: {
    benefits: [
      'Over 500,000 quality songs, sing anytime',
      'Monthly updates with early access to new songs',
      'One-tap recording, publish anytime',
      'Save songs and create your own playlists',
      'Multi-language interface support',
    ],
    note: '※ Monthly and yearly plans include all features above',
    monthlyPlan: {
      title: 'Monthly Plan',
      price: 'RM199',
      originalPrice: 'RM20',
      period: 'month',
      benefits: [
        'Includes full subscription features',
        'One account can bind one device only',
        'Cancel renewal anytime',
      ],
    },
    yearlyPlan: {
      title: 'Yearly Plan',
      price: 'RM1,980',
      originalPrice: 'RM180',
      period: 'year',
      benefits: [
        'Includes full subscription features',
        'One account can bind one device only',
        'Cancel renewal anytime',
      ],
      discountLabel: 'Save now',
      discountValue: '33%',
    },
    confirm: {
      title: 'Confirm Payment',
      couponLabel: 'Coupon',
      couponPlaceholder: 'Enter coupon code',
      invalidCouponText: 'Invalid coupon code',
      validCouponText: 'Exclusive new-account yearly discount',
      totalLabel: 'Total amount',
      payButton: 'Pay',
      successMessage: 'Subscription successful. Welcome aboard.',
    },
    closeButtonLabel: 'Close payment page',
  },

  ms: {
    benefits: [
      'Lebih 500,000 lagu berkualiti, nyanyi bila-bila masa',
      'Kemas kini bulanan dengan lagu baharu lebih awal',
      'Rakam dengan satu ketikan, terbitkan bila-bila masa',
      'Simpan lagu dan bina senarai lagu sendiri',
      'Sokongan antara muka pelbagai bahasa',
    ],
    note: '※ Pelan bulanan dan tahunan merangkumi semua fungsi di atas',
    monthlyPlan: {
      title: 'Pelan Bulanan',
      price: 'RM199',
      originalPrice: 'RM20',
      period: 'bulan',
      benefits: [
        'Termasuk semua fungsi langganan',
        'Satu akaun hanya boleh dipautkan kepada satu peranti',
        'Boleh batalkan pembaharuan bila-bila masa',
      ],
    },
    yearlyPlan: {
      title: 'Pelan Tahunan',
      price: 'RM1,980',
      originalPrice: 'RM180',
      period: 'tahun',
      benefits: [
        'Termasuk semua fungsi langganan',
        'Satu akaun hanya boleh dipautkan kepada satu peranti',
        'Boleh batalkan pembaharuan bila-bila masa',
      ],
      discountLabel: 'Jimat sekarang',
      discountValue: '33%',
    },
    confirm: {
      title: 'Sahkan Pembayaran',
      couponLabel: 'Kupon',
      couponPlaceholder: 'Masukkan kod kupon',
      invalidCouponText: 'Kod kupon tidak sah',
      validCouponText: 'Diskaun tahunan eksklusif untuk akaun baharu',
      totalLabel: 'Jumlah bayaran',
      payButton: 'Bayar',
      successMessage: 'Langganan berjaya. Selamat datang.',
    },
    closeButtonLabel: 'Tutup halaman pembayaran',
  },
};
