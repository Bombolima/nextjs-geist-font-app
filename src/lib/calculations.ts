import { Transaction, Account, Investment, CreditCard, FinancialSummary, MonthlyReport } from '@/types/financial';

// Funções para cálculos de juros
export const interestCalculations = {
  // Juros simples
  simpleInterest: (principal: number, rate: number, time: number): number => {
    return principal * (rate / 100) * time;
  },

  // Juros compostos
  compoundInterest: (principal: number, rate: number, time: number, frequency: number = 12): number => {
    return principal * Math.pow(1 + (rate / 100) / frequency, frequency * time) - principal;
  },

  // Valor futuro com juros compostos
  futureValue: (principal: number, rate: number, time: number, frequency: number = 12): number => {
    return principal * Math.pow(1 + (rate / 100) / frequency, frequency * time);
  },

  // Valor presente
  presentValue: (futureValue: number, rate: number, time: number, frequency: number = 12): number => {
    return futureValue / Math.pow(1 + (rate / 100) / frequency, frequency * time);
  },

  // Cálculo de parcelas (Sistema Price)
  installmentPayment: (principal: number, rate: number, periods: number): number => {
    if (rate === 0) return principal / periods;
    
    const monthlyRate = rate / 100 / 12;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, periods)) / (Math.pow(1 + monthlyRate, periods) - 1);
  },

  // Cálculo do saldo devedor
  remainingBalance: (principal: number, rate: number, totalPeriods: number, paidPeriods: number): number => {
    if (rate === 0) return principal * (totalPeriods - paidPeriods) / totalPeriods;
    
    const monthlyRate = rate / 100 / 12;
    const installment = interestCalculations.installmentPayment(principal, rate * 12, totalPeriods);
    
    let balance = principal;
    for (let i = 0; i < paidPeriods; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = installment - interestPayment;
      balance -= principalPayment;
    }
    
    return Math.max(0, balance);
  },
};

// Funções para cálculos de transações
export const transactionCalculations = {
  // Calcular total por tipo de transação
  getTotalByType: (transactions: Transaction[], type: Transaction['type']): number => {
    return transactions
      .filter(t => t.type === type && t.status === 'concluida')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // Calcular total de receitas
  getTotalIncome: (transactions: Transaction[]): number => {
    return transactions
      .filter(t => t.type === 'receita' && t.status === 'concluida')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // Calcular total de despesas
  getTotalExpenses: (transactions: Transaction[]): number => {
    return transactions
      .filter(t => ['despesa', 'cartao_credito'].includes(t.type) && t.status === 'concluida')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // Calcular total de dívidas
  getTotalDebts: (transactions: Transaction[]): number => {
    return transactions
      .filter(t => t.type === 'divida' && t.status !== 'cancelada')
      .reduce((sum, t) => {
        if (t.installments && t.currentInstallment && t.interestRate) {
          // Calcular saldo devedor restante
          const remaining = interestCalculations.remainingBalance(
            t.amount,
            t.interestRate,
            t.installments,
            t.currentInstallment - 1
          );
          return sum + remaining;
        }
        return sum + t.amount;
      }, 0);
  },

  // Calcular saldo líquido
  getNetBalance: (transactions: Transaction[]): number => {
    const income = transactionCalculations.getTotalIncome(transactions);
    const expenses = transactionCalculations.getTotalExpenses(transactions);
    return income - expenses;
  },

  // Filtrar transações por período
  getTransactionsByPeriod: (transactions: Transaction[], startDate: Date, endDate: Date): Transaction[] => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  },

  // Calcular transações futuras (agendadas)
  getFutureTransactions: (transactions: Transaction[], days: number = 30): Transaction[] => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return transactions.filter(t => {
      if (t.status !== 'pendente') return false;
      
      const scheduledDate = t.scheduledDate ? new Date(t.scheduledDate) : new Date(t.date);
      return scheduledDate >= today && scheduledDate <= futureDate;
    });
  },

  // Calcular transações em atraso
  getOverdueTransactions: (transactions: Transaction[]): Transaction[] => {
    const today = new Date();
    
    return transactions.filter(t => {
      if (t.status !== 'pendente') return false;
      
      const dueDate = t.scheduledDate ? new Date(t.scheduledDate) : new Date(t.date);
      return dueDate < today;
    });
  },
};

// Funções para cálculos de contas
export const accountCalculations = {
  // Calcular saldo total de todas as contas
  getTotalBalance: (accounts: Account[]): number => {
    return accounts
      .filter(a => a.isActive)
      .reduce((sum, a) => sum + a.balance, 0);
  },

  // Atualizar saldo da conta baseado nas transações
  updateAccountBalance: (account: Account, transactions: Transaction[]): number => {
    const accountTransactions = transactions.filter(t => 
      t.accountId === account.id && t.status === 'concluida'
    );

    let balance = account.initialBalance;
    
    accountTransactions.forEach(t => {
      if (['receita', 'credito'].includes(t.type)) {
        balance += t.amount;
      } else if (['despesa', 'divida', 'cartao_credito', 'investimento'].includes(t.type)) {
        balance -= t.amount;
      }
    });

    return balance;
  },

  // Calcular projeção de saldo futuro
  getProjectedBalance: (account: Account, transactions: Transaction[], days: number = 30): number => {
    const futureTransactions = transactionCalculations.getFutureTransactions(transactions, days)
      .filter(t => t.accountId === account.id);

    let projectedBalance = account.balance;
    
    futureTransactions.forEach(t => {
      if (['receita', 'credito'].includes(t.type)) {
        projectedBalance += t.amount;
      } else if (['despesa', 'divida', 'cartao_credito', 'investimento'].includes(t.type)) {
        projectedBalance -= t.amount;
      }
    });

    return projectedBalance;
  },
};

// Funções para cálculos de investimentos
export const investmentCalculations = {
  // Calcular valor total dos investimentos
  getTotalInvestments: (investments: Investment[]): number => {
    return investments
      .filter(i => i.isActive)
      .reduce((sum, i) => sum + i.currentValue, 0);
  },

  // Calcular rentabilidade de um investimento
  getInvestmentReturn: (investment: Investment): number => {
    return investment.currentValue - investment.amount;
  },

  // Calcular rentabilidade percentual
  getInvestmentReturnPercentage: (investment: Investment): number => {
    if (investment.amount === 0) return 0;
    return ((investment.currentValue - investment.amount) / investment.amount) * 100;
  },

  // Calcular valor futuro do investimento
  getInvestmentFutureValue: (investment: Investment, months: number): number => {
    if (!investment.interestRate) return investment.currentValue;
    
    return interestCalculations.futureValue(
      investment.currentValue,
      investment.interestRate,
      months / 12
    );
  },

  // Calcular distribuição por tipo de investimento
  getInvestmentAllocation: (investments: Investment[]): { [key: string]: number } => {
    const allocation: { [key: string]: number } = {};
    const total = investmentCalculations.getTotalInvestments(investments);
    
    if (total === 0) return allocation;
    
    investments.filter(i => i.isActive).forEach(investment => {
      if (!allocation[investment.type]) {
        allocation[investment.type] = 0;
      }
      allocation[investment.type] += (investment.currentValue / total) * 100;
    });
    
    return allocation;
  },
};

// Funções para cálculos de cartão de crédito
export const creditCardCalculations = {
  // Calcular limite disponível
  getAvailableLimit: (creditCard: CreditCard): number => {
    return creditCard.limit - creditCard.usedLimit;
  },

  // Calcular percentual de uso do limite
  getLimitUsagePercentage: (creditCard: CreditCard): number => {
    if (creditCard.limit === 0) return 0;
    return (creditCard.usedLimit / creditCard.limit) * 100;
  },

  // Calcular juros do rotativo
  getRotativeInterest: (creditCard: CreditCard, amount: number, days: number): number => {
    const dailyRate = creditCard.interestRate / 100 / 30; // Taxa diária aproximada
    return amount * dailyRate * days;
  },

  // Calcular próxima data de vencimento
  getNextDueDate: (creditCard: CreditCard): Date => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDate = new Date(currentYear, currentMonth, creditCard.dueDate);
    
    // Se a data já passou neste mês, usar o próximo mês
    if (dueDate <= today) {
      dueDate = new Date(currentYear, currentMonth + 1, creditCard.dueDate);
    }
    
    return dueDate;
  },
};

