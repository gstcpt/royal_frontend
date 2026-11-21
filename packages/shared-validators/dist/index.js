"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestCheckoutSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const shared_types_1 = require("@royal/shared-types");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Format email invalide').toLowerCase(),
    password: zod_1.z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});
exports.registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: zod_1.z.string().email('Format email invalide').toLowerCase(),
    password: zod_1.z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    phone: zod_1.z.string().optional(),
});
exports.guestCheckoutSchema = zod_1.z.object({
    guestName: zod_1.z.string().min(2, 'Le nom complet est obligatoire'),
    guestEmail: zod_1.z.string().email('Format email invalide').toLowerCase(),
    guestPhone: zod_1.z.string().min(6, 'Numéro de téléphone obligatoire'),
    street: zod_1.z.string().min(3, 'Adresse requise'),
    city: zod_1.z.string().min(2, 'Ville requise'),
    postalCode: zod_1.z.string().optional(),
    country: zod_1.z.string().default('TN'),
    notes: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.nativeEnum(shared_types_1.PaymentMethod).default(shared_types_1.PaymentMethod.CASH_ON_DELIVERY),
});
//# sourceMappingURL=index.js.map