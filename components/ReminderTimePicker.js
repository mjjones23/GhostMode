import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  formatReminderTime,
  normalizeReminderTimeInput,
  reminderStringToDate,
} from '../utils/reminderNotifications';
import { dismissKeyboard } from '../utils/keyboard';

function resolveTimeChangeHandler({ onChange, onConfirm, onTimeChange }) {
  const handler = onChange ?? onConfirm ?? onTimeChange;
  return typeof handler === 'function' ? handler : null;
}

export default function ReminderTimePicker({
  value,
  onChange,
  onConfirm,
  onTimeChange,
  label = 'Reminder time',
  hint = 'Tap to set any time',
  disabled = false,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(() => reminderStringToDate(value));
  const [webDraft, setWebDraft] = useState(value);
  const emitTimeChange = resolveTimeChangeHandler({ onChange, onConfirm, onTimeChange });

  useEffect(() => {
    setDraftDate(reminderStringToDate(value));
    setWebDraft(value);
  }, [value]);

  const openPicker = () => {
    if (disabled) return;
    setDraftDate(reminderStringToDate(value));
    setWebDraft(value);
    setShowPicker(true);
  };

  const commitNativeTime = (date) => {
    dismissKeyboard();
    emitTimeChange?.(formatReminderTime(date));
    setShowPicker(false);
  };

  const commitWebTime = () => {
    dismissKeyboard();
    const normalized = normalizeReminderTimeInput(webDraft);
    if (normalized) {
      emitTimeChange?.(normalized);
      setShowPicker(false);
      return;
    }
    setWebDraft(value);
    setShowPicker(false);
  };

  const handleNativeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed' || !selectedDate) return;
      emitTimeChange?.(formatReminderTime(selectedDate));
      return;
    }

    if (selectedDate) {
      setDraftDate(selectedDate);
    }
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.timeCard,
          disabled && styles.timeCardDisabled,
          pressed && !disabled && styles.pressed,
        ]}
        onPress={openPicker}
        disabled={disabled}
      >
        <Text style={styles.timeLabel}>{label}</Text>
        <Text style={styles.timeValue}>{value}</Text>
        <Text style={styles.timeHint}>{hint}</Text>
      </Pressable>

      {Platform.OS === 'web' && showPicker && (
        <Modal transparent animationType="fade" visible={showPicker}>
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.backdropTap} onPress={dismissKeyboard} />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Set reminder time</Text>
              <TextInput
                style={styles.webInput}
                value={webDraft}
                onChangeText={setWebDraft}
                placeholder="9:00 PM"
                placeholderTextColor="rgba(255,255,255,0.35)"
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={commitWebTime}
              />
              <Text style={styles.webHint}>Use format like 9:00 PM or 7:30 AM</Text>
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={commitWebTime}
                >
                  <Text style={styles.modalButtonPrimaryText}>Set time</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide" visible={showPicker}>
          <View style={styles.modalBackdrop}>
            <View style={styles.iosSheet}>
              <View style={styles.iosToolbar}>
                <Pressable onPress={() => {
                  dismissKeyboard();
                  setShowPicker(false);
                }}>
                  <Text style={styles.toolbarCancel}>Cancel</Text>
                </Pressable>
                <Text style={styles.toolbarTitle}>Set time</Text>
                <Pressable onPress={() => commitNativeTime(draftDate)}>
                  <Text style={styles.toolbarDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draftDate}
                mode="time"
                display="spinner"
                onChange={handleNativeChange}
                themeVariant="dark"
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={draftDate}
          mode="time"
          display="default"
          onChange={handleNativeChange}
        />
      )}
    </>
  );
}

export function ReminderTimePickerModal({
  visible,
  value,
  onClose,
  onConfirm,
  onChange,
  onTimeChange,
}) {
  const [draftDate, setDraftDate] = useState(() => reminderStringToDate(value));
  const [webDraft, setWebDraft] = useState(value);
  const emitTimeChange = resolveTimeChangeHandler({ onChange, onConfirm, onTimeChange });
  const closePicker = typeof onClose === 'function' ? onClose : () => {};

  useEffect(() => {
    if (!visible) return;
    setDraftDate(reminderStringToDate(value));
    setWebDraft(value);
  }, [visible, value]);

  if (!visible) return null;

  if (Platform.OS === 'web') {
    return (
      <Modal transparent animationType="fade" visible={visible}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropTap} onPress={dismissKeyboard} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set reminder time</Text>
            <TextInput
              style={styles.webInput}
              value={webDraft}
              onChangeText={setWebDraft}
              placeholder="9:00 PM"
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={() => {
                const normalized = normalizeReminderTimeInput(webDraft);
                if (normalized) emitTimeChange?.(normalized);
                else closePicker();
                dismissKeyboard();
              }}
            />
            <Text style={styles.webHint}>Use format like 9:00 PM or 7:30 AM</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={closePicker}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  const normalized = normalizeReminderTimeInput(webDraft);
                  if (normalized) emitTimeChange?.(normalized);
                  else closePicker();
                  dismissKeyboard();
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>Set time</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={draftDate}
        mode="time"
        display="default"
        onChange={(event, selectedDate) => {
          if (event.type === 'dismissed' || !selectedDate) {
            closePicker();
            return;
          }
          emitTimeChange?.(formatReminderTime(selectedDate));
        }}
      />
    );
  }

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.iosSheet}>
          <View style={styles.iosToolbar}>
            <Pressable onPress={() => {
              dismissKeyboard();
              closePicker();
            }}>
              <Text style={styles.toolbarCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.toolbarTitle}>Set time</Text>
            <Pressable onPress={() => {
              emitTimeChange?.(formatReminderTime(draftDate));
              dismissKeyboard();
            }}>
              <Text style={styles.toolbarDone}>Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={draftDate}
            mode="time"
            display="spinner"
            onChange={(event, selectedDate) => {
              if (selectedDate) setDraftDate(selectedDate);
            }}
            themeVariant="dark"
            style={styles.iosPicker}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  timeCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
      web: { cursor: 'pointer' },
    }),
  },
  timeCardDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  timeLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  timeHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    margin: 24,
    marginBottom: '40%',
    backgroundColor: '#12121c',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    zIndex: 1,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  webInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  webHint: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: 'rgba(124, 58, 237, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.45)',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalButtonSecondaryText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  iosSheet: {
    backgroundColor: '#12121c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  iosToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  toolbarTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  toolbarCancel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 16,
  },
  toolbarDone: {
    color: '#c4b5fd',
    fontSize: 16,
    fontWeight: '700',
  },
  iosPicker: {
    height: 220,
  },
});
