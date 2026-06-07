import { useCallback, useState } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressRing from '../components/ProgressRing';
import { useStreak } from '../context/StreakContext';
import { usePremiumGate } from '../hooks/usePremiumGate';
import {
  getTodaysHealingMessage,
  refreshTodaysHealingMessage,
  loadReasons,
  getTodaysCheckIn,
} from '../utils/storage';
import { getCheckInMoodMeta } from '../content/dailyCheckInContent';
import { navigateToAppScreen } from '../navigation/navigationHelpers';

const QUICK_ACTIONS = [
  {
    id: 'emergency',
    label: 'Emergency Mode',
    icon: 'alert-circle',
    color: '#fca5a5',
    bg: 'rgba(220, 38, 38, 0.15)',
    border: 'rgba(248, 113, 113, 0.35)',
    fullWidth: true,
    route: 'Emergency',
  },
  {
    id: 'coach',
    label: 'AI Coach',
    icon: 'chatbubble-ellipses',
    color: '#c7d2fe',
    bg: 'rgba(99, 102, 241, 0.18)',
    border: 'rgba(129, 140, 248, 0.35)',
    route: 'Coach',
    premium: true,
  },
  {
    id: 'journal',
    label: 'Daily Journal',
    icon: 'book',
    color: 'rgba(255,255,255,0.9)',
    bg: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.1)',
    route: 'Journal',
  },
  {
    id: 'mood',
    label: 'Log Mood',
    icon: 'heart',
    color: '#e9d5ff',
    bg: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(196, 181, 253, 0.3)',
    route: 'Mood',
  },
  {
    id: 'premium',
    label: 'Go Premium',
    icon: 'diamond',
    color: '#ffffff',
    bg: 'rgba(124, 58, 237, 0.3)',
    border: 'rgba(196, 181, 253, 0.45)',
    route: 'Paywall',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    color: 'rgba(255,255,255,0.75)',
    bg: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.1)',
    route: 'Settings',
  },
];

function QuickAction({ action, onPress, variant = 'row', showPremiumLock = false }) {
  const isGrid = variant === 'grid';

  return (
    <Pressable
      style={({ pressed }) => [
        isGrid ? styles.quickActionGrid : styles.quickAction,
        action.fullWidth && styles.quickActionFull,
        {
          backgroundColor: action.bg,
          borderColor: action.border,
        },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          isGrid ? styles.quickIconWrapGrid : styles.quickIconWrap,
          action.fullWidth && styles.quickIconWrapLarge,
        ]}
      >
        <Ionicons
          name={action.icon}
          size={action.fullWidth ? 22 : isGrid ? 22 : 20}
          color={action.color}
        />
      </View>
      <Text
        style={[
          isGrid ? styles.quickLabelGrid : styles.quickLabel,
          action.fullWidth && styles.quickLabelLarge,
          { color: action.color },
        ]}
      >
        {action.label}
      </Text>
      {showPremiumLock && (
        <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.45)" />
      )}
      {!isGrid && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color="rgba(255,255,255,0.25)"
          style={styles.quickChevron}
        />
      )}
    </Pressable>
  );
}

