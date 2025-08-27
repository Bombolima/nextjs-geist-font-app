import { 
  Transaction, 
  Account, 
  Category, 
  Investment, 
  CreditCard, 
  Budget, 
  FinancialGoal, 
  AppSettings,
  ExportData 
} from '@/types/financial';

// Chaves para localStorage
const STORAGE_KEYS = {
  TRANSACTIONS: 'financial_transactions',
  ACCOUNTS: 'financial_accounts',
  CATEGORIES: 'financial_categories',
  INVESTMENTS: 'financial_investments',
  CREDIT_CARDS: 'financial_credit_cards',
  BUDGETS: 'financial_budgets',
  GOALS: 'financial_goals',
  SETTINGS: 'financial_settings',
} as const;

// Configurações padrão do sistema
const DEFAULT_SETTINGS: AppSettings = {
  currency: 'BRL',
  dateFormat: 'dd/MM/yyyy',
  theme: 'system',
  notifications: {
    overdueTransactions: true,
    upcomingBills: true,
    budgetAlerts: true,
    goalReminders: true,
  },
  backup: {
    autoBackup: false,
    backupFrequency: 'weekly',
  },
};

// Categorias padrão do sistema
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Salário', color: '#22c55e', type: 'receita', description: 'Renda do trabalho' },
  { id: '2', name: 'Freelance', color: '#3b82f6', type: 'receita', description: 'Trabalhos extras' },
  { id: '3', name: 'Alimentação', color: '#ef4444', type: 'despesa', description: 'Gastos com comida' },
  { id: '4', name: 'Transporte', color: '#f59e0b', type: 'despesa', description: 'Gastos com locomoção' },
  { id: '5', name: 'Moradia', color: '#8b5cf6', type: 'despesa', description: 'Aluguel, condomínio, etc.' },
  { id: '6', name: 'Saúde', color: '#06b6d4', type: 'despesa', description: 'Gastos médicos' },
  { id: '7', name: 'Educação', color: '#84cc16', type: 'despesa', description: 'Cursos, livros, etc.' },
  { id: '8', name: 'Lazer', color: '#f97316', type: 'despesa', description: 'Entretenimento' },
  { id: '9', name: 'Empréstimo', color: '#dc2626', type: 'divida', description: 'Dívidas contraídas' },
  { id: '10', name: 'Financiamento', color: '#991b1b', type: 'divida', description: 'Financiamentos' },
  { id: '11', name: 'Cartão de Crédito', color: '#7c2d12', type: 'cartao_credito', description: 'Gastos no cartão' },
  { id: '12', name: 'Investimento', color: '#059669', type: 'investimento', description: 'Aplicações financeiras' },
];

// Funções utilitárias para localStorage
function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') return defaultValue;
    
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    
    // Converter strings de data de volta para objetos Date
    if (Array.isArray(parsed)) {
      return parsed.map(item => convertDates(item)) as T;
    }
    
    return convertDates(parsed) as T;
  } catch (error) {
    console.error(`Erro ao carregar ${key} do localStorage:`, error);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
    return false;
  }
}

