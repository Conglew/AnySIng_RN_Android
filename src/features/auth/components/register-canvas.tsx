import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

import { REGISTER_FLOW_COPY } from '@/src/features/auth/i18n/register-copy';
import type { LanguageValue } from '@/src/shared/i18n/language.store';
import { useRegisterFlow } from '@/src/features/auth/hooks/use-register-flow';
import { LeaveConfirmModal } from '@/src/features/auth/components/leave-confirm-modal';
import { CustomEmailKeyboard } from '@/src/shared/components/custom-email-keyboard';
import { CustomNumberKeyboard } from '@/src/shared/components/custom-number-keyboard';

type Props = {
  language: LanguageValue;
  styles: any;
  backButtonPositionStyle: StyleProp<ViewStyle>;
  onBackToLogin: () => void;
  pushDebugLog?: (message: string) => void;
};

type RegisterKeyboardTarget =
  | 'email'
  | 'verificationCode'
  | 'newPassword'
  | 'confirmPassword'
  | null;

export function RegisterCanvas({
  language,
  styles,
  backButtonPositionStyle,
  onBackToLogin,
  pushDebugLog,
}: Props) {
  const verificationCodeInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const [activeKeyboardTarget, setActiveKeyboardTarget] = useState<RegisterKeyboardTarget>(null);

  const registerCopy = REGISTER_FLOW_COPY[language];

  const flow = useRegisterFlow({
    registerCopy,
    onBackToLogin,
    pushDebugLog,
  });

  useEffect(() => {
    if (flow.registerStep !== 'resetPassword') {
      return;
    }

    if (flow.resetPasswordPhase === 'confirmPassword') {
      requestAnimationFrame(() => {
        confirmPasswordInputRef.current?.focus();
        setActiveKeyboardTarget('confirmPassword');
      });
    }
  }, [flow.registerStep, flow.resetPasswordPhase]);

  if (flow.registerStep === 'success') {
    return (
      <View style={styles.secondaryPage}>
        <View style={styles.forgotSuccessContent}>
          <Text style={styles.forgotSuccessText}>{registerCopy.successMessage}</Text>
        </View>

        <LeaveConfirmModal
          visible={flow.isLeaveConfirmVisible}
          copy={registerCopy}
          styles={styles}
          onConfirmLeave={flow.confirmLeaveRegister}
          onCancelLeave={flow.cancelLeaveRegister}
        />
      </View>
    );
  }

  return (
    <View style={styles.secondaryPage}>
      <Pressable
        style={[styles.backButton, backButtonPositionStyle]}
        onPress={() => {
          setActiveKeyboardTarget(null);
          flow.requestBackToLoginCanvas();
        }}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>

      <View style={styles.secondaryContent}>
        {flow.registerStep !== 'resetPassword' ? (
          <>
            <View style={styles.forgotTitleSlot}>
              <Text style={styles.secondaryTitle}>{registerCopy.title}</Text>
            </View>

            <View style={styles.forgotDescriptionSlot}>
              {flow.registerStep === 'email' ? (
                <Text style={styles.secondaryDescription}>
                  {registerCopy.descriptionBefore}
                  <Text style={styles.secondaryDescriptionHighlight}>
                    {registerCopy.descriptionHighlight}
                  </Text>
                  {registerCopy.descriptionAfter}
                </Text>
              ) : (
                <Text style={styles.forgotNoticeText}>{registerCopy.sentNotice}</Text>
              )}
            </View>

            <View style={styles.forgotEmailCenterBlock}>
              <View style={styles.forgotEmailInputGroup}>
                <Text style={styles.secondaryLabel}>{registerCopy.emailLabel}</Text>

                <TextInput
                  value={flow.registerEmail}
                  onChangeText={() => {
                    // 使用自訂鍵盤，所以這裡不處理原生鍵盤輸入
                  }}
                  onPressIn={() => {
                    if (flow.registerStep === 'email') {
                      setActiveKeyboardTarget('email');
                    }
                  }}
                  placeholder={registerCopy.emailPlaceholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.42)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={flow.registerStep === 'email'}
                  showSoftInputOnFocus={false}
                  caretHidden={true}
                  style={styles.secondaryInput}
                />
              </View>

              {flow.registerStep !== 'email' ? (
                <View style={styles.resendSlotAbsolute}>
                  <Text style={styles.resendText}>
                    {flow.resendSeconds > 0
                      ? registerCopy.resendCountdown(flow.resendSeconds)
                      : registerCopy.resendButton}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        <View style={styles.forgotActionSlot}>
          {flow.registerStep === 'email' ? (
            <Pressable
              disabled={!flow.isRegisterEmailValid || flow.isRegisterSubmitting}
              style={({ pressed }) => [
                styles.secondarySubmitButton,
                pressed && !flow.isRegisterSubmitting && styles.secondarySubmitButtonPressed,
                !flow.isRegisterEmailValid && styles.hiddenActionButton,
                flow.isRegisterSubmitting && styles.secondarySubmitButtonLoading,
              ]}
              onPress={() => {
                setActiveKeyboardTarget(null);
                flow.handleSendRegisterCode();
              }}
            >
              {flow.isRegisterSubmitting ? (
                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.86)" />
              ) : (
                <Text style={styles.secondarySubmitButtonText}>{registerCopy.sendButton}</Text>
              )}
            </Pressable>
          ) : null}

          {flow.registerStep === 'code' ? (
            <View style={styles.verificationArea}>
              <View style={styles.verificationLabelRow}>
                <Text style={styles.verificationLabel}>{registerCopy.codeLabel}</Text>
                <Text style={styles.verificationHint}>{registerCopy.codeHint}</Text>
              </View>

              {flow.verificationCodeError ? (
                <Text style={styles.verificationErrorText}>{flow.verificationCodeError}</Text>
              ) : null}

              <Pressable
                style={styles.verificationCodePressArea}
                onPress={() => {
                  verificationCodeInputRef.current?.focus();
                  setActiveKeyboardTarget('verificationCode');
                }}
              >
                <TextInput
                  ref={verificationCodeInputRef}
                  value={flow.verificationCode}
                  onChangeText={() => {
                    // 使用自訂鍵盤，所以這裡不處理原生鍵盤輸入
                  }}
                  keyboardType="number-pad"
                  maxLength={5}
                  caretHidden={true}
                  showSoftInputOnFocus={false}
                  editable={!flow.isRegisterSubmitting}
                  style={styles.hiddenVerificationCodeInput}
                />

                <View style={styles.verificationCodeRow}>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const digit = flow.verificationCode[index] ?? '';

                    return (
                      <View
                        key={`register-code-box-${index}`}
                        style={[
                          styles.verificationCodeInput,
                          flow.verificationCodeError && styles.verificationCodeInputError,
                        ]}
                      >
                        <Text style={styles.verificationCodeDigitText}>{digit}</Text>
                      </View>
                    );
                  })}
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>

        {flow.registerStep === 'resetPassword' ? (
          <View style={styles.resetPasswordArea}>
            <Text style={styles.resetPasswordTitle}>{registerCopy.resetTitle}</Text>

            <Text style={styles.resetPasswordDescription}>{registerCopy.resetDescription}</Text>

            <View style={styles.resetPasswordRow}>
              <View style={styles.resetPasswordInputGroup}>
                <Text style={styles.secondaryLabel}>{registerCopy.newPasswordLabel}</Text>

                <TextInput
                  value={flow.newPassword}
                  onChangeText={() => {
                    // 使用自訂鍵盤，所以這裡不處理原生鍵盤輸入
                  }}
                  onPressIn={() => {
                    if (flow.resetPasswordPhase === 'newPassword') {
                      setActiveKeyboardTarget('newPassword');
                    }
                  }}
                  placeholder={registerCopy.passwordPlaceholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.42)"
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={flow.resetPasswordPhase === 'newPassword'}
                  showSoftInputOnFocus={false}
                  caretHidden={true}
                  style={[
                    styles.secondaryInput,
                    flow.newPasswordError && styles.inputError,
                    flow.resetPasswordPhase === 'confirmPassword' && styles.inputDisabled,
                  ]}
                />

                {flow.newPasswordError ? (
                  <Text style={styles.fieldErrorText}>{flow.newPasswordError}</Text>
                ) : null}
              </View>

              {flow.resetPasswordPhase === 'confirmPassword' ? (
                <View style={styles.resetPasswordInputGroup}>
                  <Text style={styles.secondaryLabel}>{registerCopy.confirmPasswordLabel}</Text>

                  <TextInput
                    ref={confirmPasswordInputRef}
                    value={flow.confirmNewPassword}
                    onChangeText={() => {
                      // 使用自訂鍵盤，所以這裡不處理原生鍵盤輸入
                    }}
                    onPressIn={() => {
                      setActiveKeyboardTarget('confirmPassword');
                    }}
                    placeholder={registerCopy.passwordPlaceholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.42)"
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!flow.isRegisterSubmitting}
                    showSoftInputOnFocus={false}
                    caretHidden={true}
                    style={[styles.secondaryInput, flow.confirmPasswordError && styles.inputError]}
                  />

                  {flow.confirmPasswordError ? (
                    <Text style={styles.fieldErrorText}>{flow.confirmPasswordError}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>

            <Pressable
              disabled={flow.isRegisterSubmitting}
              style={({ pressed }) => [
                styles.secondarySubmitButton,
                pressed && !flow.isRegisterSubmitting && styles.secondarySubmitButtonPressed,
                flow.isRegisterSubmitting && styles.secondarySubmitButtonLoading,
              ]}
              onPress={() => {
                setActiveKeyboardTarget(null);
                flow.handleRegisterPasswordSubmit();
              }}
            >
              {flow.isRegisterSubmitting ? (
                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.86)" />
              ) : (
                <Text style={styles.secondarySubmitButtonText}>{registerCopy.resetButton}</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>

      <CustomNumberKeyboard
        visible={activeKeyboardTarget === 'verificationCode'}
        onInput={(value) => {
          const nextCode = `${flow.verificationCode}${value}`.slice(0, 5);

          flow.handleVerificationCodeChange(nextCode);

          if (nextCode.length >= 5) {
            setActiveKeyboardTarget(null);
          }
        }}
        onBackspace={() => {
          flow.handleVerificationCodeChange(flow.verificationCode.slice(0, -1));
        }}
        onDone={() => {
          setActiveKeyboardTarget(null);
        }}
      />

      <CustomEmailKeyboard
        visible={
          activeKeyboardTarget === 'email' ||
          activeKeyboardTarget === 'newPassword' ||
          activeKeyboardTarget === 'confirmPassword'
        }
        onInput={(value) => {
          if (activeKeyboardTarget === 'email') {
            flow.setRegisterEmail(flow.registerEmail + value);
            return;
          }

          if (activeKeyboardTarget === 'newPassword') {
            flow.setNewPassword(flow.newPassword + value);
            flow.setNewPasswordError('');
            return;
          }

          if (activeKeyboardTarget === 'confirmPassword') {
            flow.setConfirmNewPassword(flow.confirmNewPassword + value);
            flow.setConfirmPasswordError('');
          }
        }}
        onBackspace={() => {
          if (activeKeyboardTarget === 'email') {
            flow.setRegisterEmail(flow.registerEmail.slice(0, -1));
            return;
          }

          if (activeKeyboardTarget === 'newPassword') {
            flow.setNewPassword(flow.newPassword.slice(0, -1));
            flow.setNewPasswordError('');
            return;
          }

          if (activeKeyboardTarget === 'confirmPassword') {
            flow.setConfirmNewPassword(flow.confirmNewPassword.slice(0, -1));
            flow.setConfirmPasswordError('');
          }
        }}
        onDone={() => {
          setActiveKeyboardTarget(null);
        }}
        offsetY={475}
      />

      <LeaveConfirmModal
        visible={flow.isLeaveConfirmVisible}
        copy={registerCopy}
        styles={styles}
        onConfirmLeave={flow.confirmLeaveRegister}
        onCancelLeave={flow.cancelLeaveRegister}
      />
    </View>
  );
}
