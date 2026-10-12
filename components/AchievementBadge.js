import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateKey } from '../utils/dateMath';

const SIZES = {
  sm: { medal: 52, icon: 22, lock: 16 },
  md: { medal: 64, icon: 28, lock: 18 },
  lg: { medal: 88, icon: 40, lock: 22 },
};

export function AchievementMedal({ badge, size = 'md' }) {
  const dims = SIZES[size] || SIZES.md;
  const { colors, unlocked } = badge;

  return (
    <View style={{ width: dims.medal, height: dims.medal }}>
      <View
        style={[
          styles.medal,
          {
            width: dims.medal,
            height: dims.medal,
            borderRadius: dims.medal / 2,
          },
          unlocked
            ? {
                backgroundColor: colors.fill,
                borderColor: colors.ring,
                ...Platform.select({
                  ios: {
                    shadowColor: colors.glow,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: dims.medal / 5,
                  },
                  android: { elevation: 6 },
                  default: {},
                }),
              }
            : styles.medalLocked,
        ]}
      >
        <View
          style={[
            styles.innerRing,
            {
              borderRadius: dims.medal / 2,
              borderColor: unlocked ? `${colors.ring}55` : 'rgba(255, 255, 255, 0.06)',
            },
          ]}
        />
        <Ionicons
          name={badge.icon}
          size={dims.icon}
          color={unlocked ? colors.icon : 'rgba(255, 255, 255, 0.22)'}
        />
      </View>

      {!unlocked && (
        <View
          style={[
            styles.lockBadge,
            { width: dims.lock + 6, height: dims.lock + 6, borderRadius: (dims.lock + 6) / 2 },
          ]}
        >
          <Ionicons name="lock-closed" size={dims.lock - 6} color="rgba(196, 181, 253, 0.8)" />
        </View>
      )}

      {unlocked && badge.crown && (
        <View style={styles.crownBadge}>
          <Ionicons name="star" size={12} color="#fde68a" />
        </View>
      )}
    </View>
  );
}

export default function AchievementBadge({ badge, size = 'md', compact = false }) {
  const progressPercent = Math.round((badge.progress || 0) * 100);

  return (
    <View
      style={[styles.container, compact && styles.containerCompact]}
      accessible
      accessibilityLabel={
        badge.unlocked
          ? `${badge.title}, ${badge.subtitle}, earned ${formatDateKey(badge.unlockedOn)}`
          : `${badge.title}, ${badge.subtitle}, locked, ${progressPercent} percent`
      }
    >
      <AchievementMedal badge={badge} size={size} />
      <Text
        style={[styles.title, !badge.unlocked && styles.titleLocked]}
        numberOfLines={2}
      >
        {badge.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {badge.subtitle}
      </Text>

      {badge.unlocked ? (
        <Text style={styles.earned} numberOfLines={1}>
          {formatDateKey(badge.unlockedOn, { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      ) : (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(4, progressPercent)}%` }]} />
          </View>
          {!compact && badge.progressLabel && (
            <Text style={styles.progressLabel} numberOfLines={1}>
              {badge.progressLabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '31%',
    minWidth: 96,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.16)',
  },
  containerCompact: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 4,
    minWidth: 84,
  },
  medal: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  medalLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  innerRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 5,
    borderWidth: 1,
  },
  lockBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1530',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  crownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b2a0a',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.6)',
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },
  titleLocked: {
    color: 'rgba(255, 255, 255, 0.55)',
  },
  subtitle: {
    color: 'rgba(196, 181, 253, 0.7)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  earned: {
    color: 'rgba(134, 239, 172, 0.85)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  progressWrap: {
    width: '80%',
    alignItems: 'center',
    marginTop: 8,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#7c3aed',
  },
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
  },
});
