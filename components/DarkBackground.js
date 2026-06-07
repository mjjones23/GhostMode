import { StyleSheet, View } from 'react-native';

export default function DarkBackground({ children }) {
  return (
    <View style={styles.root}>
      <View style={styles.bgBase} />
      <View style={styles.glowOrbTop} />
      <View style={styles.glowOrbBottom} />
      <View style={styles.vignette} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050508',
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a12',
  },
  glowOrbTop: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});
