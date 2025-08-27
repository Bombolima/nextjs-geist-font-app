'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Transaction, TransactionType, TransactionStatus, Account, Category } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';

// Schema de validação
const transactionSchema = z.object({
  type: z.enum(['receita', 'despesa', 'divida', 'credito', 'investimento', 'cartao_credito', 'transferencia']),
  description: z.string().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  date: z.date(),
  scheduledDate: z.date().optional(),
  status: z.enum(['pendente', 'concluida', 'cancelada']),
  isRecurring: z.boolean(),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurringEndDate: z.date().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  installments: z.number().min(1).max(360).optional(),
  currentInstallment: z.number().min(1).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notas muito longas').optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  transaction?: Transaction;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function TransactionForm({
  accounts,
  categories,
  transaction,
  onSubmit,
  onCancel,
  isLoading = false,
}: TransactionFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction ? {
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      date: new Date(transaction.date),
      scheduledDate: transaction.scheduledDate ? new Date(transaction.scheduledDate) : undefined,
      status: transaction.status,
      isRecurring: transaction.isRecurring,
      recurringFrequency: transaction.recurringFrequency,
      recurringEndDate: transaction.recurringEndDate ? new Date(transaction.recurringEndDate) : undefined,
      interestRate: transaction.interestRate,
      installments: transaction.installments,
      currentInstallment: transaction.currentInstallment,
      tags: transaction.tags || [],
      notes: transaction.notes,
    } : {
      type: 'despesa',
      status: 'concluida',
      date: new Date(),
      isRecurring: false,
      tags: [],
    },
  });

  const watchedType = watch('type');
  const watchedIsRecurring = watch('isRecurring');
  const watchedTags = watch('tags') || [];

  // Filtrar categorias por tipo de transação
  const filteredCategories = categories.filter(cat => cat.type === watchedType);

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      await onSubmit({
        ...data,
        tags: data.tags?.filter(tag => tag.trim() !== '') || [],
      });
      if (!transaction) {
        reset();
        setTagInput('');
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const getTypeColor = (type: TransactionType) => {
    const colors = {
      receita: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      despesa: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      divida: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      credito: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      investimento: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      cartao_credito: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      transferencia: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[type];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {transaction ? 'Editar Transação' : 'Nova Transação'}
          {watchedType && (
            <Badge className={getTypeColor(watchedType)}>
              {watchedType.charAt(0).toUpperCase() + watchedType.slice(1).replace('_', ' ')}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {transaction 
            ? 'Edite os dados da transação abaixo'
            : 'Preencha os dados para criar uma nova transação'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Transação</Label>
              <Select
                value={watchedType}
                onValueChange={(value) => setValue('type', value as TransactionType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="divida">Dívida</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as TransactionStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Compra no supermercado"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                {...register('date', { valueAsDate: true })}
              />
              {errors.date && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountId">Conta</Label>
              <Select
                value={watch('accountId')}
                onValueChange={(value) => setValue('accountId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(acc => acc.isActive).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.accountId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria</Label>
              <Select
                value={watch('categoryId')}
                onValueChange={(value) => setValue('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
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
              {errors.categoryId && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.categoryId.message}</p>
              )}
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Configurações Avançadas</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                {/* Recorrência */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRecurring"
                    checked={watchedIsRecurring}
                    onCheckedChange={(checked) => setValue('isRecurring', checked)}
                  />
                  <Label htmlFor="isRecurring">Transação recorrente</Label>
                </div>

                {watchedIsRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurringFrequency">Frequência</Label>
                      <Select
                        value={watch('recurringFrequency')}
                        onValueChange={(value) => setValue('recurringFrequency', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurringEndDate">Data de término</Label>
                      <Input
                        id="recurringEndDate"
                        type="date"
                        {...register('recurringEndDate', { valueAsDate: true })}
                      />
                    </div>
                  </div>
                )}

                {/* Data agendada */}
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Data agendada (opcional)</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    {...register('scheduledDate', { valueAsDate: true })}
                  />
                </div>

                {/* Juros e Parcelas */}
                {(watchedType === 'divida' || watchedType === 'credito') && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Taxa de juros (% a.m.)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0,00"
                        {...register('interestRate', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="installments">Total de parcelas</Label>
                      <Input
                        id="installments"
                        type="number"
                        min="1"
                        max="360"
                        {...register('installments', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentInstallment">Parcela atual</Label>
                      <Input
                        id="currentInstallment"
                        type="number"
                        min="1"
                        {...register('currentInstallment', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Adicionar
                    </Button>
                  </div>
                  {watchedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchedTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-xs hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observações adicionais..."
                    rows={3}
                    {...register('notes')}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.notes.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="min-w-[120px]"
            >
              {isSubmitting || isLoading ? 'Salvando...' : transaction ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
