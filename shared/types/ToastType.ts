/**
 * ToastType.ts
 * Types pour les notifications toast.
 */

export type ToastTypeValue = 'success' | 'error' | 'info' | 'warning';

export interface ToastType {
  id: number;
  type: ToastTypeValue;
  message: string;
}
