import { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { dismissKeyboard, TAB_BAR_KEYBOARD_OFFSET } from '../utils/keyboard';
import { loadCoachChat, saveCoachChat, clearCoachChat } from '../utils/storage';
import { MOCK_COACH_ERROR_FALLBACK } from '../utils/mockCoach';
import {
  checkBackendStatus,
  fetchCoachReply,
} from '../services/aiService';

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    sender: 'ai',
    text: "I'm here with you. This is a safe space to feel everything — without texting them. I'm not a therapist, just a calm coach for your no-contact journey.",
  },
  {
    id: 'starter',
    sender: 'ai',
    text: 'Missing someone does not mean you made the wrong choice. Healing is not linear, and you are not weak for feeling this way.',
  },
];

const QUICK_PROMPTS = [
  'I miss them',
  'I want to text them',
  'I feel lonely',
  "I'm angry",
  'Help me calm down',
];

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (value, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 360,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.35,
            duration: 360,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    const animations = [pulse(dot1, 0), pulse(dot2, 120), pulse(dot3, 240)];
    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [dot1, dot2, dot3, fadeAnim]);

  return (
    <Animated.View style={[styles.typingBubble, { opacity: fadeAnim }]}>
      <Text style={styles.typingLabel}>Coach is thinking...</Text>
      <View style={styles.typingDots}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </Animated.View>
  );
}

function ChatMessage({ msg, animate, onAnimated }) {
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animate ? 10 : 0)).current;

  useEffect(() => {
    if (!animate) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onAnimated?.();
    });
  }, [animate, onAnimated, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        msg.sender === 'user' && styles.messageRowUser,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View
        style={[
          styles.bubble,
          msg.sender === 'ai' ? styles.bubbleAi : styles.bubbleUser,
          msg.crisis && styles.bubbleCrisis,
        ]}
      >
        {msg.sender === 'ai' && (
          <Text style={styles.coachLabel}>
            {msg.crisis ? 'Safety' : 'Coach'}
          </Text>
        )}
        <Text
          style={[
            styles.bubbleText,
            msg.sender === 'user' && styles.bubbleTextUser,
            msg.crisis && styles.bubbleTextCrisis,
          ]}
        >
          {msg.text}
        </Text>
      </View>
    </Animated.View>
  );
}

function BackendStatusSection({ status, backendMode, lastReplyMode }) {
  const isConnected = status === 'connected';
  const isChecking = status === 'checking';

  let statusLabel = 'Offline · App mock';
  if (isChecking) {
    statusLabel = 'Checking backend...';
  } else if (isConnected) {
    if (lastReplyMode === 'mock' && backendMode === 'openai') {
      statusLabel = 'Backend connected · Mock fallback (OpenAI unavailable)';
    } else if (backendMode === 'openai') {
      statusLabel = 'Backend connected · AI replies';
    } else if (backendMode === 'mock') {
      statusLabel = 'Backend connected · Mock replies';
    } else {
      statusLabel = 'Backend connected';
    }
  }

  return (
    <View style={styles.statusSection}>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            isChecking && styles.statusDotChecking,
            !isChecking && isConnected && styles.statusDotConnected,
            !isChecking && !isConnected && styles.statusDotMock,
          ]}
        />
        <Text style={styles.statusLabel}>{statusLabel}</Text>
      </View>
      {!isConnected && !isChecking && (
        <Text style={styles.statusHint}>
          Start the backend (see README_BACKEND.md) or keep using built-in mock replies.
        </Text>
      )}
    </View>
  );
}

const MIN_RESPONSE_MS = 1000;
const MAX_RESPONSE_MS = 2000;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomResponseDelayMs() {
  return (
    MIN_RESPONSE_MS +
    Math.floor(Math.random() * (MAX_RESPONSE_MS - MIN_RESPONSE_MS + 1))
  );
}

async function waitForRealisticReplyDelay(startedAt) {
  const targetMs = randomResponseDelayMs();
  const elapsed = Date.now() - startedAt;
  if (elapsed < targetMs) {
    await wait(targetMs - elapsed);
  }
}