// Função para converter strings de data em objetos Date
function convertDates(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const dateFields = ['date', 'scheduledDate', 'createdAt', 'updatedAt', 'purchaseDate', 'maturityDate', 'targetDate', 'startDate', 'endDate', 'exportDate'];
  
  for (const key in obj) {
    if (dateFields.includes(key) && typeof obj[key] === 'string') {
      obj[key] = new Date(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      obj[key] = convertDates(obj[key]);
    }
  }
  
  return obj;
}

// Funções para Transações
export const transactionStorage = {
  getAll: (): Transaction[] => {
    return safeGetItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  },
  
  save: (transactions: Transaction[]): boolean => {
    return safeSetItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  },
  
  add: (transaction: Transaction): boolean => {
    const transactions = transactionStorage.getAll();
    transactions.push(transaction);
    return transactionStorage.save(transactions);
  },
  
  update: (updatedTransaction: Transaction): boolean => {
    const transactions = transactionStorage.getAll();
    const index = transactions.findIndex(t => t.id === updatedTransaction.id);
    
    if (index === -1) return false;
    
    transactions[index] = updatedTransaction;
    return transactionStorage.save(transactions);
  },
  
  delete: (id: string): boolean => {
    const transactions = transactionStorage.getAll();
    const filtered = transactions.filter(t => t.id !== id);
    return transactionStorage.save(filtered);
  },
};

// Funções para Contas
export const accountStorage = {
  getAll: (): Account[] => {
    return safeGetItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
  },
  
  save: (accounts: Account[]): boolean => {
    return safeSetItem(STORAGE_KEYS.ACCOUNTS, accounts);
  },
  
  add: (account: Account): boolean => {
    const accounts = accountStorage.getAll();
    accounts.push(account);
    return accountStorage.save(accounts);
  },
  
  update: (updatedAccount: Account): boolean => {
    const accounts = accountStorage.getAll();
    const index = accounts.findIndex(a => a.id === updatedAccount.id);
    
    if (index === -1) return false;
    
    accounts[index] = updatedAccount;
    return accountStorage.save(accounts);
  },
  
  delete: (id: string): boolean => {
    const accounts = accountStorage.getAll();
    const filtered = accounts.filter(a => a.id !== id);
    return accountStorage.save(filtered);
  },
};

// Funções para Categorias
export const categoryStorage = {
  getAll: (): Category[] => {
    const categories = safeGetItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    
    // Se não há categorias, inicializar com as padrão
    if (categories.length === 0) {
      categoryStorage.save(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    
    return categories;
  },
  
  save: (categories: Category[]): boolean => {
    return safeSetItem(STORAGE_KEYS.CATEGORIES, categories);
  },
  
  add: (category: Category): boolean => {
    const categories = categoryStorage.getAll();
    categories.push(category);
    return categoryStorage.save(categories);
  },
  
  update: (updatedCategory: Category): boolean => {
    const categories = categoryStorage.getAll();
    const index = categories.findIndex(c => c.id === updatedCategory.id);
    
    if (index === -1) return false;
    
    categories[index] = updatedCategory;
    return categoryStorage.save(categories);
  },
  
  delete: (id: string): boolean => {
    const categories = categoryStorage.getAll();
    const filtered = categories.filter(c => c.id !== id);
    return categoryStorage.save(filtered);
  },
};

// Funções para Investimentos
export const investmentStorage = {
  getAll: (): Investment[] => {
    return safeGetItem<Investment[]>(STORAGE_KEYS.INVESTMENTS, []);
  },
  
  save: (investments: Investment[]): boolean => {
    return safeSetItem(STORAGE_KEYS.INVESTMENTS, investments);
  },
  
  add: (investment: Investment): boolean => {
    const investments = investmentStorage.getAll();
    investments.push(investment);
    return investmentStorage.save(investments);
  },
  
  update: (updatedInvestment: Investment): boolean => {
    const investments = investmentStorage.getAll();
    const index = investments.findIndex(i => i.id === updatedInvestment.id);
    
    if (index === -1) return false;
    
    investments[index] = updatedInvestment;
    return investmentStorage.save(investments);
  },
  
  delete: (id: string): boolean => {
    const investments = investmentStorage.getAll();
    const filtered = investments.filter(i => i.id !== id);
    return investmentStorage.save(filtered);
  },
};

// Funções para Cartões de Crédito
export const creditCardStorage = {
  getAll: (): CreditCard[] => {
    return safeGetItem<CreditCard[]>(STORAGE_KEYS.CREDIT_CARDS, []);
  },
  
  save: (creditCards: CreditCard[]): boolean => {
    return safeSetItem(STORAGE_KEYS.CREDIT_CARDS, creditCards);
  },
  
  add: (creditCard: CreditCard): boolean => {
    const creditCards = creditCardStorage.getAll();
    creditCards.push(creditCard);
    return creditCardStorage.save(creditCards);
  },
  
  update: (updatedCreditCard: CreditCard): boolean => {
    const creditCards = creditCardStorage.getAll();
    const index = creditCards.findIndex(c => c.id === updatedCreditCard.id);
    
    if (index === -1) return false;
    
    creditCards[index] = updatedCreditCard;
    return creditCardStorage.save(creditCards);
  },
  
  delete: (id: string): boolean => {
    const creditCards = creditCardStorage.getAll();
    const filtered = creditCards.filter(c => c.id !== id);
    return creditCardStorage.save(filtered);
  },
};

// Funções para Orçamentos
export const budgetStorage = {
  getAll: (): Budget[] => {
    return safeGetItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
  },
  
  save: (budgets: Budget[]): boolean => {
    return safeSetItem(STORAGE_KEYS.BUDGETS, budgets);
  },
  
  add: (budget: Budget): boolean => {
    const budgets = budgetStorage.getAll();
    budgets.push(budget);
    return budgetStorage.save(budgets);
  },
  
  update: (updatedBudget: Budget): boolean => {
    const budgets = budgetStorage.getAll();
    const index = budgets.findIndex(b => b.id === updatedBudget.id);
    
    if (index === -1) return false;
    
    budgets[index] = updatedBudget;
    return budgetStorage.save(budgets);
  },
  
  delete: (id: string): boolean => {
    const budgets = budgetStorage.getAll();
    const filtered = budgets.filter(b => b.id !== id);
    return budgetStorage.save(filtered);
  },
};

// Funções para Metas Financeiras
export const goalStorage = {
  getAll: (): FinancialGoal[] => {
    return safeGetItem<FinancialGoal[]>(STORAGE_KEYS.GOALS, []);
  },
  
  save: (goals: FinancialGoal[]): boolean => {
    return safeSetItem(STORAGE_KEYS.GOALS, goals);
  },
  
  add: (goal: FinancialGoal): boolean => {
    const goals = goalStorage.getAll();
    goals.push(goal);
    return goalStorage.save(goals);
  },
  
  update: (updatedGoal: FinancialGoal): boolean => {
    const goals = goalStorage.getAll();
    const index = goals.findIndex(g => g.id === updatedGoal.id);
    
    if (index === -1) return false;
    
    goals[index] = updatedGoal;
    return goalStorage.save(goals);
  },
  
  delete: (id: string): boolean => {
    const goals = goalStorage.getAll();
    const filtered = goals.filter(g => g.id !== id);
    return goalStorage.save(filtered);
  },
};

// Funções para Configurações
export const settingsStorage = {
  get: (): AppSettings => {
    const settings = safeGetItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...settings };
  },
  
  save: (settings: AppSettings): boolean => {
    return safeSetItem(STORAGE_KEYS.SETTINGS, settings);
  },
  
  reset: (): boolean => {
    return settingsStorage.save(DEFAULT_SETTINGS);
  },
};

// Funções para Backup e Restauração
export const backupStorage = {
  export: (): ExportData => {
    return {
      transactions: transactionStorage.getAll(),
      accounts: accountStorage.getAll(),
      categories: categoryStorage.getAll(),
      investments: investmentStorage.getAll(),
      creditCards: creditCardStorage.getAll(),
      budgets: budgetStorage.getAll(),
      goals: goalStorage.getAll(),
      settings: settingsStorage.get(),
      exportDate: new Date(),
      version: '1.0.0',
    };
  },
  
  import: (data: ExportData): boolean => {
    try {
      transactionStorage.save(data.transactions || []);
      accountStorage.save(data.accounts || []);
      categoryStorage.save(data.categories || DEFAULT_CATEGORIES);
      investmentStorage.save(data.investments || []);
      creditCardStorage.save(data.creditCards || []);
      budgetStorage.save(data.budgets || []);
      goalStorage.save(data.goals || []);
      settingsStorage.save(data.settings || DEFAULT_SETTINGS);
      
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      return false;
    }
  },
};

// Função para gerar IDs únicos
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
