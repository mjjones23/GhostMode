import { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GhostSafeArea from '../components/GhostSafeArea';
import ScreenBackButton from '../components/ScreenBackButton';
import ScreenLoader from '../components/ScreenLoader';
import AchievementBadge from '../components/AchievementBadge';
import { evaluateAchievements } from '../utils/achievements';
import { LEVEL_ENCOURAGEMENT, LEVEL_POINTS } from '../content/achievements';

const POINT_RULES = [
  { label: 'Each no-contact day', points: LEVEL_POINTS.noContactDay },
  { label: 'Each plan activity', points: LEVEL_POINTS.planActivity },
  { label: 'Finishing a full plan', points: LEVEL_POINTS.planComplete },
  { label: 'Each day you journal', points: LEVEL_POINTS.journalDay },
  { label: 'Each day you check in', points: LEVEL_POINTS.checkInDay },
  { label: 'Each urge resisted', points: LEVEL_POINTS.urgeResisted },
  { label: 'Each achievement', points: LEVEL_POINTS.achievement },
];

function StatTile({ icon, label, value }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon} size={16} color="#c4b5fd" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      evaluateAchievements()
        .then((view) => {
          if (active) setAchievements(view);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  const level = achievements?.level;
  const encouragement = level
    ? LEVEL_ENCOURAGEMENT[(level.level - 1) % LEVEL_ENCOURAGEMENT.length]
    : '';

  return (
    <GhostSafeArea style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenBackButton />

        <View style={styles.pill}>
          <Text style={styles.pillText}>Your journey</Text>
        </View>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>
          Everything you earn here is yours to keep — hard days never take it away.
        </Text>

        {!achievements ? (
          <ScreenLoader message="Loading achievements..." inline />
        ) : (
          <>
            <View style={styles.levelCard}>
              <View style={styles.levelCircle}>
                <Text style={styles.levelCircleLabel}>Level</Text>
                <Text style={styles.levelCircleNumber}>{level.level}</Text>
              </View>
              <Text style={styles.levelName}>{level.name}</Text>
              <View style={styles.pointsTrack}>
                <View
                  style={[
                    styles.pointsFill,
                    { width: `${Math.max(3, Math.round(level.progress * 100))}%` },
                  ]}
                />
              </View>
              <Text style={styles.pointsLabel}>
                {level.points.toLocaleString('en-US')} points ·{' '}
                {level.pointsToNext.toLocaleString('en-US')} to Level {level.level + 1}
              </Text>
              <Text style={styles.encouragement}>{encouragement}</Text>
            </View>

            <View style={styles.statsRow}>
              <StatTile icon="flame" label="Current" value={`Day ${achievements.streakDay}`} />
              <StatTile icon="trending-up" label="Best streak" value={`${achievements.bestStreakDays}d`} />
              <StatTile icon="infinite" label="Lifetime days" value={achievements.lifetimeDays.toLocaleString('en-US')} />
              <StatTile icon="hand-left" label="Urges resisted" value={achievements.urgesResisted.toLocaleString('en-US')} />
            </View>

            {achievements.categories.map((category) => (
              <View key={category.id} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name={category.icon} size={16} color="#e9d5ff" />
                    <Text style={styles.sectionTitle}>{category.title}</Text>
                  </View>
                  <Text style={styles.sectionCount}>{category.unlockedCount} earned</Text>
                </View>
                <Text style={styles.sectionSubtitle}>{category.subtitle}</Text>
                {category.id === 'streak' && (
                  <Text style={styles.sectionNote}>
                    Anniversaries follow the calendar, so leap years always count correctly. A new
                    anniversary badge unlocks every year, forever.
                  </Text>
                )}
                <View style={styles.grid}>
                  {category.items.map((badge) => (
                    <AchievementBadge key={badge.id} badge={badge} />
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.rulesCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles" size={16} color="#e9d5ff" />
                <Text style={styles.sectionTitle}>How levels grow</Text>
              </View>
              <Text style={styles.rulesIntro}>
                Points only ever go up. If your streak restarts, your level, lifetime days, and every
                badge stay with you.
              </Text>
              {POINT_RULES.map((rule) => (
                <View key={rule.label} style={styles.ruleRow}>
                  <Text style={styles.ruleLabel}>{rule.label}</Text>
                  <Text style={styles.rulePoints}>+{rule.points}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  pill: {
    alignSelf: 'center',
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
    alignSelf: 'center',
  },
  levelCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  levelCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    borderWidth: 3,
    borderColor: '#a78bfa',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  levelCircleLabel: {
    color: '#e9d5ff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  levelCircleNumber: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    marginTop: -2,
  },
  levelName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  pointsTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  pointsFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#a78bfa',
  },
  pointsLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  encouragement: {
    color: '#c4b5fd',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.18)',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#e9d5ff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCount: {
    color: 'rgba(196, 181, 253, 0.75)',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginBottom: 12,
  },
  sectionNote: {
    color: 'rgba(196, 181, 253, 0.65)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: -6,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rulesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.18)',
  },
  rulesIntro: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  ruleLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
  },
  rulePoints: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '700',
  },
});
