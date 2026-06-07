import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostColors } from '../utils/screenCommon';

/**
 * Safe area wrapper for iPhone notches and home indicators.
 * Tab screens: pass tabBar so bottom inset is handled by the tab bar.
 */
export default function GhostSafeArea({ children, style, tabBar = false }) {
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: GhostColors.background }, style]}
      edges={tabBar ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}
    >
      {children}
    </SafeAreaView>
  );
}
