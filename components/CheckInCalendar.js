import { StyleSheet, Text, View } from 'react-native';
import { getCheckInMoodMeta } from '../content/dailyCheckInContent';

export default function CheckInCalendar({ days = [], streak = 0 }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Check-in history</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakValue}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const meta = day.checkIn ? getCheckInMoodMeta(day.checkIn.mood) : null;
          const isCheckedIn = Boolean(day.checkIn);

          return (
            <View key={day.date} style={styles.dayCell}>
              <View
                style={[
                  styles.dayDot,
                  isCheckedIn && styles.dayDotChecked,
                  isCheckedIn && meta && { borderColor: meta.border, backgroundColor: meta.bg },
                ]}
              >
                {meta ? (
                  <Text style={styles.emoji}>{meta.emoji}</Text>
                ) : (
                  <View style={styles.emptyDot} />
                )}
              </View>
              <Text style={styles.dayLabel}>{day.dayLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.18)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  streakValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  streakLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
  },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 6,
  },
  dayDotChecked: {
    borderWidth: 1.5,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  emoji: {
    fontSize: 16,
  },
  dayLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    fontWeight: '600',
  },
});
