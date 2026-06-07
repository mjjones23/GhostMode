import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

export default function LaunchLoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.glowOrb} />
      <Image
        source={require('../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Ghost Mode"
      />
      <ActivityIndicator color="#a78bfa" size="large" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  logo: {
    width: 220,
    height: 220,
  },
  loader: {
    marginTop: 28,
  },
});
