import { z } from 'zod';
import { SystemRole, OrderStatus, PaymentMethod } from '@royal/shared-types';

export const loginSchema = z.object({
  email: z.string().email('Format email invalide').toLowerCase(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Format email invalide').toLowerCase(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  phone: z.string().optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const guestCheckoutSchema = z.object({
  guestName: z.string().min(2, 'Le nom complet est obligatoire'),
  guestEmail: z.string().email('Format email invalide').toLowerCase(),
  guestPhone: z.string().min(6, 'Numéro de téléphone obligatoire'),
  street: z.string().min(3, 'Adresse requise'),
  city: z.string().min(2, 'Ville requise'),
  postalCode: z.string().optional(),
  country: z.string().default('TN'),
  notes: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH_ON_DELIVERY),
});

export type GuestCheckoutDto = z.infer<typeof guestCheckoutSchema>;
