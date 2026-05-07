import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onInput: (value: string) => void;
  onBackspace: () => void;
  onDone: () => void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'backspace', '0', 'done'];

export function CustomNumberKeyboard({ visible, onInput, onBackspace, onDone }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.keyboard}>
      {KEYS.map((key) => {
        const label = key === 'backspace' ? '⌫' : key === 'done' ? '完成' : key;

        return (
          <Pressable
            key={key}
            style={styles.key}
            onPress={() => {
              if (key === 'backspace') {
                onBackspace();
                return;
              }

              if (key === 'done') {
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
    height: 260,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 9999,
  },
  key: {
    width: '33.333%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
});
