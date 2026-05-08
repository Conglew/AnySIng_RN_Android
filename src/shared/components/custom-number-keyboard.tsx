import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onInput: (value: string) => void;
  onBackspace: () => void;
  onDone: () => void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'backspace', '0', 'done'];

export function CustomNumberKeyboard({ visible, onInput, onBackspace, onDone }: Props) {
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.keyboard,
        {
          paddingBottom: 16 + insets.bottom,
        },
      ]}
    >
      {KEYS.map((key) => {
        const isBackspaceKey = key === 'backspace';
        const isDoneKey = key === 'done';
        const label = isBackspaceKey ? '⌫' : isDoneKey ? '完成' : key;

        return (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.key,
              pressed && styles.keyPressed,
              isDoneKey && styles.doneKey,
              pressed && isDoneKey && styles.doneKeyPressed,
            ]}
            onPress={() => {
              if (isBackspaceKey) {
                onBackspace();
                return;
              }

              if (isDoneKey) {
                onDone();
                return;
              }

              onInput(key);
            }}
          >
            <Text style={styles.keyText}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 9999,
  },
  key: {
    width: '33.333%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  keyPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  doneKey: {
    borderRadius: 12,
  },
  doneKeyPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
    backgroundColor: 'rgba(255, 122, 0, 0.36)',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
});
