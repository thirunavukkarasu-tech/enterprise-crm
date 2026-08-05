/**
 * Percent change from `previous` to `current`, rounded to one decimal.
 * Shared by dashboard.service.js (month-over-month KPI trends) and
 * report.service.js (period-over-period report comparisons) so the
 * "what does 0 → N look like" edge case is defined in exactly one place.
 */
export const percentChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};
