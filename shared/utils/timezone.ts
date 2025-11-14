export function formatISTTime(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(date);
}

export function formatISTDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  return formatter.format(date);
}

export function formatISTDateTime(date: Date = new Date()): string {
  return `${formatISTDate(date)} ${formatISTTime(date)}`;
}

export function getHoursDifference(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return diffMs / (1000 * 60 * 60);
}

export function shouldIncrementVisit(lastVisitDate: Date | null): boolean {
  if (!lastVisitDate) return true;
  
  const now = new Date();
  const hoursDiff = getHoursDifference(lastVisitDate, now);
  
  return hoursDiff >= 5;
}
