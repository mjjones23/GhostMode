import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getOrInitNoContactStart, getStreakDay } from '../utils/storage';

const StreakContext = createContext({
  streakDay: 1,
  refreshStreak: async () => {},
});

export function StreakProvider({ children }) {
  const [streakDay, setStreakDay] = useState(1);

  const refreshStreak = useCallback(async () => {
    const start = await getOrInitNoContactStart();
    setStreakDay(getStreakDay(start));
  }, []);

  useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  return (
    <StreakContext.Provider value={{ streakDay, refreshStreak }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  return useContext(StreakContext);
}
