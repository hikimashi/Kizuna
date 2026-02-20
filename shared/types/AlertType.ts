/**
 * AlertType.ts
 * Types pour les alertes/modales de confirmation.
 */

export type AlertTypeValue = 'success' | 'error' | 'info' | 'warning';

export interface AlertType {
  type: AlertTypeValue;
  message: string;
}
