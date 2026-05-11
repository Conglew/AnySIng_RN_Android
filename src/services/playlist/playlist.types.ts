import { SongDto } from '@/src/services/song/song.types';

export type PlaylistType = 'pending' | 'collect';

export type PlaylistSongItemDto = {
  _id?: string;
  songId: string;
  queueId?: string | null;
  isCollected?: boolean;
  isPendinged?: boolean;
  addedAt?: string;

  song: SongDto & {
    id?: string;
  };
};

export type UserPlaylistDto = {
  _id: string;
  owner: string;
  type: PlaylistType;
  songs: PlaylistSongItemDto[];
  createdAt?: string;
  updatedAt?: string;
};

export type UserPlaylistsResponse = UserPlaylistDto[];

export type GetUserPlaylistsParams = {
  type?: PlaylistType;
};

export type PlaylistNowPlayingSong = {
  id: string;
  title: string;
  artists: string[];
};

export type PlaylistNowPlayingResponse = {
  current: PlaylistNowPlayingSong | null;
  next: PlaylistNowPlayingSong | null;
};

export type AddSongToPlaylistResponse = {
  message: string;
  playlist: UserPlaylistDto;
  currentPlaylist?: string;
  currentIndex?: number;
};

export type InterjectSongNextResponse = {
  message: string;
  playlist: UserPlaylistDto;
  currentIndex: number;
  currentSong?: PlaylistSongItemDto | null;
  nextUp?: PlaylistSongItemDto | null;
};

export type RemoveSongFromPlaylistResponse = {
  message: string;
  playlist: UserPlaylistDto;
};

export type PlayNextResponse = {
  message: string;
  currentIndex?: number;
  currentSong?: PlaylistSongItemDto | null;
};
