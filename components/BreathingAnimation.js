import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, Platform } from 'react-native';

const PHASES = [
  { key: 'inhale', label: 'Breathe in', duration: 4000, scale: 1.12 },
  { key: 'hold', label: 'Hold', duration: 4000, scale: 1.12 },
  { key: 'exhale', label: 'Breathe out', duration: 6000, scale: 0.88 },
];

export default function BreathingAnimation() {
  const scale = useRef(new Animated.Value(0.92)).current;
  const glow = useRef(new Animated.Value(0.35)).current;
  const [phaseLabel, setPhaseLabel] = useState(PHASES[0].label);
  const runningRef = useRef(true);

  useEffect(() => {
    runningRef.current = true;
    let phaseIndex = 0;

    const runPhase = () => {
      if (!runningRef.current) return;

      const phase = PHASES[phaseIndex];
      setPhaseLabel(phase.label);

      Animated.parallel([
        Animated.timing(scale, {
          toValue: phase.scale,
          duration: phase.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: phase.key === 'hold' ? 0.65 : phase.key === 'inhale' ? 0.55 : 0.25,
          duration: phase.duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished || !runningRef.current) return;
        phaseIndex = (phaseIndex + 1) % PHASES.length;
        runPhase();
      });
    };

    runPhase();

    return () => {
      runningRef.current = false;
      scale.stopAnimation();
      glow.stopAnimation();
    };
  }, [glow, scale]);

  return (
    <View style={styles.wrap}>
      <View style={styles.ringOuter}>
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glow,
              transform: [{ scale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.ringInner}>
            <Text style={styles.phaseLabel}>{phaseLabel}</Text>
          </View>
        </Animated.View>
      </View>
      <Text style={styles.hint}>4 · 4 · 6 breathing</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  ringOuter: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.45)',
    ...Platform.select({
      ios: {
        shadowColor: '#a78bfa',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 24,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  ring: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.55)',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(10, 10, 18, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  phaseLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    marginTop: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
