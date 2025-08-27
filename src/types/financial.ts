// Tipos principais para o sistema de controle financeiro

export type TransactionType = 
  | 'receita'
  | 'despesa'
  | 'divida'
  | 'credito'
  | 'investimento'
  | 'cartao_credito'
  | 'transferencia';

export type TransactionStatus = 'pendente' | 'concluida' | 'cancelada';

export type AccountType = 'conta_corrente' | 'poupanca' | 'investimento' | 'cartao_credito';

export type InvestmentType = 'renda_fixa' | 'renda_variavel' | 'fundos' | 'criptomoedas' | 'outros';

export interface Category {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
  description?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  accountId: string;
  categoryId: string;
  date: Date;
  scheduledDate?: Date;
  status: TransactionStatus;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: Date;
  interestRate?: number;
  installments?: number;
  currentInstallment?: number;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  amount: number;
  currentValue: number;
  purchaseDate: Date;
  interestRate?: number;
  maturityDate?: Date;
  accountId: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  usedLimit: number;
  dueDate: number; // dia do mês
  closingDate: number; // dia do mês
  interestRate: number;
  annualFee?: number;
  accountId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  description?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para relatórios e análises
export interface MonthlyReport {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryBreakdown: { [categoryId: string]: number };
  accountBalances: { [accountId: string]: number };
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  totalDebts: number;
  monthlyBalance: number;
  upcomingTransactions: Transaction[];
  overdueTransactions: Transaction[];
}

// Tipos para filtros e ordenação
export interface TransactionFilters {
  type?: TransactionType[];
  accountId?: string[];
  categoryId?: string[];
  status?: TransactionStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  tags?: string[];
}

export interface SortOptions {
  field: 'date' | 'amount' | 'description' | 'type';
  direction: 'asc' | 'desc';
}

// Tipos para configurações do sistema
export interface AppSettings {
  currency: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    overdueTransactions: boolean;
    upcomingBills: boolean;
    budgetAlerts: boolean;
    goalReminders: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
}

// Tipos para importação/exportação
export interface ExportData {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  investments: Investment[];
  creditCards: CreditCard[];
  budgets: Budget[];
  goals: FinancialGoal[];
  settings: AppSettings;
  exportDate: Date;
  version: string;
}
