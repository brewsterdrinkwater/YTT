import { Entry, ValidationResult } from '../types';

export const validateEntry = (entry: Partial<Entry>): ValidationResult => {
  const errors: string[] = [];

  if (!entry.location) {
    errors.push('Location is required');
  }

  if (entry.location === 'other' && !entry.otherLocationName) {
    errors.push('Please specify the location name');
  }

  if (!entry.feeling || entry.feeling < 1 || entry.feeling > 10) {
    errors.push('Feeling must be between 1 and 10');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const validateNumber = (value: unknown, min?: number, max?: number): boolean => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

export const validateRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
