// src/utils/errorHandler.ts
import { Alert } from 'react-native';
import { IAuthError } from '../services/authService';

export const showErrorAlert = (error: IAuthError, title: string = 'Error'): void => {
  Alert.alert(title, error.message || 'An unexpected error occurred');
};

export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as IAuthError).message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: IAuthError): boolean => {
  return error.statusCode === 0 || error.message.includes('Network error');
};

export const isAuthError = (error: IAuthError): boolean => {
  return error.statusCode === 401 || error.statusCode === 403;
};

export const isValidationError = (error: IAuthError): boolean => {
  return error.statusCode === 400 || error.statusCode === 422;
};