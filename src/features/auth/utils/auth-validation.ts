// src/features/auth/utils/auth-validation.ts

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPassword(value: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9!@#|><_.]{8,}$/.test(value);
}

export function normalizeVerificationCode(value: string) {
  return value.replace(/\D/g, '').slice(0, 5);
}
