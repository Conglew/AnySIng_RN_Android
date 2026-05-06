import { useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

import {
  FORGOT_PASSWORD_FLOW_COPY,
  LanguageValue,
} from '@/src/features/auth/i18n/forgot-password-copy';
import { useForgotPasswordFlow } from '@/src/features/auth/hooks/use-forgot-password-flow';
import { LeaveConfirmModal } from './leave-confirm-modal';

type Props = {
  language: LanguageValue;
  styles: any;
  backButtonPositionStyle: StyleProp<ViewStyle>;
  onBackToLogin: () => void;
  pushDebugLog?: (message: string) => void;
};

export function ForgotPasswordCanvas({
  language,
  styles,
  backButtonPositionStyle,
  onBackToLogin,
  pushDebugLog,
}: Props) {
  const verificationCodeInputRef = useRef<TextInput>(null);
  const forgotCopy = FORGOT_PASSWORD_FLOW_COPY[language];

  const flow = useForgotPasswordFlow({
    forgotCopy,
    onBackToLogin,
    pushDebugLog,
  });

  if (flow.forgotPasswordStep === 'success') {
    return (
      <View style={styles.secondaryPage}>
        <View style={styles.forgotSuccessContent}>
          <Text style={styles.forgotSuccessText}>{forgotCopy.successMessage}</Text>
        </View>

        <LeaveConfirmModal
          visible={flow.isLeaveConfirmVisible}
          copy={forgotCopy}
          styles={styles}
          onConfirmLeave={flow.confirmLeaveForgotPassword}
          onCancelLeave={flow.cancelLeaveForgotPassword}
        />
      </View>
    );
  }

  return (
    <View style={styles.secondaryPage}>
      <Pressable
        style={[styles.backButton, backButtonPositionStyle]}
        onPress={flow.requestBackToLoginCanvas}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>

      <View style={styles.secondaryContent}>
        <View style={styles.forgotTitleSlot}>
          <Text style={styles.secondaryTitle}>{forgotCopy.title}</Text>
        </View>

        <View style={styles.forgotDescriptionSlot}>
          {flow.forgotPasswordStep === 'email' ? (
            <Text style={styles.secondaryDescription}>
              {forgotCopy.descriptionBefore}
              <Text style={styles.secondaryDescriptionHighlight}>
                {forgotCopy.descriptionHighlight}
              </Text>
              {forgotCopy.descriptionAfter}
            </Text>
          ) : (
            <Text style={styles.forgotNoticeText}>{forgotCopy.sentNotice}</Text>
          )}
        </View>

        <View style={styles.forgotEmailCenterBlock}>
          <View style={styles.forgotEmailInputGroup}>
            <Text style={styles.secondaryLabel}>{forgotCopy.emailLabel}</Text>

            <TextInput
              value={flow.forgotPasswordEmail}
              onChangeText={(value) => {
                flow.setForgotPasswordEmail(value);
              }}
              placeholder={forgotCopy.emailPlaceholder}
              placeholderTextColor="rgba(255, 255, 255, 0.42)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={flow.forgotPasswordStep === 'email'}
              showSoftInputOnFocus={true}
              style={styles.secondaryInput}
            />
          </View>

          {flow.forgotPasswordStep !== 'email' ? (
            <View style={styles.resendSlotAbsolute}>
              <Text style={styles.resendText}>
                {flow.resendSeconds > 0
                  ? forgotCopy.resendCountdown(flow.resendSeconds)
                  : forgotCopy.resendButton}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.forgotActionSlot}>
          {flow.forgotPasswordStep === 'email' ? (
            <Pressable
              disabled={!flow.isEmailValid || flow.isForgotSubmitting}
              style={({ pressed }) => [
                styles.secondarySubmitButton,
                pressed && !flow.isForgotSubmitting && styles.secondarySubmitButtonPressed,
                !flow.isEmailValid && styles.hiddenActionButton,
                flow.isForgotSubmitting && styles.secondarySubmitButtonLoading,
              ]}
              onPress={flow.handleSendForgotPasswordCode}
            >
              {flow.isForgotSubmitting ? (
                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.86)" />
              ) : (
                <Text style={styles.secondarySubmitButtonText}>{forgotCopy.sendButton}</Text>
              )}
            </Pressable>
          ) : null}

          {flow.forgotPasswordStep === 'code' ? (
            <View style={styles.verificationArea}>
              <View style={styles.verificationLabelRow}>
                <Text style={styles.verificationLabel}>{forgotCopy.codeLabel}</Text>
                <Text style={styles.verificationHint}>{forgotCopy.codeHint}</Text>
              </View>

              {flow.verificationCodeError ? (
                <Text style={styles.verificationErrorText}>{flow.verificationCodeError}</Text>
              ) : null}

              <Pressable
                style={styles.verificationCodePressArea}
                onPress={() => verificationCodeInputRef.current?.focus()}
              >
                <TextInput
                  ref={verificationCodeInputRef}
                  value={flow.verificationCode}
                  onChangeText={flow.handleVerificationCodeChange}
                  keyboardType="number-pad"
                  maxLength={5}
                  caretHidden={true}
                  showSoftInputOnFocus={true}
                  editable={!flow.isForgotSubmitting}
                  style={styles.hiddenVerificationCodeInput}
                />

                <View style={styles.verificationCodeRow}>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const digit = flow.verificationCode[index] ?? '';

                    return (
                      <View
                        key={`verification-code-box-${index}`}
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

        {flow.forgotPasswordStep === 'resetPassword' ? (
          <View style={styles.resetPasswordArea}>
            <Text style={styles.resetPasswordTitle}>{forgotCopy.resetTitle}</Text>

            <Text style={styles.resetPasswordDescription}>{forgotCopy.resetDescription}</Text>

            <View style={styles.resetPasswordRow}>
              <View style={styles.resetPasswordInputGroup}>
                <Text style={styles.secondaryLabel}>{forgotCopy.newPasswordLabel}</Text>

                <TextInput
                  value={flow.newPassword}
                  onChangeText={(value) => {
                    flow.setNewPassword(value);
                    flow.setNewPasswordError('');
                  }}
                  placeholder={forgotCopy.passwordPlaceholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.42)"
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.secondaryInput, flow.newPasswordError && styles.inputError]}
                />

                {flow.newPasswordError ? (
                  <Text style={styles.fieldErrorText}>{flow.newPasswordError}</Text>
                ) : null}
              </View>

              <View style={styles.resetPasswordInputGroup}>
                <Text style={styles.secondaryLabel}>{forgotCopy.confirmPasswordLabel}</Text>

                <TextInput
                  value={flow.confirmNewPassword}
                  onChangeText={(value) => {
                    flow.setConfirmNewPassword(value);
                    flow.setConfirmPasswordError('');
                  }}
                  placeholder={forgotCopy.passwordPlaceholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.42)"
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.secondaryInput, flow.confirmPasswordError && styles.inputError]}
                />

                {flow.confirmPasswordError ? (
                  <Text style={styles.fieldErrorText}>{flow.confirmPasswordError}</Text>
                ) : null}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.secondarySubmitButton,
                pressed && styles.secondarySubmitButtonPressed,
              ]}
              onPress={flow.handleResetPasswordSubmit}
            >
              <Text style={styles.secondarySubmitButtonText}>{forgotCopy.resetButton}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <LeaveConfirmModal
        visible={flow.isLeaveConfirmVisible}
        copy={forgotCopy}
        styles={styles}
        onConfirmLeave={flow.confirmLeaveForgotPassword}
        onCancelLeave={flow.cancelLeaveForgotPassword}
      />
    </View>
  );
}
