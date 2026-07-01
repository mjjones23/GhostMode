import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RecoveryActionsSection({ actions = [], onAction }) {
  if (!actions.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Recovery actions</Text>
      <View style={styles.chipRow}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [
              styles.chip,
              pressed && styles.chipPressed,
            ]}
            onPress={() => onAction?.(action)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Ionicons name={action.icon} size={14} color="#c4b5fd" />
            <Text style={styles.chipText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    marginBottom: 4,
    maxWidth: '92%',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    fontWeight: '600',
  },
});
