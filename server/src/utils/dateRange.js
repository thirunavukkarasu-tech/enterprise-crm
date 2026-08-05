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

/**
 * Resolves a { from, to } Date range from request query params, defaulting
 * to the last `defaultDays` days when not provided. Used by every Reports
 * endpoint so "no filter applied" has a sane, bounded default instead of
 * scanning the entire collection.
 */
export const resolveDateRange = (query, defaultDays = 365) => {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - defaultDays * 24 * 60 * 60 * 1000);
  return { from, to };
};

const MAX_BUCKETS = 60; // safety cap — a multi-decade range shouldn't produce thousands of buckets

/**
 * Returns the equal-length period immediately preceding [from, to) — used
 * to compute period-over-period trend % (e.g. "revenue this quarter vs the
 * quarter before it") without the caller re-deriving the math per report.
 */
export const previousPeriod = (from, to) => {
  const durationMs = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - durationMs), to: new Date(from.getTime()) };
};

/**
 * Builds gap-fill buckets (month or year granularity) spanning an arbitrary
 * [from, to) range — the report equivalent of `lastNMonths`, but for a
 * user-chosen range rather than always "the last N months from today".
 */
export const buildPeriodBuckets = (from, to, groupBy = 'month') => {
  const buckets = [];

  if (groupBy === 'year') {
    let year = from.getFullYear();
    while (year <= to.getFullYear() && buckets.length < MAX_BUCKETS) {
      buckets.push({
        key: `${year}`,
        label: `${year}`,
        start: new Date(year, 0, 1),
        end: new Date(year + 1, 0, 1),
      });
      year += 1;
    }
    return buckets;
  }

  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  const currentYear = new Date().getFullYear();

  while (cursor <= end && buckets.length < MAX_BUCKETS) {
    const bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    buckets.push({
      key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      label:
        cursor.getFullYear() === currentYear
          ? MONTH_LABELS[cursor.getMonth()]
          : `${MONTH_LABELS[cursor.getMonth()]} '${String(cursor.getFullYear()).slice(2)}`,
      start: new Date(cursor),
      end: bucketEnd,
    });
    cursor = bucketEnd;
  }
  return buckets;
};
