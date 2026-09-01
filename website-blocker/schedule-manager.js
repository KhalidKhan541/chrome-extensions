const ScheduleManager = {
  isScheduled(domain, schedules) {
    if (!domain || !schedules || schedules.length === 0) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = this.formatTime(now);

    for (const schedule of schedules) {
      if (!schedule.days.includes(currentDay)) continue;

      const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
      const normalizedSchedule = schedule.site.toLowerCase().replace(/^www\./, '');

      if (normalizedDomain !== normalizedSchedule &&
          !normalizedDomain.endsWith('.' + normalizedSchedule)) {
        continue;
      }

      if (this.isTimeInRange(currentTime, schedule.start, schedule.end)) {
        return true;
      }
    }

    return false;
  },

  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  isTimeInRange(current, start, end) {
    if (start <= end) {
      return current >= start && current <= end;
    } else {
      return current >= start || current <= end;
    }
  },

  getTimeUntilUnblock(schedule) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = this.formatTime(now);

    if (schedule.days.includes(currentDay)) {
      if (currentTime < schedule.start) {
        return this.getMinutesUntil(schedule.start);
      }
      if (currentTime > schedule.end) {
        const nextDay = this.getNextScheduledDay(schedule.days, currentDay);
        if (nextDay !== -1) {
          return this.getMinutesUntil(schedule.start) + ((nextDay - currentDay + 7) % 7) * 24 * 60;
        }
      }
    } else {
      const nextDay = this.getNextScheduledDay(schedule.days, currentDay);
      if (nextDay !== -1) {
        return this.getMinutesUntil(schedule.start) + ((nextDay - currentDay + 7) % 7) * 24 * 60;
      }
    }

    return null;
  },

  getMinutesUntil(timeStr) {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return Math.floor((target - now) / 60000);
  },

  getNextScheduledDay(days, currentDay) {
    const sortedDays = [...days].sort((a, b) => a - b);
    for (const day of sortedDays) {
      if (day > currentDay) return day;
    }
    return sortedDays[0] !== undefined ? sortedDays[0] : -1;
  },

  updateAlarms(schedules) {
    chrome.alarms.clearAll();

    schedules.forEach((schedule, index) => {
      schedule.days.forEach(day => {
        const [startHours, startMinutes] = schedule.start.split(':').map(Number);
        const [endHours, endMinutes] = schedule.end.split(':').map(Number);

        const startDate = this.getNextOccurrence(day, startHours, startMinutes);
        const endDate = this.getNextOccurrence(day, endHours, endMinutes);

        if (startDate > Date.now()) {
          chrome.alarms.create(`schedule_${index}_${day}_start`, {
            when: startDate
          });
        }

        if (endDate > Date.now()) {
          chrome.alarms.create(`schedule_${index}_${day}_end`, {
            when: endDate
          });
        }
      });
    });
  },

  getNextOccurrence(dayOfWeek, hours, minutes) {
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;

    if (daysUntil < 0 || (daysUntil === 0 && target <= now)) {
      daysUntil += 7;
    }

    target.setDate(target.getDate() + daysUntil);
    return target.getTime();
  },

  createFocusSession(durationMinutes) {
    return {
      startTime: Date.now(),
      endTime: Date.now() + durationMinutes * 60 * 1000,
      duration: durationMinutes
    };
  },

  getRemainingTime(session) {
    if (!session || !session.endTime) return 0;
    return Math.max(0, session.endTime - Date.now());
  },

  formatRemainingTime(ms) {
    if (ms <= 0) return '00:00';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  getScheduleForDomain(domain, schedules) {
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    return schedules.find(schedule => {
      const normalizedSchedule = schedule.site.toLowerCase().replace(/^www\./, '');
      return normalizedDomain === normalizedSchedule ||
             normalizedDomain.endsWith('.' + normalizedSchedule);
    });
  },

  isWithinBreakReminder(schedule) {
    const now = new Date();
    const currentTime = this.formatTime(now);

    const [startHours, startMinutes] = schedule.start.split(':').map(Number);
    const [endHours, endMinutes] = schedule.end.split(':').map(Number);

    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    const currentMinutesTotal = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);

    const sessionLength = endMinutesTotal - startMinutesTotal;
    const elapsed = currentMinutesTotal - startMinutesTotal;

    if (elapsed > 0 && elapsed % 60 === 0 && elapsed < sessionLength) {
      return true;
    }

    return false;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScheduleManager;
}
