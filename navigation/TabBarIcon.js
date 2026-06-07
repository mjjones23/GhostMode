import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabBarIcon({ name, focused, color }) {
  return (
    <View style={[styles.wrap, focused && styles.wrapActive]}>
      {focused && <View style={styles.glow} />}
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
  },
  wrapActive: {
    transform: [{ scale: 1.05 }],
  },
  glow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#a78bfa',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
});
