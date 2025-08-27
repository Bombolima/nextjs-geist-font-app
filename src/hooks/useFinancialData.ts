'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  Account,
  Category,
  Investment,
  CreditCard,
  Budget,
  FinancialGoal,
  AppSettings,
  FinancialSummary,
  TransactionFilters,
  SortOptions,
} from '@/types/financial';
import {
  transactionStorage,
  accountStorage,
  categoryStorage,
  investmentStorage,
  creditCardStorage,
  budgetStorage,
  goalStorage,
  settingsStorage,
  generateId,
} from '@/lib/storage';
import {
  generateFinancialSummary,
  accountCalculations,
} from '@/lib/calculations';

// Hook principal para gerenciar dados financeiros
export function useFinancialData() {
  // Estados para todos os dados
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Estados de controle
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Carregar todos os dados do localStorage
        const [
          loadedTransactions,
          loadedAccounts,
          loadedCategories,
          loadedInvestments,
          loadedCreditCards,
          loadedBudgets,
          loadedGoals,
          loadedSettings,
        ] = await Promise.all([
          Promise.resolve(transactionStorage.getAll()),
          Promise.resolve(accountStorage.getAll()),
          Promise.resolve(categoryStorage.getAll()),
          Promise.resolve(investmentStorage.getAll()),
          Promise.resolve(creditCardStorage.getAll()),
          Promise.resolve(budgetStorage.getAll()),
          Promise.resolve(goalStorage.getAll()),
          Promise.resolve(settingsStorage.get()),
        ]);

        setTransactions(loadedTransactions);
        setAccounts(loadedAccounts);
        setCategories(loadedCategories);
        setInvestments(loadedInvestments);
        setCreditCards(loadedCreditCards);
        setBudgets(loadedBudgets);
        setGoals(loadedGoals);
        setSettings(loadedSettings);

        // Atualizar saldos das contas baseado nas transações
        const updatedAccounts = loadedAccounts.map(account => ({
          ...account,
          balance: accountCalculations.updateAccountBalance(account, loadedTransactions),
          updatedAt: new Date(),
        }));

        if (JSON.stringify(updatedAccounts) !== JSON.stringify(loadedAccounts)) {
          setAccounts(updatedAccounts);
          accountStorage.save(updatedAccounts);
        }

      } catch (err) {
        setError('Erro ao carregar dados financeiros');
        console.error('Erro ao carregar dados:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Funções para Transações
  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTransaction: Transaction = {
        ...transactionData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const success = transactionStorage.add(newTransaction);
      if (success) {
        setTransactions(prev => [...prev, newTransaction]);
        
        // Atualizar saldo da conta
        const account = accounts.find(a => a.id === newTransaction.accountId);
        if (account && newTransaction.status === 'concluida') {
          const updatedAccount = {
            ...account,
            balance: accountCalculations.updateAccountBalance(account, [...transactions, newTransaction]),
            updatedAt: new Date(),
          };
          
          setAccounts(prev => prev.map(a => a.id === account.id ? updatedAccount : a));
          accountStorage.update(updatedAccount);
        }
        
        return newTransaction;
      }
      throw new Error('Falha ao salvar transação');
    } catch (err) {
      setError('Erro ao adicionar transação');
      throw err;
    }
  }, [transactions, accounts]);

  const updateTransaction = useCallback(async (updatedTransaction: Transaction) => {
    try {
      const transactionWithUpdatedDate = {
        ...updatedTransaction,
        updatedAt: new Date(),
      };

      const success = transactionStorage.update(transactionWithUpdatedDate);
      if (success) {
        setTransactions(prev => 
          prev.map(t => t.id === updatedTransaction.id ? transactionWithUpdatedDate : t)
        );

        // Recalcular saldos das contas afetadas
        const affectedAccounts = accounts.filter(a => 
          a.id === updatedTransaction.accountId
        );

        const updatedAccounts = affectedAccounts.map(account => ({
          ...account,
          balance: accountCalculations.updateAccountBalance(
            account, 
            transactions.map(t => t.id === updatedTransaction.id ? transactionWithUpdatedDate : t)
          ),
          updatedAt: new Date(),
        }));

        if (updatedAccounts.length > 0) {
          setAccounts(prev => 
            prev.map(a => {
              const updated = updatedAccounts.find(ua => ua.id === a.id);
              return updated || a;
            })
          );
          
          updatedAccounts.forEach(account => accountStorage.update(account));
        }

        return transactionWithUpdatedDate;
      }
      throw new Error('Falha ao atualizar transação');
    } catch (err) {
      setError('Erro ao atualizar transação');
      throw err;
    }
  }, [transactions, accounts]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) throw new Error('Transação não encontrada');

      const success = transactionStorage.delete(id);
      if (success) {
        setTransactions(prev => prev.filter(t => t.id !== id));

        // Recalcular saldo da conta
        const account = accounts.find(a => a.id === transaction.accountId);
        if (account) {
          const updatedAccount = {
            ...account,
            balance: accountCalculations.updateAccountBalance(
              account, 
              transactions.filter(t => t.id !== id)
            ),
            updatedAt: new Date(),
          };
          
          setAccounts(prev => prev.map(a => a.id === account.id ? updatedAccount : a));
          accountStorage.update(updatedAccount);
        }

        return true;
      }
      throw new Error('Falha ao deletar transação');
    } catch (err) {
      setError('Erro ao deletar transação');
      throw err;
    }
  }, [transactions, accounts]);

  // Funções para Contas
  const addAccount = useCallback(async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newAccount: Account = {
        ...accountData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const success = accountStorage.add(newAccount);
      if (success) {
        setAccounts(prev => [...prev, newAccount]);
        return newAccount;
      }
      throw new Error('Falha ao salvar conta');
    } catch (err) {
      setError('Erro ao adicionar conta');
      throw err;
    }
  }, []);

  const updateAccount = useCallback(async (updatedAccount: Account) => {
    try {
      const accountWithUpdatedDate = {
        ...updatedAccount,
        updatedAt: new Date(),
      };

      const success = accountStorage.update(accountWithUpdatedDate);
      if (success) {
        setAccounts(prev => 
          prev.map(a => a.id === updatedAccount.id ? accountWithUpdatedDate : a)
        );
        return accountWithUpdatedDate;
      }
      throw new Error('Falha ao atualizar conta');
    } catch (err) {
      setError('Erro ao atualizar conta');
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      // Verificar se há transações vinculadas à conta
      const hasTransactions = transactions.some(t => t.accountId === id);
      if (hasTransactions) {
        throw new Error('Não é possível deletar conta com transações vinculadas');
      }

      const success = accountStorage.delete(id);
      if (success) {
        setAccounts(prev => prev.filter(a => a.id !== id));
        return true;
      }
      throw new Error('Falha ao deletar conta');
    } catch (err) {
      setError('Erro ao deletar conta');
      throw err;
    }
  }, [transactions]);

  // Funções para Categorias
  const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
    try {
      const newCategory: Category = {
        ...categoryData,
        id: generateId(),
      };

      const success = categoryStorage.add(newCategory);
      if (success) {
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
      }
      throw new Error('Falha ao salvar categoria');
    } catch (err) {
      setError('Erro ao adicionar categoria');
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (updatedCategory: Category) => {
    try {
      const success = categoryStorage.update(updatedCategory);
      if (success) {
        setCategories(prev => 
          prev.map(c => c.id === updatedCategory.id ? updatedCategory : c)
        );
        return updatedCategory;
      }
      throw new Error('Falha ao atualizar categoria');
    } catch (err) {
      setError('Erro ao atualizar categoria');
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      // Verificar se há transações vinculadas à categoria
      const hasTransactions = transactions.some(t => t.categoryId === id);
      if (hasTransactions) {
        throw new Error('Não é possível deletar categoria com transações vinculadas');
      }

      const success = categoryStorage.delete(id);
      if (success) {
        setCategories(prev => prev.filter(c => c.id !== id));
        return true;
      }
      throw new Error('Falha ao deletar categoria');
    } catch (err) {
      setError('Erro ao deletar categoria');
      throw err;
    }
  }, [transactions]);

  // Funções para Investimentos
  const addInvestment = useCallback(async (investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newInvestment: Investment = {
        ...investmentData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const success = investmentStorage.add(newInvestment);
      if (success) {
        setInvestments(prev => [...prev, newInvestment]);
        return newInvestment;
      }
      throw new Error('Falha ao salvar investimento');
    } catch (err) {
      setError('Erro ao adicionar investimento');
      throw err;
    }
  }, []);

  const updateInvestment = useCallback(async (updatedInvestment: Investment) => {
    try {
      const investmentWithUpdatedDate = {
        ...updatedInvestment,
        updatedAt: new Date(),
      };

      const success = investmentStorage.update(investmentWithUpdatedDate);
      if (success) {
        setInvestments(prev => 
          prev.map(i => i.id === updatedInvestment.id ? investmentWithUpdatedDate : i)
        );
        return investmentWithUpdatedDate;
      }
      throw new Error('Falha ao atualizar investimento');
    } catch (err) {
      setError('Erro ao atualizar investimento');
      throw err;
    }
  }, []);

  const deleteInvestment = useCallback(async (id: string) => {
    try {
      const success = investmentStorage.delete(id);
      if (success) {
        setInvestments(prev => prev.filter(i => i.id !== id));
        return true;
      }
      throw new Error('Falha ao deletar investimento');
    } catch (err) {
      setError('Erro ao deletar investimento');
      throw err;
    }
  }, []);

  // Função para gerar resumo financeiro
  const getFinancialSummary = useCallback((): FinancialSummary => {
    return generateFinancialSummary(transactions, accounts, investments);
  }, [transactions, accounts, investments]);

  // Função para filtrar transações
  const getFilteredTransactions = useCallback((
    filters?: TransactionFilters,
    sort?: SortOptions
  ): Transaction[] => {
    let filtered = [...transactions];

    if (filters) {
      if (filters.type && filters.type.length > 0) {
        filtered = filtered.filter(t => filters.type!.includes(t.type));
      }
      
      if (filters.accountId && filters.accountId.length > 0) {
        filtered = filtered.filter(t => filters.accountId!.includes(t.accountId));
      }
      
      if (filters.categoryId && filters.categoryId.length > 0) {
        filtered = filtered.filter(t => filters.categoryId!.includes(t.categoryId));
      }
      
      if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter(t => filters.status!.includes(t.status));
      }
      
      if (filters.dateFrom) {
        filtered = filtered.filter(t => new Date(t.date) >= filters.dateFrom!);
      }
      
      if (filters.dateTo) {
        filtered = filtered.filter(t => new Date(t.date) <= filters.dateTo!);
      }
      
      if (filters.amountMin !== undefined) {
        filtered = filtered.filter(t => t.amount >= filters.amountMin!);
      }
      
      if (filters.amountMax !== undefined) {
        filtered = filtered.filter(t => t.amount <= filters.amountMax!);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(t => 
          t.tags && t.tags.some(tag => filters.tags!.includes(tag))
        );
      }
    }

    if (sort) {
      filtered.sort((a, b) => {
        let aValue: any = a[sort.field];
        let bValue: any = b[sort.field];

        if (sort.field === 'date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (sort.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [transactions]);

  // Função para limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    transactions,
    accounts,
    categories,
    investments,
    creditCards,
    budgets,
    goals,
    settings,
    isLoading,
    error,

    // Funções de transações
    addTransaction,
    updateTransaction,
    deleteTransaction,

    // Funções de contas
    addAccount,
    updateAccount,
    deleteAccount,

    // Funções de categorias
    addCategory,
    updateCategory,
    deleteCategory,

    // Funções de investimentos
    addInvestment,
    updateInvestment,
    deleteInvestment,

    // Funções utilitárias
    getFinancialSummary,
    getFilteredTransactions,
    clearError,
  };
}

// Hook para configurações
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const loadedSettings = settingsStorage.get();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings!, ...newSettings };
      const success = settingsStorage.save(updatedSettings);
      
      if (success) {
        setSettings(updatedSettings);
        return updatedSettings;
      }
      throw new Error('Falha ao salvar configurações');
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      const success = settingsStorage.reset();
      if (success) {
        const defaultSettings = settingsStorage.get();
        setSettings(defaultSettings);
        return defaultSettings;
      }
      throw new Error('Falha ao resetar configurações');
    } catch (error) {
      console.error('Erro ao resetar configurações:', error);
      throw error;
    }
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
  };
}
