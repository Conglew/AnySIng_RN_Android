import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onInput: (value: string) => void;
  onBackspace: () => void;
  onDone: () => void;
};

const LETTER_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['⇧', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '@', '.'],
];

const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const BOTTOM_ROW = ['_', '-', '⌫', '完成'];

export function CustomEmailKeyboard({ visible, onInput, onBackspace, onDone }: Props) {
  const [isUppercase, setIsUppercase] = useState(false);

  if (!visible) {
    return null;
  }

  const rows = [
    NUMBER_ROW,
    ...LETTER_ROWS.map((row) =>
      row.map((key) => {
        if (isLetterKey(key)) {
          return isUppercase ? key.toUpperCase() : key.toLowerCase();
        }

        return key;
      }),
    ),
    BOTTOM_ROW,
  ];

  return (
    <View style={styles.keyboard}>
      {rows.map((row, rowIndex) => (
        <View key={`email-keyboard-row-${rowIndex}`} style={styles.row}>
          {row.map((key) => {
            const isDoneKey = key === '完成';
            const isBackspaceKey = key === '⌫';
            const isShiftKey = key === '⇧';

            return (
              <Pressable
                key={key}
                style={[
                  styles.key,
                  isDoneKey && styles.doneKey,
                  isShiftKey && isUppercase && styles.shiftKeyActive,
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

                  if (isShiftKey) {
                    setIsUppercase((currentValue) => !currentValue);
                    return;
                  }

                  onInput(key);
                }}
              >
                <Text style={styles.keyText}>{key}</Text>
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
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    zIndex: 9999,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  key: {
    width: 58,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  doneKey: {
    width: 116,
    backgroundColor: '#FF7A00',
  },
  shiftKeyActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
