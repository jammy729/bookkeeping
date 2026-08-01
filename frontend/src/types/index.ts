export interface Expense {
  id: string
  date: string
  description: string
  amount: number
  categoryId: string
  notes?: string
  isRecurring: boolean
  recurrenceFrequency?: string | null
  nextOccurrence?: string | null
  createdAt: string
  updatedAt: string
  category?: Category
  attachments?: Attachment[]
}

export interface Income {
  id: string
  date: string
  description: string
  amount: number
  type: string
  clientName?: string
  invoiceNumber?: string
  isPaid?: boolean
  paidDate?: string
  includesHst?: boolean
  hstAmount?: number
  notes?: string
  createdAt: string
  updatedAt: string
  category?: Category
  client?: Client
}

export interface Category {
  id: string
  name: string
  type: string
  color?: string
  description?: string
}

export interface Client {
  id: string
  name: string
  email?: string
  company?: string
  phone?: string
  address?: string
  notes?: string
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  name: string | null
  amount: number
  spent: number
  period: string
  categoryId?: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  category?: Category
}

export interface Attachment {
  id: string
  originalName: string
  fileName: string
  mimeType: string
  size: number
  description?: string
  entityType?: string
  entityId?: string
  createdAt: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "expense" | "income"
  category?: Category
  attachments?: Attachment[]
}

export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  transactionCount: number
  incomeCount: number
  expenseCount: number
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}
