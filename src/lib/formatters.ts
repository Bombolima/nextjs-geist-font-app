import { TransactionType, AccountType, InvestmentType, TransactionStatus } from '@/types/financial';

// Formatação de moeda
export const formatCurrency = (
  amount: number, 
  currency: string = 'BRL',
  showSymbol: boolean = true
): string => {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

// Formatação de moeda compacta (ex: 1.2K, 1.5M)
export const formatCurrencyCompact = (amount: number, currency: string = 'BRL'): string => {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    compactDisplay: 'short',
  });
  
  return formatter.format(amount);
};

// Formatação de percentual
export const formatPercentage = (
  value: number, 
  decimals: number = 2,
  showSign: boolean = false
): string => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

// Formatação de data
export const formatDate = (
  date: Date | string, 
  format: 'short' | 'long' | 'numeric' | 'relative' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    
    case 'long':
      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    
    case 'numeric':
      return dateObj.toLocaleDateString('pt-BR');
    
    case 'relative':
      return formatRelativeDate(dateObj);
    
    default:
      return dateObj.toLocaleDateString('pt-BR');
  }
};

// Formatação de data relativa (ex: "há 2 dias", "em 3 dias")
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Hoje';
  } else if (diffInDays === 1) {
    return 'Amanhã';
  } else if (diffInDays === -1) {
    return 'Ontem';
  } else if (diffInDays > 1) {
    return `Em ${diffInDays} dias`;
  } else {
    return `Há ${Math.abs(diffInDays)} dias`;
  }
};

// Formatação de hora
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formatação de data e hora
export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} às ${formatTime(date)}`;
};

// Formatação de período (mês/ano)
export const formatPeriod = (month: number, year: number): string => {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
};

// Formatação de números
export const formatNumber = (
  value: number, 
  decimals: number = 0,
  compact: boolean = false
): string => {
  const formatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard',
  });
  
  return formatter.format(value);
};

// Formatação de tipos de transação
export const formatTransactionType = (type: TransactionType): string => {
  const typeLabels: Record<TransactionType, string> = {
    receita: 'Receita',
    despesa: 'Despesa',
    divida: 'Dívida',
    credito: 'Crédito',
    investimento: 'Investimento',
    cartao_credito: 'Cartão de Crédito',
    transferencia: 'Transferência',
  };
  
  return typeLabels[type] || type;
};

// Formatação de status de transação
export const formatTransactionStatus = (status: TransactionStatus): string => {
  const statusLabels: Record<TransactionStatus, string> = {
    pendente: 'Pendente',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  };
  
  return statusLabels[status] || status;
};

// Formatação de tipos de conta
export const formatAccountType = (type: AccountType): string => {
  const typeLabels: Record<AccountType, string> = {
    conta_corrente: 'Conta Corrente',
    poupanca: 'Poupança',
    investimento: 'Investimento',
    cartao_credito: 'Cartão de Crédito',
  };
  
  return typeLabels[type] || type;
};

// Formatação de tipos de investimento
export const formatInvestmentType = (type: InvestmentType): string => {
  const typeLabels: Record<InvestmentType, string> = {
    renda_fixa: 'Renda Fixa',
    renda_variavel: 'Renda Variável',
    fundos: 'Fundos',
    criptomoedas: 'Criptomoedas',
    outros: 'Outros',
  };
  
  return typeLabels[type] || type;
};

// Formatação de frequência de recorrência
export const formatRecurringFrequency = (frequency: string): string => {
  const frequencyLabels: Record<string, string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual',
  };
  
  return frequencyLabels[frequency] || frequency;
};

// Formatação de parcelas
export const formatInstallments = (current: number, total: number): string => {
  return `${current}/${total}`;
};

// Formatação de texto truncado
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Formatação de iniciais do nome
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Formatação de cor baseada no valor
export const getAmountColor = (amount: number, type: TransactionType): string => {
  if (type === 'receita' || type === 'credito') {
    return 'text-green-600 dark:text-green-400';
  } else if (type === 'despesa' || type === 'divida' || type === 'cartao_credito') {
    return 'text-red-600 dark:text-red-400';
  } else if (type === 'investimento') {
    return 'text-blue-600 dark:text-blue-400';
  }
  return 'text-gray-600 dark:text-gray-400';
};

// Formatação de cor baseada no status
export const getStatusColor = (status: TransactionStatus): string => {
  switch (status) {
    case 'concluida':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
    case 'pendente':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
    case 'cancelada':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
  }
};

// Formatação de cor para percentuais
export const getPercentageColor = (percentage: number): string => {
  if (percentage > 0) {
    return 'text-green-600 dark:text-green-400';
  } else if (percentage < 0) {
    return 'text-red-600 dark:text-red-400';
  }
  return 'text-gray-600 dark:text-gray-400';
};

// Formatação de tamanho de arquivo
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

// Formatação de duração
export const formatDuration = (startDate: Date, endDate: Date): string => {
  const diffInMs = endDate.getTime() - startDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInMonths / 12);
  
  if (diffInYears > 0) {
    const remainingMonths = diffInMonths % 12;
    return remainingMonths > 0 
      ? `${diffInYears} ano${diffInYears > 1 ? 's' : ''} e ${remainingMonths} mês${remainingMonths > 1 ? 'es' : ''}`
      : `${diffInYears} ano${diffInYears > 1 ? 's' : ''}`;
  } else if (diffInMonths > 0) {
    return `${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''}`;
  } else {
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  }
};

// Formatação de progresso
export const formatProgress = (current: number, target: number): string => {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  return `${formatPercentage(percentage)} (${formatCurrency(current)} de ${formatCurrency(target)})`;
};

// Validação e formatação de CPF
export const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Validação e formatação de CNPJ
export const formatCNPJ = (cnpj: string): string => {
  const numbers = cnpj.replace(/\D/g, '');
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

// Formatação de telefone
export const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

// Formatação de CEP
export const formatCEP = (cep: string): string => {
  const numbers = cep.replace(/\D/g, '');
  return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
};

// Função para capitalizar primeira letra
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Função para capitalizar todas as palavras
export const capitalizeWords = (text: string): string => {
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

// Formatação de slug (URL amigável)
export const formatSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
};
