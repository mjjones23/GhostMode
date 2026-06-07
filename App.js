import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DarkBackground from './components/DarkBackground';
import ReminderBootstrap from './components/ReminderBootstrap';
import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './context/AuthContext';
import { StreakProvider } from './context/StreakContext';
import { PremiumProvider } from './context/PremiumContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PremiumProvider>
          <ReminderBootstrap />
          <StreakProvider>
            <DarkBackground>
              <StatusBar style="light" backgroundColor="#0a0a12" />
              <RootNavigator />
            </DarkBackground>
          </StreakProvider>
        </PremiumProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
