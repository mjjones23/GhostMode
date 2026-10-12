import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getOrInitNoContactStart, getStreakDay } from '../utils/storage';

const StreakContext = createContext({
  streakDay: 1,
  startDate: null,
  refreshStreak: async () => {},
});

export function StreakProvider({ children }) {
  const [streakDay, setStreakDay] = useState(1);
  const [startDate, setStartDate] = useState(null);

  const refreshStreak = useCallback(async () => {
    const start = await getOrInitNoContactStart();
    setStartDate(start);
    setStreakDay(getStreakDay(start));
  }, []);

  useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  return (
    <StreakContext.Provider value={{ streakDay, startDate, refreshStreak }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  return useContext(StreakContext);
}
