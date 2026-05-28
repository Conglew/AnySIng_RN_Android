import * as SecureStore from 'expo-secure-store';
import { AuthSession } from './auth.types';

const ACCESS_TOKEN_KEY = 'anysing_access_token';
const REFRESH_TOKEN_KEY = 'anysing_refresh_token';
const USER_ID_KEY = 'anysing_user_id';
const USER_EMAIL_KEY = 'anysing_user_email';

type AuthSessionLike = AuthSession & {
  accessToken?: string;
  refreshToken?: string;
  refresh_token?: string;
};

function getSessionAccessToken(session: AuthSessionLike) {
  return session.token ?? session.accessToken;
}

function getSessionRefreshToken(session: AuthSessionLike) {
  return session.refreshToken ?? session.refresh_token;
}

export async function saveAuthSession(session: AuthSessionLike) {
  const accessToken = getSessionAccessToken(session);
  const refreshToken = getSessionRefreshToken(session);

  if (!accessToken) {
    throw new Error('Missing access token in auth session.');
  }

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    console.log('[AuthTokenStore] saveAuthSession without refreshToken');
  }

  await SecureStore.setItemAsync(USER_ID_KEY, session.userId);
  await SecureStore.setItemAsync(USER_EMAIL_KEY, session.userEmail);
}

export async function setAccessToken(token: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function setRefreshToken(token: string) {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function setAuthTokens({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken?: string | null;
}) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function setUserEmail(userEmail: string) {
  await SecureStore.setItemAsync(USER_EMAIL_KEY, userEmail);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getUserId() {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function getUserEmail() {
  return SecureStore.getItemAsync(USER_EMAIL_KEY);
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
  await SecureStore.deleteItemAsync(USER_EMAIL_KEY);
}