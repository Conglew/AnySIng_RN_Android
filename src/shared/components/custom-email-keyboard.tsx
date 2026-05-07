import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onInput: (value: string) => void;
  onBackspace: () => void;
  onDone: () => void;
};

const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '@', '.'],
  ['_', '-', '⌫', '完成'],
];

export function CustomEmailKeyboard({ visible, onInput, onBackspace, onDone }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, rowIndex) => (
        <View key={`email-keyboard-row-${rowIndex}`} style={styles.row}>
          {row.map((key) => {
            const isWideKey = key === '完成';

            return (
              <Pressable
                key={key}
                style={[styles.key, isWideKey && styles.wideKey]}
                onPress={() => {
                  if (key === '⌫') {
                    onBackspace();
                    return;
                  }

                  if (key === '完成') {
                    onDone();
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
  wideKey: {
    width: 116,
    backgroundColor: '#FF7A00',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
