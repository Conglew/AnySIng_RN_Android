import { Modal, Pressable, Text, View } from 'react-native';

import { ForgotPasswordCopy } from '@/src/features/auth/i18n/forgot-password-copy';

type Props = {
  visible: boolean;
  copy: ForgotPasswordCopy;
  styles: any;
  onConfirmLeave: () => void;
  onCancelLeave: () => void;
};

export function LeaveConfirmModal({ visible, copy, styles, onConfirmLeave, onCancelLeave }: Props) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onCancelLeave}>
      <View style={styles.confirmModalOverlay}>
        <View style={styles.confirmModalCard}>
          <Text style={styles.confirmModalTitle}>{copy.leaveTitle}</Text>

          <Text style={styles.confirmModalDescription}>{copy.leaveDescription}</Text>

          <View style={styles.confirmModalButtonRow}>
            <Pressable style={styles.confirmModalGhostButton} onPress={onConfirmLeave}>
              <Text style={styles.confirmModalGhostButtonText}>{copy.leaveButton}</Text>
            </Pressable>

            <Pressable style={styles.confirmModalPrimaryButton} onPress={onCancelLeave}>
              <Text style={styles.confirmModalPrimaryButtonText}>{copy.continueButton}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
