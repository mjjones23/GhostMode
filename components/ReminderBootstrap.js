import { useEffect } from 'react';
import { usePremium } from '../context/PremiumContext';
import {
  applyReminderNotificationSettings,
  configureReminderNotifications,
} from '../utils/reminderNotifications';

export default function ReminderBootstrap() {
  const { isPremium, premiumLoaded } = usePremium();

  useEffect(() => {
    configureReminderNotifications();
  }, []);

  useEffect(() => {
    if (!premiumLoaded) return;
    applyReminderNotificationSettings(isPremium);
  }, [isPremium, premiumLoaded]);

  return null;
}
