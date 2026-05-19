import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type MainFooterCopy = {
  home: string;
  songRequest: string;
  skipSong: string;
  pause: string;
  resume: string;
  vocal: string;
  accompaniment: string;
  restart: string;
  queued: string;
  record: string;
};

export const MAIN_FOOTER_COPY: Record<LanguageValue, MainFooterCopy> = {
  'zh-CN': {
    home: '主页',
    songRequest: '点歌',
    skipSong: '切歌',
    pause: '暂停',
    resume: '播放',
    vocal: '原唱',
    accompaniment: '伴唱',
    restart: '重唱',
    queued: '已点',
    record: '录制',
  },
  'zh-TW': {
    home: '主頁',
    songRequest: '點歌',
    skipSong: '切歌',
    pause: '暫停',
    resume: '播放',
    vocal: '原唱',
    accompaniment: '伴唱',
    restart: '重唱',
    queued: '已點',
    record: '錄製',
  },
  en: {
    home: 'Home',
    songRequest: 'Songs',
    skipSong: 'Skip',
    pause: 'Pause',
    resume: 'Play',
    vocal: 'Vocal',
    accompaniment: 'Backing',
    restart: 'Restart',
    queued: 'Queue',
    record: 'Record',
  },
  ms: {
    home: 'Utama',
    songRequest: 'Lagu',
    skipSong: 'Langkau',
    pause: 'Jeda',
    resume: 'Main',
    vocal: 'Vokal',
    accompaniment: 'Iringan',
    restart: 'Ulang',
    queued: 'Giliran',
    record: 'Rakam',
  },
};
