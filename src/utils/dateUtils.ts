import { format, parseISO, startOfDay, differenceInDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const BEIJING_TIMEZONE = "Asia/Shanghai";

/**
 * 获取北京时间的当前日期字符串 (yyyy-MM-dd)
 */
export const getTodayInBeijing = (): string => {
  const now = new Date();
  const beijingTime = toZonedTime(now, BEIJING_TIMEZONE);
  return format(beijingTime, "yyyy-MM-dd");
};

/**
 * 获取北京时间的当前 Date 对象（标准化到当天 00:00:00）
 */
export const getTodayStartInBeijing = (): Date => {
  const now = new Date();
  const beijingTime = toZonedTime(now, BEIJING_TIMEZONE);
  return startOfDay(beijingTime);
};

/**
 * 将日期字符串解析为北京时间的 Date 对象（标准化到当天 00:00:00）
 */
export const parseDateInBeijing = (dateStr: string): Date => {
  return startOfDay(parseISO(dateStr));
};

/**
 * 计算从 startDate 到今天（北京时间）的天数差
 */
export const getDaysSinceStart = (startDate: string): number => {
  const today = getTodayStartInBeijing();
  const start = parseDateInBeijing(startDate);
  return differenceInDays(today, start);
};

/**
 * 将 UTC 时间戳转换为北京时间的日期字符串 (yyyy-MM-dd)
 */
export const formatDateInBeijing = (utcDate: string | Date): string => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const beijingTime = toZonedTime(date, BEIJING_TIMEZONE);
  return format(beijingTime, "yyyy-MM-dd");
};

/**
 * 将 UTC 时间戳转换为北京时间的格式化字符串
 */
export const formatInBeijing = (
  utcDate: string | Date, 
  formatStr: string,
  options?: any
): string => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const beijingTime = toZonedTime(date, BEIJING_TIMEZONE);
  return format(beijingTime, formatStr, options);
};
