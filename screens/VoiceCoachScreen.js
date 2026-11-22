import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RecordingPresets,
  createAudioPlayer,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useNavigation } from '@react-navigation/native';
import GhostSafeArea from '../components/GhostSafeArea';
import ScreenBackButton from '../components/ScreenBackButton';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { hasEntitlement } from '../config/proEntitlements';
import { VOICE_COACH_ENABLED } from '../config/featureFlags';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { fetchCoachReply } from '../services/aiService';
import { clientShouldEnforceQuota } from '../utils/aiQuota';
import { CRISIS_REPLY } from '../utils/crisisSafety';
import {
  VOICE_MAX_SECONDS,
  VOICE_PRIVACY_NOTICE,
  getMicrophonePermission,
  requestCoachSpeechAudio,
  transcribeVoiceClip,
} from '../services/voiceCoachService';
import { pauseForSafety } from '../services/musicPlayerService';

export default function VoiceCoachScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { openPaywall } = usePremiumGate();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState(null);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const ttsPlayerRef = useRef(null);
  const maxTimerRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const permission = await getMicrophonePermission();
      if (!active) return;
      setPermissionGranted(permission.granted);
      if (permission.granted) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      }
    })();
    return () => {
      active = false;
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      try {
        ttsPlayerRef.current?.remove?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const ensureAccess = () => {
    if (!VOICE_COACH_ENABLED) {
      setError('Voice Coach is turned off in feature flags.');
      return false;
    }
    if (!hasEntitlement('VOICE_COACH', isPremium)) {
      openPaywall();
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    if (!ensureAccess()) return;
    setError(null);
    setTranscript('');
    setReply('');
    await pauseForSafety();

    if (!permissionGranted) {
      const permission = await getMicrophonePermission();
      setPermissionGranted(permission.granted);
      if (!permission.granted) {
        setError('Microphone permission is required.');
        return;
      }
    }

    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus('recording');
      maxTimerRef.current = setTimeout(() => {
        stopRecording();
      }, VOICE_MAX_SECONDS * 1000);
    } catch (err) {
      setError(err?.message || 'Could not start recording on this device.');
      setStatus('idle');
    }
  };

  const stopRecording = async () => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    try {
      await recorder.stop();
      setStatus('recorded');
    } catch (err) {
      setError(err?.message || 'Could not stop recording.');
      setStatus('idle');
    }
  };

  const sendToCoach = async () => {
    if (!ensureAccess()) return;
    const uri = recorder.uri;
    if (!uri) {
      setError('No recording found. Try recording again.');
      return;
    }

    setStatus('transcribing');
    setError(null);
    const stt = await transcribeVoiceClip({
      uri,
      accountId: user?.uid || null,
    });

    if (!stt.ok) {
      setStatus('recorded');
      setError(
        stt.unavailable
          ? `${stt.error} You can still use typed AI Coach for now.`
          : stt.error
      );
      return;
    }

    setTranscript(stt.transcript);
    if (stt.crisis || !stt.transcript) {
      setReply(stt.crisis ? CRISIS_REPLY : 'I could not understand that clip. Try again?');
      setStatus('done');
      return;
    }

    setStatus('coaching');
    const result = await fetchCoachReply({
      userText: stt.transcript,
      chatHistory: [
        { id: 'voice-user', sender: 'user', text: stt.transcript },
      ],
      accountId: user?.uid || null,
      enforceQuota: clientShouldEnforceQuota(isPremium),
    });

    if (result.quotaExceeded) {
      setError('Free AI limit reached. See Ghost Mode Pro for more coaching.');
      setStatus('done');
      navigation.navigate('Paywall');
      return;
    }

    const coachText = result.reply || 'I am here with you.';
    setReply(coachText);
    setStatus('done');

    if (!result.crisis) {
      const speech = await requestCoachSpeechAudio(coachText);
      if (speech.ok && speech.audioUrl) {
        try {
          ttsPlayerRef.current?.remove?.();
          ttsPlayerRef.current = createAudioPlayer(speech.audioUrl);
          ttsPlayerRef.current.play();
          setTtsAvailable(true);
        } catch {
          setTtsAvailable(false);
        }
      } else if (speech.unavailable) {
        setTtsAvailable(false);
      }
    }
  };

  return (
    <GhostSafeArea style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenBackButton />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Voice AI Coach</Text>
        </View>
        <Text style={styles.title}>Talk it out</Text>
        <Text style={styles.subtitle}>
          Record a short message (up to {VOICE_MAX_SECONDS}s). We transcribe it
          on the server, then coach you — without texting them.
        </Text>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Privacy</Text>
          <Text style={styles.privacyBody}>{VOICE_PRIVACY_NOTICE}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.controls}>
          {status !== 'recording' ? (
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={startRecording}
              accessibilityRole="button"
              accessibilityLabel="Start recording"
            >
              <Ionicons name="mic" size={22} color="#fff" />
              <Text style={styles.primaryText}>
                {recorderState.isRecording ? 'Recording…' : 'Start recording'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.stopRecButton, pressed && styles.pressed]}
              onPress={stopRecording}
              accessibilityRole="button"
              accessibilityLabel="Stop recording"
            >
              <Ionicons name="stop" size={22} color="#fff" />
              <Text style={styles.primaryText}>Stop</Text>
            </Pressable>
          )}

          {status === 'recorded' || status === 'done' ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={sendToCoach}
              accessibilityRole="button"
              accessibilityLabel="Send recording to coach"
            >
              <Text style={styles.secondaryText}>Send to Coach</Text>
            </Pressable>
          ) : null}

          {(status === 'transcribing' || status === 'coaching') && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#c4b5fd" />
              <Text style={styles.loadingText}>
                {status === 'transcribing' ? 'Transcribing…' : 'Coach is listening…'}
              </Text>
            </View>
          )}
        </View>

        {transcript ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>You said</Text>
            <Text style={styles.resultText}>{transcript}</Text>
          </View>
        ) : null}

        {reply ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Coach</Text>
            <Text style={styles.resultText}>{reply}</Text>
            {!ttsAvailable ? (
              <Text style={styles.ttsHint}>
                Voice playback is not configured on the server yet — reply is shown as text.
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  badge: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
  },
  privacyCard: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.28)',
    marginBottom: 16,
  },
  privacyTitle: {
    color: '#e9d5ff',
    fontWeight: '700',
    marginBottom: 6,
  },
  privacyBody: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: '#fca5a5',
    textAlign: 'center',
    marginBottom: 12,
  },
  controls: { gap: 12, marginBottom: 20 },
  primaryButton: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingVertical: 16,
  },
  stopRecButton: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b91c1c',
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryText: { color: '#e9d5ff', fontWeight: '700' },
  loadingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: 'rgba(255,255,255,0.65)' },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  resultLabel: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  resultText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  ttsHint: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  pressed: { opacity: 0.88 },
});
