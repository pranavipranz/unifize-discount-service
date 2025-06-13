import Decimal from 'decimal.js';

/**
 * Enum for Brand Tiers
 */
export const BrandTier = {
  PREMIUM: 'premium',
  REGULAR: 'regular',
  BUDGET: 'budget'
};

/**
 * Product model
 */
export class Product {
  constructor({
    id,
    brand,
    brand_tier,
    category,
    base_price,
    current_price
  }) {
    this.id = id;
    this.brand = brand;
    this.brand_tier = brand_tier;
    this.category = category;
    this.base_price = new Decimal(base_price);
    this.current_price = new Decimal(current_price);
  }
}

/**
 * Cart Item model
 */
export class CartItem {
  constructor({
    product,
    quantity,
    size
  }) {
    this.product = product;
    this.quantity = quantity;
    this.size = size;
  }

  getTotalPrice() {
    return this.product.current_price.mul(this.quantity);
  }
}

/**
 * Payment Information model
 */
export class PaymentInfo {
  constructor({
    method,
    bank_name = null,
    card_type = null
  }) {
    this.method = method; // CARD, UPI, etc
    this.bank_name = bank_name;
    this.card_type = card_type; // CREDIT, DEBIT
  }
}

/**
 * Customer Profile model (missing from original spec but needed)
 */
export class CustomerProfile {
  constructor({
    id,
    tier = 'regular',
    email,
    phone,
    is_premium_member = false,
    voucherCode = null
  }) {
    this.id = id;
    this.tier = tier;
    this.email = email;
    this.phone = phone;
    this.is_premium_member = is_premium_member;
    this.voucherCode = voucherCode;
  }
}

/**
 * Discounted Price result model
 */
export class DiscountedPrice {
  constructor({
    original_price,
    final_price,
    applied_discounts = {},
    message = ''
  }) {
    this.original_price = new Decimal(original_price);
    this.final_price = new Decimal(final_price);
    this.applied_discounts = applied_discounts; // discount_name -> amount
    this.message = message;
  }

  getTotalDiscount() {
    return Object.values(this.applied_discounts)
      .reduce((total, discount) => total.add(discount), new Decimal(0));
  }

  getDiscountPercentage() {
    if (this.original_price.isZero()) return new Decimal(0);
    return this.getTotalDiscount().div(this.original_price).mul(100);
  }
} 