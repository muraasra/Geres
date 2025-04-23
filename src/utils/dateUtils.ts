// Format a date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get today's date as YYYY-MM-DD
export function getTodayFormatted(): string {
  return formatDate(new Date());
}

// Get the day of week name (e.g., "Lundi")
export function getDayName(date: Date, locale: string = 'fr-FR'): string {
  return date.toLocaleDateString(locale, { weekday: 'long' });
}

// Format date as DD/MM/YYYY
export function formatDateForDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Get start and end dates for a week given a date inside that week
export function getWeekDates(date: Date): Date[] {
  const day = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const monday = new Date(date);
  monday.setDate(diff);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    weekDates.push(nextDate);
  }
  
  return weekDates;
}

// Format week range for display (e.g., "15 - 21 Mars 2025")
export function formatWeekRange(weekDates: Date[], locale: string = 'fr-FR'): string {
  const firstDay = weekDates[0];
  const lastDay = weekDates[6];
  
  const firstDayMonth = firstDay.toLocaleDateString(locale, { month: 'long' });
  const lastDayMonth = lastDay.toLocaleDateString(locale, { month: 'long' });
  
  if (firstDayMonth === lastDayMonth) {
    return `${firstDay.getDate()} - ${lastDay.getDate()} ${firstDayMonth} ${firstDay.getFullYear()}`;
  } else {
    return `${firstDay.getDate()} ${firstDayMonth} - ${lastDay.getDate()} ${lastDayMonth} ${firstDay.getFullYear()}`;
  }
}

// Add days to a date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

// Check if a date is in the past
export function isDateInPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  
  return date < today;
}

// Format time for display (e.g. "09:00" to "09h00")
export function formatTimeForDisplay(timeStr: string): string {
  return timeStr.replace(':', 'h');
}

// Parse time to minutes from start of day (e.g., "09:30" -> 570 minutes)
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Calculate duration in minutes between two time strings
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

// Calculate percentage for positioning in calendar view
export function calculateTimePercentage(time: string, startHour: number = 8, endHour: number = 18): number {
  const totalMinutes = (endHour - startHour) * 60;
  const timeMinutes = timeToMinutes(time) - (startHour * 60);
  return (timeMinutes / totalMinutes) * 100;
}

// Calculate height percentage for a reservation in calendar view
export function calculateDurationPercentage(startTime: string, endTime: string, startHour: number = 8, endHour: number = 18): number {
  const totalMinutes = (endHour - startHour) * 60;
  const durationMinutes = calculateDurationMinutes(startTime, endTime);
  return (durationMinutes / totalMinutes) * 100;
}