export default function StreakTrackerScreen() {
  const navigation = useNavigation();
  const { streakDay, refreshStreak } = useStreak();
  const { isPremium, requirePremium } = usePremiumGate();
  const [healingMessage, setHealingMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [messageLoading, setMessageLoading] = useState(true);
  const [refreshingMessage, setRefreshingMessage] = useState(false);
  const [reasonCount, setReasonCount] = useState(0);
  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(true);

  const loadHealingMessage = useCallback(async () => {
    const result = await getTodaysHealingMessage();
    setHealingMessage(result.message);
    setMessageIndex(result.messageIndex);
    setMessageLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStreak();
      loadHealingMessage();
      loadReasons().then((reasons) => setReasonCount(reasons.length));
      setCheckInLoading(true);
      getTodaysCheckIn()
        .then((checkIn) => setTodayCheckIn(checkIn))
        .finally(() => setCheckInLoading(false));
    }, [refreshStreak, loadHealingMessage])
  );

  const handleNewMessage = async () => {
    if (refreshingMessage) return;

    setRefreshingMessage(true);
    try {
      const result = await refreshTodaysHealingMessage(messageIndex);
      setHealingMessage(result.message);
      setMessageIndex(result.messageIndex);
    } finally {
      setRefreshingMessage(false);
    }
  };

  const navigateToScreen = useCallback(
    (screen, params) => {
      navigateToAppScreen(navigation, screen, params);
    },
    [navigation]
  );

  const openDailyCheckIn = useCallback(() => {
    navigateToScreen('DailyCheckIn');
  }, [navigateToScreen]);

  const handleAction = (route, premium = false) => {
    if (premium) {
      requirePremium(() => navigateToScreen(route));
      return;
    }
    navigateToScreen(route);
  };

  const emergency = QUICK_ACTIONS.find((a) => a.id === 'emergency');
  const gridActions = QUICK_ACTIONS.filter((a) => !a.fullWidth && a.id !== 'settings');
  const settings = QUICK_ACTIONS.find((a) => a.id === 'settings');
  const todayMoodMeta = todayCheckIn ? getCheckInMoodMeta(todayCheckIn.mood) : null;

  return (
    <GhostSafeArea style={styles.safe} tabBar>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ghost Mode</Text>
          <Text style={styles.headerSubtitle}>Your healing dashboard</Text>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakTop}>
            <View>
              <Text style={styles.streakLabel}>No-contact streak</Text>
              <Text style={styles.dayCount}>Day {streakDay}</Text>
              <Text style={styles.healingSubtitle}>You are healing.</Text>
            </View>
          </View>
          <View style={styles.ringWrap}>
            <ProgressRing day={streakDay} size={168} strokeWidth={10} />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.almostTextedButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigateToScreen('CrisisLock')}
        >
          <Ionicons
            name="shield-outline"
            size={18}
            color="#c4b5fd"
            style={styles.almostTextedIcon}
          />
          <Text style={styles.almostTextedText}>I Almost Texted Them</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.textedButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigateToScreen('StreakReset')}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={16}
            color="rgba(255, 255, 255, 0.45)"
            style={styles.textedIcon}
          />
          <Text style={styles.textedButtonText}>I Texted Them</Text>
        </Pressable>

        <View style={styles.healingCard}>
          <View style={styles.healingHeader}>
            <View style={styles.healingTitleRow}>
              <Ionicons name="sparkles" size={16} color="#c4b5fd" />
              <Text style={styles.healingLabel}>Daily healing message</Text>
            </View>
          </View>

          {messageLoading ? (
            <ActivityIndicator color="#a78bfa" style={styles.messageLoader} />
          ) : (
            <Text style={styles.healingText}>{healingMessage}</Text>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.newMessageButton,
              refreshingMessage && styles.newMessageButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNewMessage}
            disabled={messageLoading || refreshingMessage}
          >
            <Ionicons
              name="refresh"
              size={16}
              color="#c4b5fd"
              style={styles.newMessageIcon}
            />
            <Text style={styles.newMessageText}>
              {refreshingMessage ? 'Loading...' : 'New Message'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.moodCard,
            todayMoodMeta
              ? {
                  borderColor: todayMoodMeta.color,
                }
              : styles.moodCardEmpty,
            pressed && styles.buttonPressed,
          ]}
          onPress={openDailyCheckIn}
        >
          <View style={styles.moodCardHeader}>
            <View style={styles.moodTitleRow}>
              <Ionicons name="heart" size={16} color="#e9d5ff" />
              <Text style={styles.moodCardTitle}>Today&apos;s Mood</Text>
            </View>
            {!checkInLoading && !todayMoodMeta && (
              <View style={styles.moodCheckInPill}>
                <Text style={styles.moodCheckInPillText}>Check in</Text>
              </View>
            )}
          </View>

          <View style={styles.moodCardBody}>
            <View
              style={[
                styles.moodIconWrap,
                todayMoodMeta && {
                  borderColor: todayMoodMeta.color,
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                },
              ]}
            >
              {checkInLoading ? (
                <ActivityIndicator color="#e9d5ff" size="small" />
              ) : (
                <Text style={styles.moodEmoji}>
                  {todayMoodMeta?.emoji ?? '🌙'}
                </Text>
              )}
            </View>
            <View style={styles.moodCardContent}>
              <Text
                style={[
                  styles.moodCardValue,
                  todayMoodMeta
                    ? { color: todayMoodMeta.color }
                    : styles.moodCardValueEmpty,
                ]}
              >
                {checkInLoading
                  ? 'Loading...'
                  : todayMoodMeta
                    ? todayMoodMeta.label
                    : 'How are you feeling?'}
              </Text>
              <Text style={styles.moodCardHint}>
                {todayMoodMeta
                  ? 'Tap to update your check-in'
                  : 'Tap to log your mood for today'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#e9d5ff" />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.reasonsCard, pressed && styles.buttonPressed]}
          onPress={() => navigateToScreen('Reasons')}
        >
          <View style={styles.reasonsCardTop}>
            <View style={styles.reasonsIconWrap}>
              <Ionicons name="shield-checkmark" size={22} color="#c4b5fd" />
            </View>
            <View style={styles.reasonsCardContent}>
              <Text style={styles.reasonsCardTitle}>My Reasons</Text>
              <Text style={styles.reasonsCardSubtitle}>
                {reasonCount > 0
                  ? `${reasonCount} saved · Tap to view or add more`
                  : 'Add reasons your future self needs to remember.'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(255,255,255,0.35)"
            />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.insightsCard,
            pressed && styles.buttonPressed,
          ]}
          onPress={() =>
            requirePremium(() => navigateToScreen('ProgressInsights'))
          }
        >
          <View style={styles.insightsCardTop}>
            <View style={styles.insightsIconWrap}>
              <Ionicons name="stats-chart" size={22} color="#c4b5fd" />
            </View>
            <View style={styles.insightsCardContent}>
              <View style={styles.insightsTitleRow}>
                <Text style={styles.insightsCardTitle}>Progress Insights</Text>
                {!isPremium && (
                  <Ionicons name="lock-closed" size={14} color="#c4b5fd" />
                )}
              </View>
              <Text style={styles.insightsCardSubtitle}>
                Streak, journal, moods, and a message for you
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(255,255,255,0.35)"
            />
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>Quick actions</Text>

        {emergency && (
          <QuickAction
            action={emergency}
            onPress={() => handleAction(emergency.route)}
          />
        )}

        <View style={styles.actionGrid}>
          {gridActions.map((action) => (
            <QuickAction
              key={action.id}
              action={action}
              variant="grid"
              showPremiumLock={action.premium && !isPremium}
              onPress={() => handleAction(action.route, action.premium)}
            />
          ))}
        </View>

        {settings && (
          <QuickAction
            action={settings}
            onPress={() => handleAction(settings.route)}
          />
        )}
      </ScrollView>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 15,
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    marginBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  streakTop: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  dayCount: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  healingSubtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  ringWrap: {
    marginTop: 12,
  },
  almostTextedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.45)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {},
      web: { cursor: 'pointer' },
    }),
  },
  almostTextedIcon: {
    marginRight: 8,
  },
  almostTextedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  textedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  textedIcon: {
    marginRight: 6,
  },
  textedButtonText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontWeight: '600',
  },
  healingCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.22)',
    marginBottom: 24,
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
  healingHeader: {
    marginBottom: 12,
  },
  healingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healingLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  healingText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 17,
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  messageLoader: {
    marginVertical: 16,
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.35)',
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  newMessageButtonDisabled: {
    opacity: 0.55,
  },
  newMessageIcon: {
    marginRight: 6,
  },
  newMessageText: {
    color: '#c4b5fd',
    fontSize: 14,
    fontWeight: '700',
  },
  moodCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(196, 181, 253, 0.55)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
      default: {},
      web: { cursor: 'pointer' },
    }),
  },
  moodCardEmpty: {
    backgroundColor: 'rgba(124, 58, 237, 0.28)',
    borderColor: '#c4b5fd',
  },
  moodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  moodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodCardTitle: {
    color: '#e9d5ff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  moodCheckInPill: {
    backgroundColor: '#7c3aed',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  moodCheckInPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  moodCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(196, 181, 253, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodCardContent: {
    flex: 1,
  },
  moodCardValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  moodCardValueEmpty: {
    color: '#ffffff',
  },
  moodCardHint: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 14,
    fontWeight: '600',
  },
  reasonsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.22)',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
      web: { cursor: 'pointer' },
    }),
  },
  reasonsCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  reasonsCardContent: {
    flex: 1,
    marginRight: 8,
  },
  reasonsCardTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  reasonsCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    lineHeight: 18,
  },
  insightsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.22)',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
      web: { cursor: 'pointer' },
    }),
  },
  insightsCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  insightsCardContent: {
    flex: 1,
    marginRight: 8,
  },
  insightsCardTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  insightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  insightsCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    width: '100%',
  },
  quickActionGrid: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  quickActionFull: {
    width: '100%',
    paddingVertical: 16,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickIconWrapGrid: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickIconWrapLarge: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  quickLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  quickLabelGrid: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  quickLabelLarge: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickChevron: {
    marginLeft: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
