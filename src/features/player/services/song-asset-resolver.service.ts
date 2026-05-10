import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { songClient } from '@/src/services/song/song-client';
import { SongDto } from '@/src/services/song/song.types';

export type ResolvedSongAssets = {
  song: SongDto;
  videoUrl: string;
  vocalUrl?: string;
  instrumentalUrl?: string;
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
      videoUrl: song.signedMvUrl,
      vocalUrl: vocal?.signedUrl,
      instrumentalUrl: instrumental?.signedUrl,
    };
  },
};
