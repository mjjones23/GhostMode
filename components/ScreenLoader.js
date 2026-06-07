import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GhostColors } from '../utils/screenCommon';

export default function ScreenLoader({ message = 'Loading...', inline = false }) {
  return (
    <View style={[styles.wrap, inline && styles.inlineWrap]}>
      <ActivityIndicator color={GhostColors.primary} size={inline ? 'small' : 'large'} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inlineWrap: {
    flex: 0,
    paddingVertical: 32,
    width: '100%',
  },
  message: {
    marginTop: 14,
    color: GhostColors.textSoft,
    fontSize: 15,
    fontWeight: '500',
  },
});
