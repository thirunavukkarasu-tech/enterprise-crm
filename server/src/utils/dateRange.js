const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Returns the last `n` months (oldest first, including the current month)
 * as { key, label, year, month, start, end } buckets. Used to left-join
 * aggregation results against so months with zero activity still appear
 * on the chart as 0 instead of being silently omitted.
 */
export const lastNMonths = (n) => {
  const months = [];
  const now = new Date();

  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MONTH_LABELS[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      start,
      end,
    });
  }
  return months;
};
