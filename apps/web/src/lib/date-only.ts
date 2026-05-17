const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 10);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDateOnly(value: string): boolean {
  const parsed = parseDateOnly(value);
  return (
    DATE_ONLY_PATTERN.test(value) &&
    !Number.isNaN(parsed.getTime()) &&
    formatDateOnly(parsed) === value
  );
}
