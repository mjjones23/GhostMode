import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { formatJournalEntryDateTime } from '../utils/storage';
import { getCheckInMoodMeta, getMoodDisplayLabel } from '../content/dailyCheckInContent';
import { getProgressInsights } from '../utils/progressInsights';
import { usePremiumGate } from '../hooks/usePremiumGate';
import ScreenBackButton from '../components/ScreenBackButton';
import ScreenLoader from '../components/ScreenLoader';
import EmptyState from '../components/EmptyState';

function StatCard({ icon, label, value, iconBg, accent = '#c4b5fd' }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MoodBreakdownRow({ mood, count, isTop }) {
  const label = getMoodDisplayLabel(mood);
  const emoji = getCheckInMoodMeta(mood)?.emoji || '💭';

  return (
    <View style={[styles.moodRow, isTop && styles.moodRowTop]}>
      <Text style={styles.moodRowEmoji}>{emoji}</Text>
      <Text style={[styles.moodRowName, isTop && styles.moodRowNameTop]}>{label}</Text>
      <Text style={styles.moodRowCount}>
        {count} {count === 1 ? 'log' : 'logs'}
      </Text>
    </View>
  );
}

export default function ProgressInsightsScreen() {
  const navigation = useNavigation();
  const { isPremium, openPaywall } = usePremiumGate();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!isPremium) {
      openPaywall();
      navigation.goBack();
    }
  }, [isPremium, navigation, openPaywall]);

  useFocusEffect(
    useCallback(() => {
      if (!isPremium) return undefined;

      let active = true;

      (async () => {
        setLoading(true);
        const data = await getProgressInsights();
        if (active) {
          setInsights(data);
          setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [isPremium, navigation, openPaywall])
  );

  const moodCountLabel = insights?.mostCommonMood
    ? `Logged ${insights.mostCommonMood.count} ${
        insights.mostCommonMood.count === 1 ? 'time' : 'times'
      }`
    : null;

  const latestJournalDisplay = insights?.latestJournalDate
    ? formatJournalEntryDateTime(insights.latestJournalDate)
    : '—';

  if (!isPremium) {
    return null;
  }

  return (
    <GhostSafeArea style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenBackButton />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Your progress</Text>
        </View>

        <Text style={styles.title}>Progress Insights</Text>
        <Text style={styles.subtitle}>
          A snapshot of your healing journey — built from your saved data.
        </Text>

        {loading || !insights ? (
          <ScreenLoader message="Loading insights..." inline />
        ) : (
          <>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="bulb-outline" size={18} color="#c4b5fd" />
                <Text style={styles.insightLabel}>Insight</Text>
              </View>
              <Text style={styles.insightText}>{insights.insight}</Text>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                icon="flame"
                label="No-contact streak"
                value={`Day ${insights.streakDay}`}
                iconBg="rgba(124, 58, 237, 0.2)"
                accent="#a78bfa"
              />
              <StatCard
                icon="book"
                label="Journal entries"
                value={String(insights.journalCount)}
                iconBg="rgba(167, 139, 250, 0.15)"
                accent="#e9d5ff"
              />
              <StatCard
                icon="heart"
                label="Mood logs"
                value={String(insights.moodCount)}
                iconBg="rgba(248, 113, 113, 0.12)"
                accent="#fca5a5"
              />
            </View>

            <View style={styles.moodCard}>
              <Text style={styles.detailLabel}>Most common mood</Text>
              {insights.mostCommonMood ? (
                <>
                  <View style={styles.moodHero}>
                    <Text style={styles.moodHeroEmoji}>
                      {getCheckInMoodMeta(insights.mostCommonMood.mood)?.emoji || '💭'}
                    </Text>
                    <View style={styles.moodHeroText}>
                      <Text style={styles.moodHeroName}>
                        {getMoodDisplayLabel(insights.mostCommonMood.mood)}
                      </Text>
                      <Text style={styles.moodHeroCount}>{moodCountLabel}</Text>
                    </View>
                  </View>
                  {insights.moodBreakdown?.length > 1 && (
                    <View style={styles.moodBreakdown}>
                      {insights.moodBreakdown.map((item) => (
                        <MoodBreakdownRow
                          key={item.mood}
                          mood={item.mood}
                          count={item.count}
                          isTop={item.mood === insights.mostCommonMood.mood}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <EmptyState
                  icon="heart-outline"
                  title="No mood data yet"
                  message="Log a mood to see your most common feelings here."
                />
              )}
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Latest journal entry</Text>
              <Text style={styles.detailValue}>{latestJournalDisplay}</Text>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  backText: {
    color: '#c4b5fd',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  badge: {
    alignSelf: 'center',
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
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
  loader: {
    marginVertical: 40,
  },
  insightCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
    marginBottom: 20,
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
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  insightText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 17,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
    minHeight: 118,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  moodCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.2)',
    marginBottom: 16,
  },
  moodHero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  moodHeroEmoji: {
    fontSize: 40,
    marginRight: 14,
  },
  moodHeroText: {
    flex: 1,
  },
  moodHeroName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  moodHeroCount: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  moodEmpty: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  moodBreakdown: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  moodRowTop: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  moodRowEmoji: {
    fontSize: 18,
    width: 28,
  },
  moodRowName: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
  moodRowNameTop: {
    color: '#ffffff',
  },
  moodRowCount: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailValue: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
