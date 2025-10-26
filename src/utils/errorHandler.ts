import toast from 'react-hot-toast';
import type { ErrorResponse } from '@/types/api';

export const handleError = (error: any, context?: string) => {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  
  let message = 'An unexpected error occurred';
  
  if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.message) {
    message = error.message;
  }
  
  toast.error(message);
  
  return {
    success: false,
    error: error.response?.data?.error || 'UNKNOWN_ERROR',
    message,
  };
};

export const handleApiError = (error: any): ErrorResponse => {
  if (error.response?.data) {
    return error.response.data;
  }
  
  return {
    success: false,
    error: 'NETWORK_ERROR',
    message: 'Network error occurred. Please check your connection and try again.',
  };
};

export const logError = (error: Error, errorInfo?: any) => {
  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    console.error('Production Error:', error, errorInfo);
    // TODO: Send to error tracking service (e.g., Sentry)
  } else {
    console.error('Development Error:', error, errorInfo);
  }
};
