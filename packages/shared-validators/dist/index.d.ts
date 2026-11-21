import { z } from 'zod';
import { PaymentMethod } from '@royal/shared-types';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginDto = z.infer<typeof loginSchema>;
export declare const registerSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
}>;
export type RegisterDto = z.infer<typeof registerSchema>;
export declare const guestCheckoutSchema: z.ZodObject<{
    guestName: z.ZodString;
    guestEmail: z.ZodString;
    guestPhone: z.ZodString;
    street: z.ZodString;
    city: z.ZodString;
    postalCode: z.ZodOptional<z.ZodString>;
    country: z.ZodDefault<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodDefault<z.ZodNativeEnum<typeof PaymentMethod>>;
}, "strip", z.ZodTypeAny, {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    street: string;
    city: string;
    country: string;
    paymentMethod: PaymentMethod;
    postalCode?: string | undefined;
    notes?: string | undefined;
}, {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    street: string;
    city: string;
    postalCode?: string | undefined;
    country?: string | undefined;
    notes?: string | undefined;
    paymentMethod?: PaymentMethod | undefined;
}>;
export type GuestCheckoutDto = z.infer<typeof guestCheckoutSchema>;
//# sourceMappingURL=index.d.ts.map