import { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { useNavigation } from '@react-navigation/native';
import {
  DEFAULT_PAYWALL_PLAN_ID,
  PAYWALL_PLANS,
} from '../config/revenuecat';
import { usePremium } from '../context/PremiumContext';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '../services/purchasesService';
import ScreenBackButton from '../components/ScreenBackButton';

const FEATURES = [
  'Unlimited AI Coach messages',
  'Progress insights & streak analytics',
  'Unlimited journal history',
  'Unlimited mood history',
  'Daily healing reminders',
];

export default function PaywallScreen() {
  const navigation = useNavigation();
  const { refreshPremium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState(DEFAULT_PAYWALL_PLAN_ID);
  const [busy, setBusy] = useState(false);

  const offerings = useMemo(
    () =>
      PAYWALL_PLANS.map((plan) => ({
        ...plan,
        revenueCatProductId: plan.productId,
      })),
    []
  );

  const selectedPlanData =
    offerings.find((plan) => plan.id === selectedPlan) ?? offerings[0];

  const startPurchase = async () => {
    if (!selectedPlanData || busy) return;

    setBusy(true);
    try {
      // Mirrors future flow: getOfferings() → purchasePackage()
      await getOfferings();
      const result = await purchasePackage({ planId: selectedPlanData.id });

      if (!result.success) {
        Alert.alert(
          'Subscriptions unavailable',
          'Ghost Mode Premium is not available for purchase yet. Please try again later.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (result.demo) {
        Alert.alert(
          'Subscriptions coming soon',
          'In-app purchases are not connected yet. Ghost Mode Premium will be available through the App Store when subscriptions go live.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      await refreshPremium();
      Alert.alert(
        'Welcome to Premium',
        'Your Ghost Mode Premium subscription is active.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (busy) return;

    setBusy(true);
    try {
      const result = await restorePurchases();

      if (result.restored) {
        await refreshPremium();
      }

      Alert.alert(result.title, result.message, [{ text: 'OK' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GhostSafeArea style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenBackButton />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Ghost Mode Premium</Text>
        </View>

        <Text style={styles.title}>Unlock Ghost Mode Premium</Text>
        <Text style={styles.subtitle}>
          Get deeper support when you need it most.
        </Text>

        <View style={styles.featuresCard}>
          {FEATURES.map((feature, index) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>
                {index + 1}. {feature}
              </Text>
            </View>
          ))}
        </View>

        {offerings.map((plan) => {
          const selected = selectedPlan === plan.id;
          const isYearly = plan.id === 'yearly';

          return (
            <Pressable
              key={plan.id}
              style={({ pressed }) => [
                styles.planCard,
                isYearly && styles.planCardYearly,
                selected && styles.planCardSelected,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.badge ? (
                <View style={styles.bestValue}>
                  <Text style={styles.bestValueText}>{plan.badge}</Text>
                </View>
              ) : null}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {selected && (
                  <View style={styles.selectedPill}>
                    <Text style={styles.selectedPillText}>Selected</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>{plan.priceLabel}</Text>
              <Text style={styles.planDetail}>{plan.detail}</Text>
            </Pressable>
          );
        })}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonPrimary,
              (pressed || busy) && styles.buttonPressed,
              busy && styles.buttonDisabled,
            ]}
            onPress={startPurchase}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Continue</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              (pressed || busy) && styles.buttonPressed,
              busy && styles.buttonDisabled,
            ]}
            onPress={handleRestorePurchases}
            disabled={busy}
          >
            <Text style={styles.buttonSecondaryText}>Restore Purchases</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonSecondaryText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          Subscriptions renew automatically unless canceled in your Apple ID settings.
          Payment will be charged to your Apple ID account.
        </Text>
      </ScrollView>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  badge: {
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },
  badgeText: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
    maxWidth: 320,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  featuresCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  featureCheck: {
    color: '#a78bfa',
    fontSize: 16,
    fontWeight: '800',
    width: 24,
    marginRight: 8,
  },
  featureText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    lineHeight: 22,
  },
  planCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  planCardYearly: {
    marginTop: 4,
  },
  planCardSelected: {
    borderColor: 'rgba(167, 139, 250, 0.7)',
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  bestValue: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bestValueText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  selectedPill: {
    backgroundColor: 'rgba(167, 139, 250, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  selectedPillText: {
    color: '#e9d5ff',
    fontSize: 11,
    fontWeight: '700',
  },
  planPrice: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  planDetail: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  productIdHint: {
    color: 'rgba(167, 139, 250, 0.45)',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#7c3aed',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonSecondaryText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  disclaimer: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
  },
});
