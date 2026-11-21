"use strict";
// ==============================================================================
// ROYAL CORE SHARED TYPES
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = exports.CouponType = exports.DeliveryStatus = exports.StockMovementType = exports.PaymentStatus = exports.PaymentMethod = exports.OrderChannel = exports.OrderStatus = exports.ProductStatus = exports.SystemRole = void 0;
var SystemRole;
(function (SystemRole) {
    SystemRole["ROOT"] = "ROOT";
    SystemRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    SystemRole["WEBSITE_MANAGER"] = "WEBSITE_MANAGER";
    SystemRole["ADMIN"] = "ADMIN";
    SystemRole["COMMERCIAL"] = "COMMERCIAL";
    SystemRole["SALESPERSON"] = "SALESPERSON";
    SystemRole["CLIENT"] = "CLIENT";
    SystemRole["DELIVERY_MANAGER"] = "DELIVERY_MANAGER";
    SystemRole["DELIVERY_AGENT"] = "DELIVERY_AGENT";
    SystemRole["STOCK_MANAGER"] = "STOCK_MANAGER";
    SystemRole["CASHIER"] = "CASHIER";
    SystemRole["ACCOUNTANT"] = "ACCOUNTANT";
})(SystemRole || (exports.SystemRole = SystemRole = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["INACTIVE"] = "INACTIVE";
    ProductStatus["OUT_OF_STOCK"] = "OUT_OF_STOCK";
    ProductStatus["DISCONTINUED"] = "DISCONTINUED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["PROCESSING"] = "PROCESSING";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY_FOR_SHIPMENT"] = "READY_FOR_SHIPMENT";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["OUT_FOR_DELIVERY"] = "OUT_FOR_DELIVERY";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["RETURN_REQUESTED"] = "RETURN_REQUESTED";
    OrderStatus["RETURNED"] = "RETURNED";
    OrderStatus["REFUNDED"] = "REFUNDED";
    OrderStatus["FAILED"] = "FAILED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var OrderChannel;
(function (OrderChannel) {
    OrderChannel["ONLINE"] = "ONLINE";
    OrderChannel["POS"] = "POS";
    OrderChannel["PHONE"] = "PHONE";
    OrderChannel["IMPORT"] = "IMPORT";
})(OrderChannel || (exports.OrderChannel = OrderChannel = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD_ONLINE"] = "CARD_ONLINE";
    PaymentMethod["CASH_ON_DELIVERY"] = "CASH_ON_DELIVERY";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["POS_CARD"] = "POS_CARD";
    PaymentMethod["POS_CASH"] = "POS_CASH";
    PaymentMethod["INTERNAL"] = "INTERNAL";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["PARTIAL_REFUND"] = "PARTIAL_REFUND";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var StockMovementType;
(function (StockMovementType) {
    StockMovementType["PURCHASE_IN"] = "PURCHASE_IN";
    StockMovementType["SALE_OUT"] = "SALE_OUT";
    StockMovementType["ADJUSTMENT_IN"] = "ADJUSTMENT_IN";
    StockMovementType["ADJUSTMENT_OUT"] = "ADJUSTMENT_OUT";
    StockMovementType["TRANSFER_IN"] = "TRANSFER_IN";
    StockMovementType["TRANSFER_OUT"] = "TRANSFER_OUT";
    StockMovementType["RETURN_IN"] = "RETURN_IN";
    StockMovementType["RETURN_OUT"] = "RETURN_OUT";
    StockMovementType["DAMAGE"] = "DAMAGE";
    StockMovementType["COUNTING_CORRECTION"] = "COUNTING_CORRECTION";
    StockMovementType["RESERVED"] = "RESERVED";
    StockMovementType["UNRESERVED"] = "UNRESERVED";
})(StockMovementType || (exports.StockMovementType = StockMovementType = {}));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["ASSIGNED"] = "ASSIGNED";
    DeliveryStatus["PICKED_UP"] = "PICKED_UP";
    DeliveryStatus["IN_TRANSIT"] = "IN_TRANSIT";
    DeliveryStatus["OUT_FOR_DELIVERY"] = "OUT_FOR_DELIVERY";
    DeliveryStatus["DELIVERED"] = "DELIVERED";
    DeliveryStatus["FAILED_ATTEMPT"] = "FAILED_ATTEMPT";
    DeliveryStatus["RETURNED_TO_WAREHOUSE"] = "RETURNED_TO_WAREHOUSE";
    DeliveryStatus["CANCELLED"] = "CANCELLED";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
var CouponType;
(function (CouponType) {
    CouponType["PERCENTAGE"] = "PERCENTAGE";
    CouponType["FIXED_AMOUNT"] = "FIXED_AMOUNT";
    CouponType["FREE_SHIPPING"] = "FREE_SHIPPING";
})(CouponType || (exports.CouponType = CouponType = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["RESTORE"] = "RESTORE";
    AuditAction["TOGGLE_VISIBILITY"] = "TOGGLE_VISIBILITY";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["EXPORT"] = "EXPORT";
    AuditAction["PRINT"] = "PRINT";
    AuditAction["BULK_DELETE"] = "BULK_DELETE";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
//# sourceMappingURL=index.js.map