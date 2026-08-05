import { api } from './api.js';

const unwrap = (res) => res.data.data;

const toParams = ({ from, to, groupBy }) => ({
  from: from ? from.toISOString() : undefined,
  to: to ? to.toISOString() : undefined,
  groupBy,
});

export const reportService = {
  getSales: (range) => api.get('/reports/sales', { params: toParams(range) }).then(unwrap),
  getCustomers: (range) => api.get('/reports/customers', { params: toParams(range) }).then(unwrap),
  getLeads: (range) => api.get('/reports/leads', { params: toParams(range) }).then(unwrap),
  getTasks: (range) => api.get('/reports/tasks', { params: toParams(range) }).then(unwrap),

  /**
   * Downloads a report export as a real file. Uses a raw axios call with
   * `responseType: 'blob'` (rather than the shared `api` JSON-unwrapping
   * helpers above) since the response here is a file body, not a JSON
   * envelope — then triggers the browser's native save flow via a
   * throwaway <a> element.
   */
  exportReport: async ({ type, format, from, to }) => {
    const response = await api.get('/reports/export', {
      params: { type, format, ...toParams({ from, to }) },
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `${type}-report.${format}`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
