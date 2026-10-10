import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTodayDateKey } from '../utils/storage';
import {
  getPlanProgress,
  getTodaysRecoveryPlan,
  toggleRecoveryPlanActivity,
} from '../utils/dailyRecoveryPlan';
import { PLAN_COMPLETE_MESSAGE } from '../content/dailyRecoveryPlan';

function PlanActivityRow({ activity, onToggle, onOpen }) {
  const { completed, categoryMeta } = activity;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        completed && styles.rowCompleted,
        pressed && styles.pressed,
      ]}
      onPress={() => onToggle(activity.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={activity.title}
      accessibilityHint={completed ? 'Marks this activity as not done' : 'Marks this activity as done'}
    >
      <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
        {completed && <Ionicons name="checkmark" size={16} color="#ffffff" />}
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowTitleLine}>
          <View style={[styles.iconWrap, { backgroundColor: categoryMeta.bg }]}>
            <Ionicons name={activity.icon} size={14} color={categoryMeta.color} />
          </View>
          <Text style={[styles.categoryLabel, { color: categoryMeta.color }]}>
            {categoryMeta.label}
          </Text>
        </View>
        <Text style={[styles.rowTitle, completed && styles.rowTitleCompleted]}>
          {activity.title}
        </Text>
        <Text style={styles.rowDescription}>{activity.description}</Text>
      </View>

      {activity.route && (
        <Pressable
          style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
          onPress={() => onOpen(activity.route)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Open for ${activity.title}`}
        >
          <Text style={styles.openText}>Open</Text>
          <Ionicons name="chevron-forward" size={12} color="#c4b5fd" />
        </Pressable>
      )}
    </Pressable>
  );
}

export default function DailyRecoveryPlanCard({ refreshKey, onOpenActivity }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const planDateRef = useRef(null);

  const loadPlan = useCallback(async () => {
    try {
      const result = await getTodaysRecoveryPlan();
      planDateRef.current = result.date;
      setPlan(result);
    } catch {
      // Keep the last good plan on screen; next focus retries.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [loadPlan])
  );

  useEffect(() => {
    loadPlan();
  }, [refreshKey, loadPlan]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && planDateRef.current !== getTodayDateKey()) {
        loadPlan();
      }
    });
    return () => subscription.remove();
  }, [loadPlan]);

  const handleToggle = useCallback(async (activityId) => {
    setPlan((current) => {
      if (!current) return current;
      const activities = current.activities.map((activity) =>
        activity.id === activityId
          ? { ...activity, completed: !activity.completed }
          : activity
      );
      const completed = Object.fromEntries(
        activities.filter((a) => a.completed).map((a) => [a.id, true])
      );
      return {
        ...current,
        activities,
        progress: getPlanProgress({ activityIds: current.activityIds, completed }),
      };
    });

    try {
      const result = await toggleRecoveryPlanActivity(activityId);
      planDateRef.current = result.date;
      setPlan(result);
    } catch {
      loadPlan();
    }
  }, [loadPlan]);

  const progress = plan?.progress;
  const stage = plan?.stageMeta;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="list-circle" size={18} color="#c4b5fd" />
          <Text style={styles.title}>Today's Recovery Plan</Text>
        </View>
        {plan && stage && (
          <View style={styles.stagePill}>
            <Text style={styles.stagePillText}>
              Day {plan.streakDay} · {stage.label}
            </Text>
          </View>
        )}
      </View>

      {loading && !plan ? (
        <ActivityIndicator color="#a78bfa" style={styles.loader} />
      ) : plan ? (
        <>
          <Text style={styles.focus}>{stage?.focus}</Text>
          {plan.mood && (
            <Text style={styles.tailored}>Tailored to how you're feeling today.</Text>
          )}

          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {progress.completedCount} of {progress.total} done
            </Text>
            <Text style={styles.progressPercent}>{progress.percent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
          </View>

          <View style={styles.list}>
            {plan.activities.map((activity) => (
              <PlanActivityRow
                key={activity.id}
                activity={activity}
                onToggle={handleToggle}
                onOpen={onOpenActivity}
              />
            ))}
          </View>

          {progress.isComplete && (
            <View style={styles.completeBanner}>
              <Ionicons name="sparkles" size={16} color="#fde68a" />
              <Text style={styles.completeText}>{PLAN_COMPLETE_MESSAGE}</Text>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.focus}>
          Your plan could not load. Leave Home and come back to try again.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
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
    marginBottom: 10,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  title: {
    color: '#e9d5ff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  stagePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.32)',
  },
  stagePillText: {
    color: '#c4b5fd',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  loader: {
    marginVertical: 20,
  },
  focus: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  tailored: {
    color: 'rgba(196, 181, 253, 0.75)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    fontWeight: '700',
  },
  progressPercent: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#a78bfa',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  rowCompleted: {
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(196, 181, 253, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#7c3aed',
    borderColor: '#a78bfa',
  },
  rowContent: {
    flex: 1,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  rowTitleCompleted: {
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'line-through',
  },
  rowDescription: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    lineHeight: 18,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    alignSelf: 'center',
  },
  openText: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(253, 230, 138, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.25)',
  },
  completeText: {
    flex: 1,
    color: '#fde68a',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
