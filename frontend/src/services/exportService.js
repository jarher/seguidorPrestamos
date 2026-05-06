import api from './api';

export const downloadPortfolioReport = async (format = 'csv') => {
  const response = await api.get(`/reports/portfolio?format=${format}`, {
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `portfolio.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadBorrowerReport = async (borrowerId, format = 'csv') => {
  const response = await api.get(`/reports/borrower/${borrowerId}?format=${format}`, {
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `prestatario-${borrowerId}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};