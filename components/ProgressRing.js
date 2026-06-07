import { StyleSheet, Text, View } from 'react-native';

const GOAL_DAYS = 30;

export default function ProgressRing({ day, size = 200, strokeWidth = 12 }) {
  const progress = Math.min(day / GOAL_DAYS, 1);
  const angle = progress * 360;
  const half = size / 2;

  const rightRotation = Math.min(angle, 180) - 90;
  const leftRotation = angle > 180 ? angle - 180 - 90 : -90;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
          },
        ]}
      />

      <View style={[styles.halfClip, { left: half, width: half, height: size }]}>
        <View
          style={[
            styles.arc,
            {
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: strokeWidth,
              left: -half,
              transform: [{ rotate: `${rightRotation}deg` }],
            },
          ]}
        />
      </View>

      {angle > 180 && (
        <View style={[styles.halfClip, { left: 0, width: half, height: size }]}>
          <View
            style={[
              styles.arc,
              {
                width: size,
                height: size,
                borderRadius: half,
                borderWidth: strokeWidth,
                transform: [{ rotate: `${leftRotation}deg` }],
              },
            ]}
          />
        </View>
      )}

      <View style={styles.center}>
        <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
        <Text style={styles.goalLabel}>of {GOAL_DAYS} days</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  halfClip: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  arc: {
    position: 'absolute',
    borderColor: '#7c3aed',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  goalLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