export default function AICoachScreen() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendMode, setBackendMode] = useState('offline');
  const [lastReplyMode, setLastReplyMode] = useState(null);
  const [chatHydrated, setChatHydrated] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const skipAnimateIds = useRef(new Set(INITIAL_MESSAGES.map((msg) => msg.id)));
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback((animated = true, force = false) => {
    if (!force && !isNearBottomRef.current) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const handleMessagesScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    isNearBottomRef.current = distanceFromBottom < 96;
  }, []);

  const markMessageAnimated = useCallback((messageId) => {
    skipAnimateIds.current.add(messageId);
  }, []);

  useEffect(() => {
    let active = true;

    loadCoachChat().then((saved) => {
      if (!active) return;

      if (saved?.length) {
        saved.forEach((msg) => skipAnimateIds.current.add(msg.id));
        setMessages(saved);
      } else {
        INITIAL_MESSAGES.forEach((msg) => skipAnimateIds.current.add(msg.id));
      }

      setChatHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!chatHydrated) return;
    saveCoachChat(messages);
  }, [messages, chatHydrated]);

  useEffect(() => {
    let active = true;

    checkBackendStatus().then((result) => {
      if (active) {
        setBackendStatus(result.connected ? 'connected' : 'mock');
        setBackendMode(result.mode || 'offline');
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [isTyping, scrollToBottom]);

  const deliverReply = async (userText, chatHistory) => {
    const started = Date.now();

    try {
      const result = await fetchCoachReply({ userText, chatHistory });
      setLastReplyMode(result.mode || 'mock');
      await waitForRealisticReplyDelay(started);

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.reply,
        crisis: result.crisis,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      await waitForRealisticReplyDelay(started);

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: MOCK_COACH_ERROR_FALLBACK,
        },
      ]);
    } finally {
      setIsTyping(false);
      scrollToBottom(true, true);
    }
  };

  const sendText = (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    console.log('[AI Coach] user message received by app:', trimmed);

    dismissKeyboard();
    inputRef.current?.blur();

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };
    const historyForApi = [...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    isNearBottomRef.current = true;
    scrollToBottom(true, true);
    deliverReply(trimmed, historyForApi);
  };

  const handleClearChat = () => {
    if (isTyping) return;

    Alert.alert(
      'Clear chat?',
      'This removes your conversation with the coach on this device. The welcome messages will come back.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            dismissKeyboard();
            inputRef.current?.blur();
            await clearCoachChat();
            skipAnimateIds.current = new Set(
              INITIAL_MESSAGES.map((msg) => msg.id)
            );
            setMessages([...INITIAL_MESSAGES]);
            setInput('');
            isNearBottomRef.current = true;
            scrollToBottom(false, true);
          },
        },
      ]
    );
  };

  return (
    <GhostSafeArea style={styles.safe} tabBar>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={TAB_BAR_KEYBOARD_OFFSET}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTopSpacer} />
            <Pressable
              style={({ pressed }) => [
                styles.clearChatButton,
                (isTyping || pressed) && styles.clearChatButtonPressed,
                isTyping && styles.clearChatButtonDisabled,
              ]}
              onPress={handleClearChat}
              disabled={isTyping}
              accessibilityRole="button"
              accessibilityLabel="Clear chat"
            >
              <Text style={styles.clearChatText}>Clear chat</Text>
            </Pressable>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Private · Supportive</Text>
          </View>
          <Text style={styles.headerTitle}>AI Recovery Coach</Text>
          <Text style={styles.headerSubtitle}>Talk instead of texting them.</Text>
        </View>

        <BackendStatusSection
          status={backendStatus}
          backendMode={backendMode}
          lastReplyMode={lastReplyMode}
        />

        <View style={styles.messagesWrap}>
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            onScroll={handleMessagesScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => scrollToBottom(true)}
          >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                animate={!skipAnimateIds.current.has(msg.id)}
                onAnimated={() => markMessageAnimated(msg.id)}
              />
            ))}
            {isTyping && (
              <View style={styles.messageRow}>
                <TypingIndicator />
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.promptSection}>
          <Text style={styles.promptLabel}>Quick prompts</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promptScroll}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                style={({ pressed }) => [
                  styles.promptChip,
                  pressed && styles.buttonPressed,
                  isTyping && styles.promptChipDisabled,
                ]}
                onPress={() => sendText(prompt)}
                disabled={isTyping}
              >
                <Text style={styles.promptChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Share what you're feeling..."
            placeholderTextColor="rgba(255, 255, 255, 0.35)"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!isTyping}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => sendText(input)}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() || isTyping) && styles.sendButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => sendText(input)}
            disabled={!input.trim() || isTyping}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  headerTopSpacer: { flex: 1 },
  clearChatButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  clearChatButtonPressed: { opacity: 0.85 },
  clearChatButtonDisabled: { opacity: 0.4 },
  clearChatText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  headerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    marginBottom: 12,
  },
  headerBadgeText: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 15,
    marginTop: 6,
    fontWeight: '500',
  },
  statusSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotChecking: {
    backgroundColor: '#a78bfa',
    opacity: 0.7,
  },
  statusDotConnected: {
    backgroundColor: '#86efac',
    ...Platform.select({
      ios: {
        shadowColor: '#86efac',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      default: {},
    }),
  },
  statusDotMock: {
    backgroundColor: '#fde68a',
  },
  statusLabel: {
    color: '#e9d5ff',
    fontSize: 13,
    fontWeight: '700',
  },
  statusHint: {
    color: 'rgba(255, 255, 255, 0.52)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  messagesWrap: {
    flex: 1,
    minHeight: 0,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageRowUser: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleAi: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      default: {},
    }),
  },
  bubbleUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomRightRadius: 4,
  },
  bubbleCrisis: {
    backgroundColor: 'rgba(220, 38, 38, 0.18)',
    borderColor: 'rgba(248, 113, 113, 0.45)',
  },
  coachLabel: {
    color: '#a78bfa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bubbleText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 16,
    lineHeight: 24,
  },
  bubbleTextUser: { color: '#ffffff' },
  bubbleTextCrisis: { color: 'rgba(255, 255, 255, 0.95)' },
  typingBubble: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#a78bfa',
  },
  promptSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
    paddingBottom: 4,
  },
  promptLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  promptScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    marginRight: 8,
  },
  promptChipDisabled: { opacity: 0.4 },
  promptChipText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    backgroundColor: 'rgba(10, 10, 18, 0.98)',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: { opacity: 0.85 },
});
