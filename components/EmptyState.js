import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GhostColors, GhostSpacing } from '../utils/screenCommon';

export default function EmptyState({
  icon = 'sparkles-outline',
  title = 'Nothing here yet',
  message = 'Your saved items will show up here.',
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={28} color={GhostColors.primary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: GhostSpacing.maxContentWidth,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: GhostColors.cardBorder,
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
  },
  title: {
    color: GhostColors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    color: GhostColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
