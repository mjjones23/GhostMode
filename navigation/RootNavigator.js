import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OnboardingScreen from '../screens/OnboardingScreen';
import SetupScreen from '../screens/SetupScreen';
import StreakTrackerScreen from '../screens/StreakTrackerScreen';
import JournalScreen from '../screens/JournalScreen';
import AICoachScreen from '../screens/AICoachScreen';
import MoodTrackerScreen from '../screens/MoodTrackerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import PaywallScreen from '../screens/PaywallScreen';
import DailyReminderScreen from '../screens/DailyReminderScreen';
import ReasonsScreen from '../screens/ReasonsScreen';
import StreakResetScreen from '../screens/StreakResetScreen';
import ProgressInsightsScreen from '../screens/ProgressInsightsScreen';
import LegalDocumentScreen from '../screens/LegalDocumentScreen';
import SafetyDisclaimerScreen from '../screens/SafetyDisclaimerScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import CrisisLockScreen from '../screens/CrisisLockScreen';
import SOSModeScreen from '../screens/SOSModeScreen';
import DailyCheckInScreen from '../screens/DailyCheckInScreen';

import { getAppEntryRoute } from '../utils/storage';
import { usePremium } from '../context/PremiumContext';
import TabBarIcon from './TabBarIcon';
import LaunchLoadingScreen from '../components/LaunchLoadingScreen';
import {
  GhostNavigationTheme,
  tabBarStyles,
  stackScreenOptions,
  modalScreenOptions,
} from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a12' },
      }}
    >
      <HomeStack.Screen name="HomeDashboard" component={StreakTrackerScreen} />
      <HomeStack.Screen
        name="DailyCheckIn"
        component={DailyCheckInScreen}
        options={modalScreenOptions}
      />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const tabHeight = Platform.OS === 'ios' ? 56 + insets.bottom : 64;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          ...tabBarStyles,
          height: tabHeight,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
        },
        tabBarActiveTintColor: '#c4b5fd',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.38)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Journal: focused ? 'book' : 'book-outline',
            Coach: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
            Mood: focused ? 'heart' : 'heart-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          return (
            <TabBarIcon name={icons[route.name]} focused={focused} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{ tabBarLabel: 'Journal' }}
      />
      <Tab.Screen
        name="Coach"
        component={AICoachScreen}
        options={{ tabBarLabel: 'AI Coach' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isPremium) {
              e.preventDefault();
              navigation.getParent()?.navigate('Paywall');
            }
          },
        })}
      />
      <Tab.Screen
        name="Mood"
        component={MoodTrackerScreen}
        options={{ tabBarLabel: 'Mood' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function OnboardingWrapper({ navigation }) {
  const handleStartHealing = () => {
    navigation.replace('Setup');
  };

  return <OnboardingScreen onStartHealing={handleStartHealing} />;
}

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    getAppEntryRoute().then(setInitialRoute);
  }, []);

  if (!initialRoute) {
    return <LaunchLoadingScreen />;
  }

  return (
    <NavigationContainer theme={GhostNavigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={stackScreenOptions}
      >
        <Stack.Screen name="Onboarding" component={OnboardingWrapper} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Reasons" component={ReasonsScreen} />
        <Stack.Screen name="ProgressInsights" component={ProgressInsightsScreen} />
        <Stack.Screen
          name="StreakReset"
          component={StreakResetScreen}
          options={modalScreenOptions}
        />
        <Stack.Screen name="Emergency" component={EmergencyScreen} options={modalScreenOptions} />
        <Stack.Screen
          name="CrisisLock"
          component={CrisisLockScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
            contentStyle: { backgroundColor: '#0a0a12' },
          }}
        />
        <Stack.Screen
          name="SOSMode"
          component={SOSModeScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
            contentStyle: { backgroundColor: '#0a0a12' },
          }}
        />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={modalScreenOptions} />
        <Stack.Screen name="DailyReminder" component={DailyReminderScreen} options={modalScreenOptions} />
        <Stack.Screen
          name="SafetyDisclaimer"
          component={SafetyDisclaimerScreen}
          options={modalScreenOptions}
        />
        <Stack.Screen
          name="LegalDocument"
          component={LegalDocumentScreen}
          options={modalScreenOptions}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
