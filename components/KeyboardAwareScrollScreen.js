import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { TAB_BAR_KEYBOARD_OFFSET } from '../utils/keyboard';

/**
 * Scrollable screen wrapper with keyboard avoidance on iOS.
 * Drag the scroll area to dismiss the keyboard (keyboardDismissMode="on-drag").
 */
export default function KeyboardAwareScrollScreen({
  children,
  style,
  contentContainerStyle,
  tabBar = false,
  keyboardVerticalOffset,
  scrollRef,
  centerContent = false,
  ...scrollProps
}) {
  const offset =
    keyboardVerticalOffset ?? (tabBar ? TAB_BAR_KEYBOARD_OFFSET : 0);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={offset}
    >
      <View style={styles.scrollWrap}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[
            centerContent && styles.centerContent,
            tabBar && styles.tabBarContent,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollWrap: {
    flex: 1,
    minHeight: 0,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  tabBarContent: {
    paddingBottom: 8,
  },
});
