import * as SecureStore from 'expo-secure-store';
import { AuthSession } from './auth.types';

const ACCESS_TOKEN_KEY = 'anysing_access_token';
const USER_ID_KEY = 'anysing_user_id';
const USER_EMAIL_KEY = 'anysing_user_email';

export async function saveAuthSession(session: AuthSession) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.token);
  await SecureStore.setItemAsync(USER_ID_KEY, session.userId);
  await SecureStore.setItemAsync(USER_EMAIL_KEY, session.userEmail);
}

export async function setAccessToken(token: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function setUserEmail(userEmail: string) {
  await SecureStore.setItemAsync(USER_EMAIL_KEY, userEmail);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getUserId() {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function getUserEmail() {
  return SecureStore.getItemAsync(USER_EMAIL_KEY);
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
  await SecureStore.deleteItemAsync(USER_EMAIL_KEY);
}
