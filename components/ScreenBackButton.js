import { Pressable, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GhostColors, ghostPressable, ghostPressedStyle } from '../utils/screenCommon';

export default function ScreenBackButton({ onPress, label = 'Back', style }) {
  const navigation = useNavigation();

  return (
    <Pressable
      style={({ pressed }) => [styles.backRow, style, pressed && ghostPressedStyle]}
      onPress={onPress ?? (() => navigation.goBack())}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="chevron-back" size={22} color={GhostColors.accent} />
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
    ...ghostPressable,
  },
  backText: {
    color: GhostColors.accent,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
});
