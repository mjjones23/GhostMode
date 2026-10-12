import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AchievementBadge from './AchievementBadge';

export default function AchievementsSummaryCard({ achievements, onViewAll }) {
  if (!achievements) return null;

  const { level, nextUp, unlockedCount } = achievements;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="ribbon" size={16} color="#e9d5ff" />
          <Text style={styles.title}>Achievements & Level</Text>
        </View>
        <Text style={styles.count}>{unlockedCount} earned</Text>
      </View>

      <View style={styles.levelRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{level.level}</Text>
        </View>
        <View style={styles.levelContent}>
          <Text style={styles.levelName}>{level.title}</Text>
          <View style={styles.pointsTrack}>
            <View
              style={[styles.pointsFill, { width: `${Math.max(3, Math.round(level.progress * 100))}%` }]}
            />
          </View>
          <Text style={styles.pointsLabel}>
            {level.points.toLocaleString('en-US')} pts · {level.pointsToNext.toLocaleString('en-US')} to
            Level {level.level + 1}
          </Text>
        </View>
      </View>

      {nextUp.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Closest to unlocking</Text>
          <View style={styles.badgesRow}>
            {nextUp.map((badge) => (
              <AchievementBadge key={badge.id} badge={badge} size="sm" compact />
            ))}
          </View>
        </>
      )}

      <Pressable
        style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
        onPress={onViewAll}
        accessibilityRole="button"
        accessibilityLabel="View all achievements"
      >
        <Text style={styles.viewAllText}>View all achievements</Text>
        <Ionicons name="chevron-forward" size={14} color="#c4b5fd" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#e9d5ff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  count: {
    color: 'rgba(196, 181, 253, 0.75)',
    fontSize: 12,
    fontWeight: '700',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    borderWidth: 2,
    borderColor: '#a78bfa',
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  levelNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  levelContent: {
    flex: 1,
  },
  levelName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  pointsTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  pointsFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#a78bfa',
  },
  pointsLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  sectionLabel: {
    color: 'rgba(196, 181, 253, 0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  viewAllText: {
    color: '#e9d5ff',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
