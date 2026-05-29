export type SongArtistDto =
  | string
  | {
      _id?: string;
      name?: string;
      artistName?: string;
      singerName?: string;
      initials?: string;
      zhuyin?: string;
    };

export type SongCategoryDto =
  | string
  | {
      _id: string;
      name: string;
      slug?: string;
    };

export type SongAudioVariantDto = {
  type: 'withVocal' | 'instrumental' | string;
  url?: string;
  signedUrl?: string;
};

export type SongLyricsDto = {
  rawTextUrl?: string;
  lrcUrl?: string;
};

export type SongDto = {
  _id: string;
  title: string;
  initials?: string;
  zhuyin?: string;
  artists?: SongArtistDto[];
  categories?: SongCategoryDto[];
  album?: string;
  language?: string;
  coverUrl?: string;
  // mvUrl?: string;
  signedMvUrl?: string | null;
  audioVariants?: SongAudioVariantDto[];
  signedAudioVariants?: SongAudioVariantDto[];
  lyrics?: SongLyricsDto;
  playCount?: number;
  likes?: number;
  releaseDate?: string;
  createdAt?: string;
  isCollected?: boolean;
  isPendinged?: boolean;
  isPending?: boolean;
};

export type SongListResponse = {
  page: number;
  limit: number;
  total: number;
  songs: SongDto[];
};

export type SongDetailResponse = SongDto;

export type SongBatchRequest = {
  ids: string[];
};

export type SongBatchResponse = {
  songs: SongDto[];
};

export type SongSearchMode = 'title' | 'initials' | 'zhuyin';

export type GetSongsParams = {
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'playCount';
  order?: 'asc' | 'desc';
  lan?: string;
};

export type SearchSongsParams = {
  q: string;
  page?: number;
  limit?: number;
  mode?: SongSearchMode;
  artistId?: string;
  sortBy?: 'createdAt' | 'playCount' | 'title';
  order?: 'asc' | 'desc';
};

export type FilterSongsByLanguageParams = {
  language: string;
  page?: number;
  limit?: number;
};

export type PresignedFileField = 'mvFile' | 'vocalFile' | 'instFile';

export type PresignedUrlRequest = {
  files: {
    field: PresignedFileField;
    filename: string;
    contentType: string;
  }[];
};

export type PresignedUrlResponse = {
  urls: Partial<
    Record<
      PresignedFileField,
      {
        key: string;
        uploadUrl: string;
      }
    >
  >;
};

export type ResolveSongFileFromS3Response = {
  title: string;
  key: string;
  size?: number;
  lastModified?: string;
  signedUrl: string;
};