// Função principal para gerar resumo financeiro
export const generateFinancialSummary = (
  transactions: Transaction[],
  accounts: Account[],
  investments: Investment[]
): FinancialSummary => {
  const totalBalance = accountCalculations.getTotalBalance(accounts);
  const totalIncome = transactionCalculations.getTotalIncome(transactions);
  const totalExpenses = transactionCalculations.getTotalExpenses(transactions);
  const totalInvestments = investmentCalculations.getTotalInvestments(investments);
  const totalDebts = transactionCalculations.getTotalDebts(transactions);
  const monthlyBalance = totalIncome - totalExpenses;
  const upcomingTransactions = transactionCalculations.getFutureTransactions(transactions);
  const overdueTransactions = transactionCalculations.getOverdueTransactions(transactions);

  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    totalInvestments,
    totalDebts,
    monthlyBalance,
    upcomingTransactions,
    overdueTransactions,
  };
};

// Função para gerar relatório mensal
export const generateMonthlyReport = (
  transactions: Transaction[],
  accounts: Account[],
  month: number,
  year: number
): MonthlyReport => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const monthlyTransactions = transactionCalculations.getTransactionsByPeriod(
    transactions,
    startDate,
    endDate
  );

  const totalIncome = transactionCalculations.getTotalIncome(monthlyTransactions);
  const totalExpenses = transactionCalculations.getTotalExpenses(monthlyTransactions);
  const balance = totalIncome - totalExpenses;

  // Breakdown por categoria
  const categoryBreakdown: { [categoryId: string]: number } = {};
  monthlyTransactions.forEach(t => {
    if (!categoryBreakdown[t.categoryId]) {
      categoryBreakdown[t.categoryId] = 0;
    }
    categoryBreakdown[t.categoryId] += t.amount;
  });

  // Saldos das contas
  const accountBalances: { [accountId: string]: number } = {};
  accounts.forEach(account => {
    accountBalances[account.id] = account.balance;
  });

  return {
    month,
    year,
    totalIncome,
    totalExpenses,
    balance,
    categoryBreakdown,
    accountBalances,
  };
};

// Funções utilitárias para formatação
export const formatCurrency = (amount: number, currency: string = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (date: Date, format: string = 'dd/MM/yyyy'): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  switch (format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'MM/yyyy':
      return `${month}/${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    default:
      return date.toLocaleDateString('pt-BR');
  }
};
