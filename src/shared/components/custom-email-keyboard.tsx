import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onInput: (value: string) => void;
  onBackspace: () => void;
  onDone: () => void;
};

type KeyboardKey = {
  label: string;
  value?: string;
  type?: 'char' | 'tab' | 'caps' | 'shift' | 'backspace' | 'done';
  flex?: number;
};

const ROWS: KeyboardKey[][] = [
  [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '0', value: '0' },
  ],
  [
    { label: 'tab', type: 'tab', flex: 1.45 },
    { label: 'q', value: 'q' },
    { label: 'w', value: 'w' },
    { label: 'e', value: 'e' },
    { label: 'r', value: 'r' },
    { label: 't', value: 't' },
    { label: 'y', value: 'y' },
    { label: 'u', value: 'u' },
    { label: 'i', value: 'i' },
    { label: 'o', value: 'o' },
    { label: 'p', value: 'p' },
    { label: '{', value: '{' },
    { label: '}', value: '}' },
    { label: '\\', value: '\\' },
  ],
  [
    { label: '⇧', type: 'caps', flex: 1.85 },
    { label: 'a', value: 'a' },
    { label: 's', value: 's' },
    { label: 'd', value: 'd' },
    { label: 'f', value: 'f' },
    { label: 'g', value: 'g' },
    { label: 'h', value: 'h' },
    { label: 'j', value: 'j' },
    { label: 'k', value: 'k' },
    { label: 'l', value: 'l' },
    { label: ':', value: ':' },
    { label: '"', value: '"' },
    { label: 'return', type: 'done', flex: 1.75 },
  ],
  [
    { label: 'shift', type: 'shift', flex: 2.35 },
    { label: 'z', value: 'z' },
    { label: 'x', value: 'x' },
    { label: 'c', value: 'c' },
    { label: 'v', value: 'v' },
    { label: 'b', value: 'b' },
    { label: 'n', value: 'n' },
    { label: 'm', value: 'm' },
    { label: '<', value: '<' },
    { label: '>', value: '>' },
    { label: '?', value: '?' },
    { label: 'shift', type: 'shift', flex: 2.35 },
  ],
  [
    { label: '!', value: '!' },
    { label: '@', value: '@' },
    { label: '#', value: '#' },
    { label: '|', value: '|' },
    { label: '_', value: '_' },
    { label: '-', value: '-' },
    { label: '.', value: '.' },
    { label: '⌫', type: 'backspace', flex: 1.6 },
    { label: '完成', type: 'done', flex: 2.2 },
  ],
];

export function CustomEmailKeyboard({ visible, onInput, onBackspace, onDone }: Props) {
  const insets = useSafeAreaInsets();

  const [isUppercase, setIsUppercase] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  if (!visible) {
    return null;
  }

  const shouldUseUppercase = isUppercase || isCapsLock;

  const handleKeyPress = (key: KeyboardKey) => {
    if (key.type === 'backspace') {
      onBackspace();
      return;
    }

    if (key.type === 'done') {
      onDone();
      return;
    }

    if (key.type === 'tab') {
      onInput('\t');
      return;
    }

    if (key.type === 'caps') {
      setIsCapsLock((currentValue) => !currentValue);
      setIsUppercase(false);
      return;
    }

    if (key.type === 'shift') {
      setIsUppercase((currentValue) => !currentValue);
      return;
    }

    if (!key.value) {
      return;
    }

    const outputValue =
      shouldUseUppercase && isLetterKey(key.value) ? key.value.toUpperCase() : key.value;

    onInput(outputValue);

    /*
     * shift 是單次大寫。
     * caps lock 是持續大寫。
     *
     * 因此只有在 shift 開啟、caps lock 未開啟，且輸入的是英文字母時，
     * 才會自動回到小寫。
     */
    if (isUppercase && !isCapsLock && isLetterKey(key.value)) {
      setIsUppercase(false);
    }
  };

  return (
    <View
      style={[
        styles.keyboard,
        {
          paddingBottom: 12 + insets.bottom,
        },
      ]}
    >
      {ROWS.map((row, rowIndex) => (
        <View key={`email-keyboard-row-${rowIndex}`} style={styles.row}>
          {row.map((key, keyIndex) => {
            const isControlKey =
              key.type === 'tab' ||
              key.type === 'caps' ||
              key.type === 'shift' ||
              key.type === 'done' ||
              key.type === 'backspace';

            const isActiveShiftKey = key.type === 'shift' && isUppercase;
            const isActiveCapsKey = key.type === 'caps' && isCapsLock;

            const displayLabel =
              shouldUseUppercase && key.value && isLetterKey(key.value)
                ? key.label.toUpperCase()
                : key.label;

            return (
              <Pressable
                key={`email-key-${rowIndex}-${keyIndex}-${key.label}`}
                style={({ pressed }) => [
                  styles.key,
                  {
                    flex: key.flex ?? 1,
                  },
                  isControlKey && styles.controlKey,
                  key.type === 'done' && styles.doneKey,
                  key.type === 'backspace' && styles.backspaceKey,
                  isActiveShiftKey && styles.activeControlKey,
                  isActiveCapsKey && styles.activeControlKey,
                  pressed && styles.keyPressed,
                ]}
                onPress={() => {
                  handleKeyPress(key);
                }}
              >
                <Text
                  style={[
                    styles.keyText,
                    isControlKey && styles.controlKeyText,
                    key.type === 'done' && styles.doneKeyText,
                    key.type === 'caps' && styles.shiftSymbolText,
                    isActiveCapsKey && styles.activeShiftSymbolText,
                    isActiveShiftKey && styles.activeShiftSymbolText,
                  ]}
                >
                  {displayLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function isLetterKey(value: string) {
  return /^[a-z]$/i.test(value);
}

const styles = StyleSheet.create({
  keyboard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    zIndex: 9999,
  },

  row: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },

  key: {
    height: 42,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },

  controlKey: {
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
  },

  activeControlKey: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
  },

  doneKey: {
    backgroundColor: '#FF7A00',
  },

  backspaceKey: {
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },

  keyPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },

  keyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  controlKeyText: {
    fontSize: 10,
    fontWeight: '600',
  },

  doneKeyText: {
    fontSize: 13,
    fontWeight: '700',
  },

  shiftSymbolText: {
    fontSize: 22,
    fontWeight: '700',
  },

  activeShiftSymbolText: {
    color: '#FF7A00',
  },
});
