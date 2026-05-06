import * as SecureStore from 'expo-secure-store';

const REMEMBERED_EMAIL_KEY = 'anysing_remembered_email';
const REMEMBERED_PASSWORD_KEY = 'anysing_remembered_password';
const REMEMBER_ME_KEY = 'anysing_remember_me';

export type RememberedLogin = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export async function saveRememberedLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email);
  await SecureStore.setItemAsync(REMEMBERED_PASSWORD_KEY, password);
  await SecureStore.setItemAsync(REMEMBER_ME_KEY, 'true');
}

export async function getRememberedLogin(): Promise<RememberedLogin | null> {
  const rememberMe = await SecureStore.getItemAsync(REMEMBER_ME_KEY);

  if (rememberMe !== 'true') {
    return null;
  }

  const email = await SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY);
  const password = await SecureStore.getItemAsync(REMEMBERED_PASSWORD_KEY);

  if (!email || !password) {
    return null;
  }

  return {
    email,
    password,
    rememberMe: true,
  };
}

export async function clearRememberedLogin() {
  await SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY);
  await SecureStore.deleteItemAsync(REMEMBERED_PASSWORD_KEY);
  await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
}
