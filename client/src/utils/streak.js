/**
 * Utility for tracking and calculating Daily Learning Streak (Streak Belajar)
 */

export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStreakData(userId = 'guest') {
  const key = `stubia_streak_${userId || 'guest'}`;
  const todayStr = getLocalDateString();

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.lastDate) {
        const last = new Date(parsed.lastDate + 'T00:00:00');
        const today = new Date(todayStr + 'T00:00:00');

        const diffTime = today.getTime() - last.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

        if (diffDays === 0) {
          // Same day
          return {
            count: parsed.count || 1,
            lastDate: parsed.lastDate,
            activeDates: parsed.activeDates || [todayStr],
            isTodayActive: true,
          };
        } else if (diffDays === 1) {
          // Yesterday -> streak active from yesterday, can be incremented today
          return {
            count: parsed.count || 1,
            lastDate: parsed.lastDate,
            activeDates: parsed.activeDates || [],
            isTodayActive: false,
          };
        } else {
          // Missed 2+ days -> streak reset
          return {
            count: 0,
            lastDate: parsed.lastDate,
            activeDates: parsed.activeDates || [],
            isTodayActive: false,
          };
        }
      }
    }
  } catch (e) {
    console.error('Failed to get streak data:', e);
  }

  return { count: 0, lastDate: '', activeDates: [], isTodayActive: false };
}

export function updateDailyStreak(userId = 'guest') {
  const key = `stubia_streak_${userId || 'guest'}`;
  const todayStr = getLocalDateString();
  const current = getStreakData(userId);

  let newCount = current.count;
  let activeDates = Array.isArray(current.activeDates) ? [...current.activeDates] : [];

  if (current.isTodayActive) {
    newCount = Math.max(1, current.count);
  } else {
    if (current.lastDate) {
      const last = new Date(current.lastDate + 'T00:00:00');
      const today = new Date(todayStr + 'T00:00:00');
      const diffTime = today.getTime() - last.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays === 1) {
        newCount = current.count + 1;
      } else {
        newCount = 1;
      }
    } else {
      newCount = 1;
    }

    if (!activeDates.includes(todayStr)) {
      activeDates.push(todayStr);
    }
  }

  // Keep last 30 active dates to save space
  if (activeDates.length > 30) {
    activeDates = activeDates.slice(activeDates.length - 30);
  }

  const updatedData = {
    count: newCount,
    lastDate: todayStr,
    activeDates,
    isTodayActive: true,
  };

  try {
    localStorage.setItem(key, JSON.stringify(updatedData));
    window.dispatchEvent(new CustomEvent('streak-update', { detail: updatedData }));
  } catch (e) {
    console.error('Failed to save streak data:', e);
  }

  return updatedData;
}
