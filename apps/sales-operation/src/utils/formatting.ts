// Formatting utilities for inventory app

export const formatCompactNumber = (num: number | string): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) return '0';
  
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  } else {
    return Math.round(number).toString();
  }
};

export const formatNumber = (num: number | string): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) return '0';
  
  return new Intl.NumberFormat('vi-VN').format(number);
};

export const formatCurrency = (num: number | string): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) return '0₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(number);
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('vi-VN').format(dateObj);
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};
