'use client';

import { useState } from 'react';
import { Transaction, Account, Category, TransactionFilters, SortOptions } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  formatCurrency, 
  formatDate, 
  formatTransactionType, 
  formatTransactionStatus,
  getAmountColor,
  getStatusColor,
  truncateText 
} from '@/lib/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  onStatusChange?: (transactionId: string, status: Transaction['status']) => void;
  isLoading?: boolean;
  showFilters?: boolean;
  showBulkActions?: boolean;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
  showFilters = true,
  showBulkActions = false,
}: TransactionListProps) {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'date', direction: 'desc' });
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Aplicar filtros e ordenação
  const filteredTransactions = transactions
    .filter(transaction => {
      // Filtro de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesDescription = transaction.description.toLowerCase().includes(searchLower);
        const matchesAmount = transaction.amount.toString().includes(searchTerm);
        const matchesTags = transaction.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesDescription && !matchesAmount && !matchesTags) {
          return false;
        }
      }

      // Filtros específicos
      if (filters.type && filters.type.length > 0 && !filters.type.includes(transaction.type)) {
        return false;
      }

      if (filters.accountId && filters.accountId.length > 0 && !filters.accountId.includes(transaction.accountId)) {
        return false;
      }

      if (filters.categoryId && filters.categoryId.length > 0 && !filters.categoryId.includes(transaction.categoryId)) {
        return false;
      }

      if (filters.status && filters.status.length > 0 && !filters.status.includes(transaction.status)) {
        return false;
      }

      if (filters.dateFrom && new Date(transaction.date) < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && new Date(transaction.date) > filters.dateTo) {
        return false;
      }

      if (filters.amountMin !== undefined && transaction.amount < filters.amountMin) {
        return false;
      }

      if (filters.amountMax !== undefined && transaction.amount > filters.amountMax) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
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

  const getAccountName = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.name || 'Conta não encontrada';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Categoria não encontrada';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#6b7280';
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleBulkDelete = () => {
    selectedTransactions.forEach(id => {
      onDelete?.(id);
    });
    setSelectedTransactions([]);
  };

  const handleBulkStatusChange = (status: Transaction['status']) => {
    selectedTransactions.forEach(id => {
      onStatusChange?.(id, status);
    });
    setSelectedTransactions([]);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Carregando transações...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por descrição, valor ou tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={filters.type?.[0] || ''}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      type: value ? [value as Transaction['type']] : undefined 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="divida">Dívida</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status?.[0] || ''}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      status: value ? [value as Transaction['status']] : undefined 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conta */}
              <div className="space-y-2">
                <Label>Conta</Label>
                <Select
                  value={filters.accountId?.[0] || ''}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      accountId: value ? [value] : undefined 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as contas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as contas</SelectItem>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={filters.categoryId?.[0] || ''}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      categoryId: value ? [value] : undefined 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Período */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Data inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      dateFrom: e.target.value ? new Date(e.target.value) : undefined 
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">Data final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      dateTo: e.target.value ? new Date(e.target.value) : undefined 
                    }))
                  }
                />
              </div>
            </div>

            {/* Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountMin">Valor mínimo</Label>
                <Input
                  id="amountMin"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={filters.amountMin || ''}
                  onChange={(e) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      amountMin: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountMax">Valor máximo</Label>
                <Input
                  id="amountMax"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={filters.amountMax || ''}
                  onChange={(e) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      amountMax: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Transações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Transações ({filteredTransactions.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Ordenação */}
            <Select
              value={`${sort.field}-${sort.direction}`}
              onValueChange={(value) => {
                const [field, direction] = value.split('-');
                setSort({ field: field as SortOptions['field'], direction: direction as 'asc' | 'desc' });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Data (mais recente)</SelectItem>
                <SelectItem value="date-asc">Data (mais antiga)</SelectItem>
                <SelectItem value="amount-desc">Valor (maior)</SelectItem>
                <SelectItem value="amount-asc">Valor (menor)</SelectItem>
                <SelectItem value="description-asc">Descrição (A-Z)</SelectItem>
                <SelectItem value="description-desc">Descrição (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            {/* Ações em lote */}
            {showBulkActions && selectedTransactions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Ações ({selectedTransactions.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('concluida')}>
                    Marcar como concluída
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('pendente')}>
                    Marcar como pendente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('cancelada')}>
                    Marcar como cancelada
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleBulkDelete}
                    className="text-red-600 dark:text-red-400"
                  >
                    Excluir selecionadas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {transactions.length === 0 
                ? 'Nenhuma transação encontrada. Crie sua primeira transação!'
                : 'Nenhuma transação corresponde aos filtros aplicados.'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showBulkActions && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTransactions.length === filteredTransactions.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      {showBulkActions && (
                        <TableCell>
                          <Checkbox
                            checked={selectedTransactions.includes(transaction.id)}
                            onCheckedChange={(checked) => 
                              handleSelectTransaction(transaction.id, checked as boolean)
                            }
                          />
                        </TableCell>
                      )}
                      
                      <TableCell className="font-medium">
                        {formatDate(transaction.date)}
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {truncateText(transaction.description, 30)}
                          </div>
                          {transaction.tags && transaction.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {transaction.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {transaction.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{transaction.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {formatTransactionType(transaction.type)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getCategoryColor(transaction.categoryId) }}
                          />
                          {getCategoryName(transaction.categoryId)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getAccountName(transaction.accountId)}
                      </TableCell>
                      
                      <TableCell className={`text-right font-medium ${getAmountColor(transaction.amount, transaction.type)}`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {formatTransactionStatus(transaction.status)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              ⋯
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                                Editar
                              </DropdownMenuItem>
                            )}
                            
                            {onStatusChange && transaction.status !== 'concluida' && (
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(transaction.id, 'concluida')}
                              >
                                Marcar como concluída
                              </DropdownMenuItem>
                            )}
                            
                            {onStatusChange && transaction.status !== 'pendente' && (
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(transaction.id, 'pendente')}
                              >
                                Marcar como pendente
                              </DropdownMenuItem>
                            )}
                            
                            {onDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a transação "{transaction.description}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => onDelete(transaction.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
