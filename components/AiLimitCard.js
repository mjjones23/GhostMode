import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buildQuotaLimitCopy } from '../utils/aiQuota';

export default function AiLimitCard({ quota, onUpgrade, onDismiss }) {
  const copy = buildQuotaLimitCopy(quota);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles-outline" size={18} color="#c4b5fd" />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
      </View>
      <Text style={styles.body}>{copy.body}</Text>
      {copy.resetLabel ? (
        <Text style={styles.reset}>Resets around {copy.resetLabel}</Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={onUpgrade}
          accessibilityRole="button"
          accessibilityLabel={copy.upgradeLabel}
        >
          <Text style={styles.primaryText}>{copy.upgradeLabel}</Text>
        </Pressable>
        {onDismiss ? (
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          >
            <Text style={styles.secondaryText}>Not now</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.18)',
  },
  title: {
    color: '#f5f3ff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  body: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reset: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
});
