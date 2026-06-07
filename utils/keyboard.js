import { Keyboard, Platform } from 'react-native';

/** Closes the on-screen keyboard. */
export function dismissKeyboard() {
  Keyboard.dismiss();
}

/** Extra space so KeyboardAvoidingView clears the bottom tab bar on iOS. */
export const TAB_BAR_KEYBOARD_OFFSET = Platform.OS === 'ios' ? 88 : 0;
