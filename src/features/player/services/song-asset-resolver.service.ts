import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { songClient } from '@/src/services/song/song-client';
import { SongDto } from '@/src/services/song/song.types';

export type ResolvedSongAssets = {
  song?: SongDto;
  songId?: string;
  title?: string;
  s3Key?: string;
  videoUrl: string;
  vocalUrl?: string;
  instrumentalUrl?: string;
  size?: number;
};

export const songAssetResolverService = {
  async resolve(songId: string): Promise<ResolvedSongAssets> {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Missing access token.');
    }

    const song = await songClient.getSongById({
      token,
      songId,
    });

    if (!song.signedMvUrl) {
      throw new Error('Missing signedMvUrl.');
    }

    const vocal = song.signedAudioVariants?.find((item) => item.type === 'withVocal');

    const instrumental = song.signedAudioVariants?.find((item) => item.type === 'instrumental');

    return {
      song,
      songId,
      title: song.title,
      videoUrl: song.signedMvUrl,
      vocalUrl: vocal?.signedUrl,
      instrumentalUrl: instrumental?.signedUrl,
    };
  },

  async resolveFromS3Title({
    songId,
    title,
  }: {
    songId: string;
    title: string;
  }): Promise<ResolvedSongAssets> {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Missing access token.');
    }

    const result = await songClient.resolveSongFileFromS3({
      token,
      title,
    });

    if (!result.signedUrl) {
      throw new Error('Missing S3 signedUrl.');
    }

    return {
      songId,
      title: result.title,
      s3Key: result.key,
      videoUrl: result.signedUrl,
      size: result.size,
    };
  },
};
