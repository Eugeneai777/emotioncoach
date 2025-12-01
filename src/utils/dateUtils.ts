import { format, parseISO, startOfDay, differenceInDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const CST_TIMEZONE = "Asia/Shanghai"; // 中国标准时间 UTC+8

// ========== 基础时间工具函数 ==========

/**
 * 获取指定时区的当前日期字符串 (yyyy-MM-dd)
 * @param timezone - 时区，默认为中国标准时间
 */
export const getTodayInTimezone = (timezone: string = CST_TIMEZONE): string => {
  const now = new Date();
  const zonedTime = toZonedTime(now, timezone);
  return format(zonedTime, "yyyy-MM-dd");
};

/**
 * 获取中国标准时间（CST）的当前日期字符串 (yyyy-MM-dd)
 */
export const getTodayCST = (): string => {
  return getTodayInTimezone(CST_TIMEZONE);
};

/**
 * 获取中国标准时间的当前 Date 对象（标准化到当天 00:00:00）
 */
export const getTodayStartCST = (): Date => {
  const now = new Date();
  const cstTime = toZonedTime(now, CST_TIMEZONE);
  return startOfDay(cstTime);
};

/**
 * 将日期字符串解析为 Date 对象（标准化到当天 00:00:00）
 */
export const parseDateCST = (dateStr: string): Date => {
  return startOfDay(parseISO(dateStr));
};

/**
 * 计算从 startDate 到今天（CST）的天数差
 */
export const getDaysSinceStart = (startDate: string): number => {
  const today = getTodayStartCST();
  const start = parseDateCST(startDate);
  return differenceInDays(today, start);
};

/**
 * 将 UTC 时间戳转换为中国标准时间的日期字符串 (yyyy-MM-dd)
 */
export const formatDateCST = (utcDate: string | Date): string => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const cstTime = toZonedTime(date, CST_TIMEZONE);
  return format(cstTime, "yyyy-MM-dd");
};

/**
 * 将 UTC 时间戳转换为中国标准时间的格式化字符串
 */
export const formatInCST = (
  utcDate: string | Date, 
  formatStr: string,
  options?: any
): string => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const cstTime = toZonedTime(date, CST_TIMEZONE);
  return format(cstTime, formatStr, options);
};

// ========== 数据库查询专用工具函数 ==========

/**
 * 获取指定时区"今天"的 UTC 时间范围（用于数据库查询）
 * @param timezone - 时区，默认为中国标准时间
 */
export const getTodayRangeUTCForTimezone = (timezone: string = CST_TIMEZONE): { start: string; end: string } => {
  const today = getTodayInTimezone(timezone);
  return getDateRangeUTC(today);
};

/**
 * 获取中国标准时间"今天"的 UTC 时间范围（用于数据库查询）
 * 返回 { start: ISO字符串, end: ISO字符串 }
 * 
 * 示例：getTodayRangeUTC() 
 * => { start: "2025-12-01T16:00:00.000Z", end: "2025-12-02T15:59:59.999Z" }
 */
export const getTodayRangeUTC = (): { start: string; end: string } => {
  return getTodayRangeUTCForTimezone(CST_TIMEZONE);
};

/**
 * 将中国标准时间日期字符串转换为 UTC 时间范围（用于数据库查询）
 * @param dateStr - CST日期 "yyyy-MM-dd"
 * 
 * 示例：getDateRangeUTC("2025-12-02")
 * => { start: "2025-12-01T16:00:00.000Z", end: "2025-12-02T15:59:59.999Z" }
 */
export const getDateRangeUTC = (dateStr: string): { start: string; end: string } => {
  // CST 00:00:00 → UTC（减8小时）
  const start = new Date(`${dateStr}T00:00:00+08:00`).toISOString();
  // CST 23:59:59.999 → UTC
  const end = new Date(`${dateStr}T23:59:59.999+08:00`).toISOString();
  return { start, end };
};

/**
 * 获取中国标准时间某天 00:00 对应的 UTC ISO 字符串
 * @param dateStr - 可选，默认今天
 */
export const getCSTStartUTC = (dateStr?: string): string => {
  const date = dateStr || getTodayCST();
  return new Date(`${date}T00:00:00+08:00`).toISOString();
};

/**
 * 获取中国标准时间某天 23:59:59 对应的 UTC ISO 字符串
 * @param dateStr - 可选，默认今天
 */
export const getCSTEndUTC = (dateStr?: string): string => {
  const date = dateStr || getTodayCST();
  return new Date(`${date}T23:59:59.999+08:00`).toISOString();
};

/**
 * 获取中国标准时间过去 N 天的开始时间（UTC ISO 字符串）
 * @param days - 过去的天数
 * 
 * 示例：getCSTDaysAgoUTC(7) 返回7天前的CST 00:00对应的UTC时间
 */
export const getCSTDaysAgoUTC = (days: number): string => {
  const today = getTodayCST();
  const date = new Date(`${today}T00:00:00+08:00`);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

/**
 * 获取指定时区本周一 00:00 对应的 UTC ISO 字符串
 * @param timezone - 时区，默认为中国标准时间
 */
export const getWeekStartUTCForTimezone = (timezone: string = CST_TIMEZONE): string => {
  const now = new Date();
  const zonedTime = toZonedTime(now, timezone);
  const today = startOfDay(zonedTime);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 周日特殊处理
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  const mondayStr = format(monday, "yyyy-MM-dd");
  return new Date(`${mondayStr}T00:00:00+08:00`).toISOString();
};

/**
 * 获取中国标准时间本周一 00:00 对应的 UTC ISO 字符串
 */
export const getCSTWeekStartUTC = (): string => {
  return getWeekStartUTCForTimezone(CST_TIMEZONE);
};

// ========== 向后兼容的别名（保留旧函数名） ==========

/**
 * @deprecated 使用 getTodayCST() 替代
 */
export const getTodayInBeijing = getTodayCST;

/**
 * @deprecated 使用 getTodayStartCST() 替代
 */
export const getTodayStartInBeijing = getTodayStartCST;

/**
 * @deprecated 使用 parseDateCST() 替代
 */
export const parseDateInBeijing = parseDateCST;

/**
 * @deprecated 使用 formatDateCST() 替代
 */
export const formatDateInBeijing = formatDateCST;

/**
 * @deprecated 使用 formatInCST() 替代
 */
export const formatInBeijing = formatInCST;
