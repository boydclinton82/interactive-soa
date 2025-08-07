export type StrategyType = 'consolidation' | 'loanRepayment';

export interface SuperTableRow {
  id: string;
  fundName: string;
  owner: string;
  typeOfRollover: string;
  hasInsurance: string; // Will store "Yes" or "No"
}

export interface BulletPointState {
  id: string;
  text: string;
  summary?: string; // Optional concise subheading
  status: 'pending' | 'approved' | 'rejected';
}

export interface StrategyCardInfo {
  id: StrategyType;
  title: string;
  icon: string;
  description: string;
}