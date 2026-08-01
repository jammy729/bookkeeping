import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateError = 'Invalid date format (YYYY-MM-DD)';

// ── Expense ──────────────────────────────────────────
const recurrenceFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as const;

export const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().regex(dateRegex, dateError),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceFrequency: z.enum(recurrenceFrequencies).optional(),
  nextOccurrence: z.string().regex(dateRegex, dateError).optional().or(z.literal('')),
});

// ── Income ───────────────────────────────────────────
const incomeTypes = ['contractor_payment', 'freelance', 'consulting', 'other'] as const;

export const incomeSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().regex(dateRegex, dateError),
  type: z.enum(incomeTypes, {
    errorMap: () => ({ message: 'Income type is required' }),
  }),
  clientName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  isPaid: z.boolean().optional().default(false),
  paidDate: z.string().regex(dateRegex, dateError).optional(),
  notes: z.string().optional(),
  hstAmount: z.coerce.number().min(0).optional(),
  includesHst: z.boolean().optional().default(false),
});

// ── Category ─────────────────────────────────────────
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['expense', 'income'], {
    errorMap: () => ({ message: 'Type must be expense or income' }),
  }),
  description: z.string().optional(),
});

// ── Client ───────────────────────────────────────────
export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
});

// ── Auth ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ── Budget ───────────────────────────────────────────
const budgetPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const;

export const budgetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  period: z.enum(budgetPeriods, {
    errorMap: () => ({ message: 'Period is required' }),
  }),
  startDate: z.string().regex(dateRegex, dateError),
  endDate: z.string().regex(dateRegex, dateError),
  categoryId: z.string().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// ── Invoice ──────────────────────────────────────────
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Price must be non-negative'),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().default(''),
  clientAddress: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  issueDate: z.string().regex(dateRegex, dateError),
  dueDate: z.string().regex(dateRegex, dateError).optional().or(z.literal('')),
  notes: z.string().optional(),
  terms: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
});

// ── Settings ─────────────────────────────────────────
export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ── Types ────────────────────────────────────────────
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type IncomeFormData = z.infer<typeof incomeSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
