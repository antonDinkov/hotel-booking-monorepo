import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type DateRangeCalendarProps = {
  endDate: string;
  minDate?: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  startDate: string;
};

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

export default function DateRangeCalendar({ endDate, minDate, onChange, startDate }: DateRangeCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const minDateValue = useMemo(() => parseDate(minDate) ?? today, [minDate, today]);
  const selectedStart = useMemo(() => parseDate(startDate), [startDate]);
  const selectedEnd = useMemo(() => parseDate(endDate), [endDate]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const base = selectedStart ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const monthLabel = `${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  const days = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  function handleSelectDate(date: Date) {
    if (isBefore(date, minDateValue)) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      onChange({ startDate: formatDate(date), endDate: '' });
      return;
    }

    if (selectedStart && !selectedEnd) {
      if (isSameDay(date, selectedStart) || isBefore(date, selectedStart)) {
        onChange({ startDate: formatDate(date), endDate: '' });
        return;
      }

      onChange({ startDate: formatDate(selectedStart), endDate: formatDate(date) });
    }
  }

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, -1))} style={styles.navButton}>
          <Text style={styles.navText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.navButton}>
          <Text style={styles.navText}>{'>'}</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const isDisabled = isBefore(day.date, minDateValue);
          const isStart = selectedStart ? isSameDay(day.date, selectedStart) : false;
          const isEnd = selectedEnd ? isSameDay(day.date, selectedEnd) : false;
          const isInRange = selectedStart && selectedEnd
            ? isAfter(day.date, selectedStart) && isBefore(day.date, selectedEnd)
            : false;
          const isToday = isSameDay(day.date, today);

          return (
            <Pressable
              key={day.date.toISOString()}
              onPress={() => handleSelectDate(day.date)}
              style={[
                styles.dayCell,
                !day.isCurrentMonth && styles.dayOutside,
                isDisabled && styles.dayDisabled,
                isInRange && styles.dayInRange,
                (isStart || isEnd) && styles.daySelected,
                isToday && styles.dayToday,
              ]}
              disabled={isDisabled}
            >
              <Text style={[
                styles.dayText,
                !day.isCurrentMonth && styles.dayTextOutside,
                isDisabled && styles.dayTextDisabled,
                (isStart || isEnd) && styles.dayTextSelected,
              ]}>
                {day.date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function buildCalendarDays(month: Date): CalendarDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = firstOfMonth.getDay();
  const startDate = addDays(firstOfMonth, -startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(startDate, index);
    return {
      date,
      isCurrentMonth: date.getMonth() === monthIndex,
    };
  });
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function isBefore(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function isAfter(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

const styles = StyleSheet.create({
  calendar: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    alignItems: 'center',
    borderColor: '#cbd5f5',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  navText: {
    color: '#1d4ed8',
    fontSize: 18,
    fontWeight: '800',
  },
  monthLabel: {
    color: '#172554',
    fontSize: 16,
    fontWeight: '900',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDay: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    width: '14.28%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    alignItems: 'center',
    borderRadius: 16,
    height: 36,
    justifyContent: 'center',
    width: '13.5%',
  },
  dayOutside: {
    opacity: 0.4,
  },
  dayDisabled: {
    opacity: 0.3,
  },
  daySelected: {
    backgroundColor: '#2563eb',
  },
  dayInRange: {
    backgroundColor: '#dbeafe',
  },
  dayToday: {
    borderColor: '#93c5fd',
    borderWidth: 1,
  },
  dayText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  dayTextOutside: {
    color: '#94a3b8',
  },
  dayTextDisabled: {
    color: '#cbd5f5',
  },
  dayTextSelected: {
    color: '#ffffff',
  },
});
