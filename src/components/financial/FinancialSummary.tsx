'use client';

import { useMemo } from 'react';
import { Transaction, Account, Investment, type FinancialSummary } from '@/types/financial';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  formatCurrency, 
  formatPercentage, 
  formatDate, 
  getAmountColor,
  getPercentageColor 
} from '@/lib/formatters';
import { 
  generateFinancialSummary,
  transactionCalculations,
  accountCalculations,
  investmentCalculations 
} from '@/lib/calculations';

interface FinancialSummaryProps {
  transactions: Transaction[];
  accounts: Account[];
  investments: Investment[];
  showDetails?: boolean;
  period?: 'current' | 'monthly' | 'yearly';
}

export function FinancialSummary({
  transactions,
  accounts,
  investments,
  showDetails = true,
  period = 'current',
}: FinancialSummaryProps) {
  
  const summary = useMemo(() => {
    return generateFinancialSummary(transactions, accounts, investments);
  }, [transactions, accounts, investments]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlyTransactions = transactionCalculations.getTransactionsByPeriod(
      transactions,
      startOfMonth,
      endOfMonth
    );

    return {
      income: transactionCalculations.getTotalIncome(monthlyTransactions),
      expenses: transactionCalculations.getTotalExpenses(monthlyTransactions),
      balance: transactionCalculations.getNetBalance(monthlyTransactions),
      transactionCount: monthlyTransactions.length,
    };
  }, [transactions]);

  const investmentData = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = investmentCalculations.getTotalInvestments(investments);
    const totalReturn = totalCurrentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalReturn,
      returnPercentage,
    };
  }, [investments]);

  const upcomingBills = useMemo(() => {
    return summary.upcomingTransactions
      .filter(t => ['despesa', 'divida', 'cartao_credito'].includes(t.type))
      .slice(0, 5);
  }, [summary.upcomingTransactions]);

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getHealthScore = () => {
    let score = 50; // Base score
    
    // Positive factors
    if (summary.totalBalance > 0) score += 20;
    if (summary.monthlyBalance > 0) score += 15;
    if (summary.totalInvestments > summary.totalBalance * 0.1) score += 10;
    if (summary.overdueTransactions.length === 0) score += 5;
    
    // Negative factors
    if (summary.totalDebts > summary.totalBalance * 0.5) score -= 20;
    if (summary.monthlyBalance < 0) score -= 15;
    if (summary.overdueTransactions.length > 0) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = getHealthScore();
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Boa';
    if (score >= 40) return 'Regular';
    return 'Precisa atenção';
  };

  return (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(summary.totalBalance)}`}>
              {formatCurrency(summary.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {accounts.filter(acc => acc.isActive).length} contas ativas
            </p>
          </CardContent>
        </Card>

        {/* Receitas do Mês */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(monthlyData.income)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.totalIncome)} total
            </p>
          </CardContent>
        </Card>

        {/* Despesas do Mês */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(monthlyData.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.totalExpenses)} total
            </p>
          </CardContent>
        </Card>

        {/* Investimentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
            <div className="h-4 w-4 rounded-full bg-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(investmentData.totalCurrentValue)}
            </div>
            <p className={`text-xs ${getPercentageColor(investmentData.returnPercentage)}`}>
              {investmentData.returnPercentage >= 0 ? '+' : ''}
              {formatPercentage(investmentData.returnPercentage)} rentabilidade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Saúde Financeira */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Saúde Financeira
            <Badge className={getHealthColor(healthScore)}>
              {getHealthLabel(healthScore)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Análise geral da sua situação financeira
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Pontuação</span>
              <span className={getHealthColor(healthScore)}>
                {healthScore}/100
              </span>
            </div>
            <Progress value={healthScore} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium">Saldo Mensal</div>
              <div className={getBalanceColor(monthlyData.balance)}>
                {formatCurrency(monthlyData.balance)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium">Dívidas Totais</div>
              <div className="text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalDebts)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium">Patrimônio Líquido</div>
              <div className={getBalanceColor(summary.totalBalance - summary.totalDebts)}>
                {formatCurrency(summary.totalBalance - summary.totalDebts)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetails && (
        <>
          {/* Alertas e Notificações */}
          {(summary.overdueTransactions.length > 0 || upcomingBills.length > 0) && (
            <div className="space-y-4">
              {/* Transações em Atraso */}
              {summary.overdueTransactions.length > 0 && (
                <Alert className="border-red-200 dark:border-red-800">
                  <AlertDescription>
                    <div className="font-medium text-red-800 dark:text-red-200 mb-2">
                      ⚠️ Você tem {summary.overdueTransactions.length} transação(ões) em atraso
                    </div>
                    <div className="space-y-1">
                      {summary.overdueTransactions.slice(0, 3).map((transaction) => (
                        <div key={transaction.id} className="text-sm">
                          • {transaction.description} - {formatCurrency(transaction.amount)} 
                          ({formatDate(transaction.scheduledDate || transaction.date)})
                        </div>
                      ))}
                      {summary.overdueTransactions.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          ... e mais {summary.overdueTransactions.length - 3} transação(ões)
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Próximas Contas */}
              {upcomingBills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Próximas Contas</CardTitle>
                    <CardDescription>
                      Contas a vencer nos próximos 30 dias
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingBills.map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="font-medium">{bill.description}</div>
                            <div className="text-sm text-muted-foreground">
                              Vence em {formatDate(bill.scheduledDate || bill.date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-600 dark:text-red-400">
                              {formatCurrency(bill.amount)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {bill.type === 'despesa' ? 'Despesa' : 
                               bill.type === 'divida' ? 'Dívida' : 'Cartão'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Resumo Detalhado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumo Mensal */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Mês</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Receitas</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(monthlyData.income)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Despesas</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(monthlyData.expenses)}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Saldo do Mês</span>
                    <span className={`font-bold ${getBalanceColor(monthlyData.balance)}`}>
                      {formatCurrency(monthlyData.balance)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Transações</span>
                    <span>{monthlyData.transactionCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo de Investimentos */}
            {investments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Investimentos</CardTitle>
                  <CardDescription>
                    Performance dos seus investimentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Valor Investido</span>
                      <span className="font-medium">
                        {formatCurrency(investmentData.totalInvested)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Valor Atual</span>
                      <span className="font-medium">
                        {formatCurrency(investmentData.totalCurrentValue)}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Rentabilidade</span>
                      <div className="text-right">
                        <div className={`font-bold ${getPercentageColor(investmentData.returnPercentage)}`}>
                          {investmentData.returnPercentage >= 0 ? '+' : ''}
                          {formatCurrency(investmentData.totalReturn)}
                        </div>
                        <div className={`text-sm ${getPercentageColor(investmentData.returnPercentage)}`}>
                          ({investmentData.returnPercentage >= 0 ? '+' : ''}
                          {formatPercentage(investmentData.returnPercentage)})
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Investimentos Ativos</span>
                      <span>{investments.filter(inv => inv.isActive).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
