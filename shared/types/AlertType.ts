export type AlertTypeValue = 'success' | 'error' | 'info' | 'warning';

export interface AlertType {
  type: AlertTypeValue;
  message: string;
}
