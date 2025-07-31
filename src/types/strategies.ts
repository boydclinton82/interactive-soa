export interface SuperTableRow {
  id: string;
  fundName: string;
  owner: string;
  typeOfRollover: string;
  hasInsurance: string;
}

export interface BulletPointState {
  id: string;
  text: string;
  summary?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type StrategyType = 'consolidation' | 'loanRepayment';

export interface BaseStrategyState {
  alignedGoal: string;
  benefitsStates: BulletPointState[];
  considerationsStates: BulletPointState[];
  benefitsOrder: string[];
  considerationsOrder: string[];
}

export interface ConsolidationStrategyState extends BaseStrategyState {
  superTableRows: SuperTableRow[];
}

export interface LoanRepaymentStrategyState extends BaseStrategyState {
  introText: {
    amount: string;
    frequency: 'month' | 'fortnight' | 'week';
    loanType: string;
  };
}

export interface StrategyCardInfo {
  id: StrategyType;
  title: string;
  icon: string;
  description: string;
}

export interface HighlightedTextData {
  id: string;
  type: 'currency' | 'frequency' | 'text' | 'loanType';
  value: string;
}