export declare enum SystemRole {
    ROOT = "ROOT",
    SUPER_ADMIN = "SUPER_ADMIN",
    WEBSITE_MANAGER = "WEBSITE_MANAGER",
    COMMERCIAL = "COMMERCIAL",
    MARKETING = "MARKETING",
    SALESPERSON = "SALESPERSON",
    CLIENT = "CLIENT",
    STOCK_MANAGER = "STOCK_MANAGER",
    CASHIER = "CASHIER",
    ACCOUNTANT = "ACCOUNTANT"
}
export declare enum ProductStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    OUT_OF_STOCK = "OUT_OF_STOCK",
    DISCONTINUED = "DISCONTINUED"
}
export declare enum OrderStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    PROCESSING = "PROCESSING",
    PREPARING = "PREPARING",
    READY_FOR_SHIPMENT = "READY_FOR_SHIPMENT",
    SHIPPED = "SHIPPED",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    RETURN_REQUESTED = "RETURN_REQUESTED",
    RETURNED = "RETURNED",
    REFUNDED = "REFUNDED",
    FAILED = "FAILED"
}
export declare enum OrderChannel {
    ONLINE = "ONLINE",
    POS = "POS",
    PHONE = "PHONE",
    IMPORT = "IMPORT"
}
export declare enum PaymentMethod {
    CARD_ONLINE = "CARD_ONLINE",
    CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
    BANK_TRANSFER = "BANK_TRANSFER",
    POS_CARD = "POS_CARD",
    POS_CASH = "POS_CASH",
    INTERNAL = "INTERNAL"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    PARTIAL_REFUND = "PARTIAL_REFUND"
}
export declare enum StockMovementType {
    PURCHASE_IN = "PURCHASE_IN",
    SALE_OUT = "SALE_OUT",
    ADJUSTMENT_IN = "ADJUSTMENT_IN",
    ADJUSTMENT_OUT = "ADJUSTMENT_OUT",
    TRANSFER_IN = "TRANSFER_IN",
    TRANSFER_OUT = "TRANSFER_OUT",
    RETURN_IN = "RETURN_IN",
    RETURN_OUT = "RETURN_OUT",
    DAMAGE = "DAMAGE",
    COUNTING_CORRECTION = "COUNTING_CORRECTION",
    RESERVED = "RESERVED",
    UNRESERVED = "UNRESERVED"
}
export declare enum DeliveryStatus {
    ASSIGNED = "ASSIGNED",
    PICKED_UP = "PICKED_UP",
    IN_TRANSIT = "IN_TRANSIT",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    FAILED_ATTEMPT = "FAILED_ATTEMPT",
    RETURNED_TO_WAREHOUSE = "RETURNED_TO_WAREHOUSE",
    CANCELLED = "CANCELLED"
}
export declare enum CouponType {
    PERCENTAGE = "PERCENTAGE",
    FIXED_AMOUNT = "FIXED_AMOUNT",
    FREE_SHIPPING = "FREE_SHIPPING"
}
export interface UserJwtPayload {
    sub: string;
    id?: string;
    email: string;
    roles: string[];
    permissions: string[];
    warehouseId?: string | null;
    posId?: string | null;
    sessionId: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message?: string;
    data: T;
    meta?: {
        timestamp: string;
        path: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}
export interface HealthStatus {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
    environment: string;
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
}
export interface AuditableEntity {
    createdAt: Date | string;
    updatedAt: Date | string;
    createdBy?: string | null;
    updatedBy?: string | null;
    isUpdated: boolean;
    isDeleted: boolean;
    deletedAt?: Date | string | null;
    deletedBy?: string | null;
}
export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    RESTORE = "RESTORE",
    TOGGLE_VISIBILITY = "TOGGLE_VISIBILITY",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    EXPORT = "EXPORT",
    PRINT = "PRINT",
    BULK_DELETE = "BULK_DELETE"
}
export interface AuditLogItem {
    id: string;
    actorId?: string | null;
    actorEmail?: string | null;
    actorName?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    tableName?: string | null;
    description?: string | null;
    before?: Record<string, any> | null;
    after?: Record<string, any> | null;
    diffJson?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date | string;
}
//# sourceMappingURL=index.d.ts.map