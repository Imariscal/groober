declare module 'date-fns-tz' {
  export function utcToZonedTime(
    date: Date | number | string,
    timeZone: string
  ): Date;

  export function zonedTimeToUtc(
    date: Date | number,
    timeZone: string
  ): Date;

  export function formatInTimeZone(
    date: Date | number | string,
    timeZone: string,
    format: string,
    options?: any
  ): string;
}
