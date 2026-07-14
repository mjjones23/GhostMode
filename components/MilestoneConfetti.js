import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#e9d5ff', '#f0abfc', '#ffffff'];
const PARTICLE_COUNT = 28;

function makeParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: Math.random() * 100,
    size: 5 + Math.random() * 7,
    delay: Math.random() * 400,
    drift: (Math.random() - 0.5) * 80,
    duration: 1400 + Math.random() * 900,
  }));
}

function ConfettiParticle({ particle, active }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return undefined;

    translateY.setValue(-20);
    translateX.setValue(0);
    opacity.setValue(0);
    rotate.setValue(0);

    const animation = Animated.sequence([
      Animated.delay(particle.delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 220 + Math.random() * 80,
          duration: particle.duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: particle.drift,
          duration: particle.duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: particle.duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(particle.duration * 0.55),
          Animated.timing(opacity, {
            toValue: 0,
            duration: particle.duration * 0.45,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [active, particle, opacity, rotate, translateX, translateY]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${180 + Math.random() * 360}deg`],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: `${particle.left}%`,
          width: particle.size,
          height: particle.size * 1.6,
          backgroundColor: particle.color,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate: spin },
          ],
        },
      ]}
    />
  );
}

/** Lightweight purple confetti — no extra packages. */
export default function MilestoneConfetti({ active }) {
  const particles = useMemo(() => makeParticles(), []);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {particles.map((particle) => (
        <ConfettiParticle key={particle.id} particle={particle} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 20,
  },
  particle: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
