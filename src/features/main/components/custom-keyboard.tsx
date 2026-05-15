import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export type CustomKeyboardMode = 'zhuyin' | 'pinyin' | 'english';

type KeyboardModeTab = {
  label: string;
  value: CustomKeyboardMode;
};

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onClose?: () => void;
  placeholder?: string;
  onModeChange?: (mode: CustomKeyboardMode) => void;
};

const KEYBOARD_MODE_TABS: KeyboardModeTab[] = [
  {
    label: '注音',
    value: 'zhuyin',
  },
  {
    label: '拼音',
    value: 'pinyin',
  },
  {
    label: '英文',
    value: 'english',
  },
];

const NUMBER_KEYS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const ZHUYIN_KEYS = [
  ['ㄅ', 'ㄆ', '', '', 'ㄓ', '', '', 'ㄚ', 'ㄞ', 'ㄢ'],
  ['ㄆ', 'ㄊ', 'ㄍ', 'ㄐ', 'ㄔ', 'ㄗ', 'ㄧ', 'ㄛ', 'ㄟ', 'ㄣ'],
  ['ㄇ', 'ㄋ', 'ㄎ', 'ㄑ', 'ㄕ', 'ㄘ', 'ㄨ', 'ㄜ', 'ㄠ', 'ㄤ'],
  ['ㄈ', 'ㄌ', 'ㄏ', 'ㄒ', 'ㄖ', 'ㄙ', 'ㄩ', 'ㄝ', 'ㄡ', 'ㄥ'],
  ['ㄦ'],
];

const PINYIN_KEYS = [
  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
  ['k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't'],
  ['u', 'v', 'w', 'x', 'y', 'z'],
];

const ENGLISH_KEYS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y', 'Z'],
];

export function CustomKeyboard({
  value,
  onChangeText,
  onClose,
  placeholder = '搜尋歌曲或歌手',
  onModeChange,
}: Props) {
  const [keyboardMode, setKeyboardMode] = useState<CustomKeyboardMode>('zhuyin');

  const isZhuyinKeyboard = keyboardMode === 'zhuyin';

  const keyboardKeys = useMemo(() => {
    if (keyboardMode === 'pinyin') {
      return PINYIN_KEYS;
    }

    if (keyboardMode === 'english') {
      return ENGLISH_KEYS;
    }

    return ZHUYIN_KEYS;
  }, [keyboardMode]);

  const handlePressKeyboardMode = useCallback(
    (mode: CustomKeyboardMode) => {
      setKeyboardMode(mode);
      onModeChange?.(mode);
      onChangeText('');
    },
    [onChangeText, onModeChange],
  );

  const handlePressKeyboardKey = useCallback(
    (key: string) => {
      if (!key) {
        return;
      }

      onChangeText(`${value}${key}`);
    },
    [onChangeText, value],
  );

  const handlePressNumberKey = useCallback(
    (key: string) => {
      onChangeText(`${value}${key}`);
    },
    [onChangeText, value],
  );

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const handleDelete = useCallback(() => {
    onChangeText(Array.from(value).slice(0, -1).join(''));
  }, [onChangeText, value]);

  return (
    <View style={styles.container}>
      <View style={styles.keyboardTopRow}>
        {KEYBOARD_MODE_TABS.map((tab) => {
          const isActive = keyboardMode === tab.value;

          return (
            <Pressable
              key={tab.label}
              style={[styles.keyboardModeButton, isActive && styles.keyboardModeButtonActive]}
              onPress={() => handlePressKeyboardMode(tab.value)}
            >
              <Text style={[styles.keyboardModeText, isActive && styles.keyboardModeTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}

        {onClose ? (
          <Pressable style={styles.closeIconButton} onPress={onClose}>
            <Text style={styles.closeIconText}>×</Text>
          </Pressable>
        ) : null}
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.55)"
        style={styles.searchInput}
        showSoftInputOnFocus={false}
        caretHidden={true}
      />

      <View style={styles.numberRow}>
        {NUMBER_KEYS.map((key) => (
          <Pressable key={key} style={styles.numberKey} onPress={() => handlePressNumberKey(key)}>
            <Text style={styles.keyText}>{key}</Text>
          </Pressable>
        ))}

        <Pressable style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>清空</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>⌫</Text>
        </Pressable>
      </View>

      <View style={styles.keyboardGrid}>
        {keyboardKeys.map((row, rowIndex) => (
          <View
            key={`keyboard-row-${rowIndex}`}
            style={[
              styles.keyboardRow,
              isZhuyinKeyboard ? styles.keyboardRowEnd : styles.keyboardRowStart,
            ]}
          >
            {row.map((key, keyIndex) => {
              const isEmpty = key.length === 0;

              return (
                <Pressable
                  key={`keyboard-key-${rowIndex}-${keyIndex}`}
                  style={[styles.keyboardKey, isEmpty && styles.keyboardKeyDisabled]}
                  disabled={isEmpty}
                  onPress={() => handlePressKeyboardKey(key)}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  keyboardTopRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },

  keyboardModeButton: {
    height: 50,
    width: 71,
    borderRadius: 5,
    // paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  keyboardModeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },

  keyboardModeText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '700',
  },

  keyboardModeTextActive: {
    color: '#FFFFFF',
  },

  closeIconButton: {
    marginLeft: 'auto',
    width: 50,
    height: 50,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
  },

  searchInput: {
    height: 58,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },

  numberRow: {
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },

  numberKey: {
    width: 34,
    height: 49,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButton: {
    width: 69,
    height: 49,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },

  deleteButton: {
    marginLeft: 'auto',
    width: 56,
    height: 50,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
  },

  keyboardGrid: {
    gap: 7,
  },

  keyboardRow: {
    flexDirection: 'row',
    gap: 9.5,
  },

  keyboardRowStart: {
    justifyContent: 'flex-start',
  },

  keyboardRowEnd: {
    justifyContent: 'flex-end',
  },

  keyboardKey: {
    width: 45,
    height: 50,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  keyboardKeyDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  keyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
