import Decimal from 'decimal.js';
import { DiscountedPrice } from '../models/index.js';

/**
 * Discount Service - Handles all e-commerce discount logic
 */
export class DiscountService {
  constructor() {
    // Initialize discount rules and configurations
    this.brandDiscounts = new Map();
    this.categoryDiscounts = new Map();
    this.bankOffers = new Map();
    this.voucherCodes = new Map();
    
    this.initializeDiscountRules();
  }

  /**
   * Initialize default discount rules
   */
  initializeDiscountRules() {
    // Brand-specific discounts
    this.brandDiscounts.set('PUMA', { percentage: 40, min_discount: 40 });
    this.brandDiscounts.set('NIKE', { percentage: 35, min_discount: 35 });
    this.brandDiscounts.set('ADIDAS', { percentage: 30, min_discount: 30 });

    // Category-specific discounts
    this.categoryDiscounts.set('T-shirts', { percentage: 10 });
    this.categoryDiscounts.set('Shoes', { percentage: 15 });
    this.categoryDiscounts.set('Jeans', { percentage: 12 });

    // Bank offers
    this.bankOffers.set('ICICI', { percentage: 10, max_discount: 2000 });
    this.bankOffers.set('HDFC', { percentage: 8, max_discount: 1500 });
    this.bankOffers.set('SBI', { percentage: 5, max_discount: 1000 });

    // Voucher codes
    this.voucherCodes.set('SUPER69', { 
      percentage: 69, 
      max_discount: 5000,
      min_order_value: 1000,
      valid_until: new Date('2025-12-31')
    });
    this.voucherCodes.set('WELCOME20', { 
      percentage: 20, 
      max_discount: 500,
      min_order_value: 500,
      valid_until: new Date('2025-12-31')
    });
  }

  /**
   * Calculate cart discounts with proper precedence
   * Order: Brand/Category -> Voucher -> Bank Offers
   */
  async calculateCartDiscounts(cartItems, customer, paymentInfo = null) {
    try {
      // Calculate original total
      const originalTotal = cartItems.reduce((total, item) => {
        return total.add(item.product.base_price.mul(item.quantity));
      }, new Decimal(0));

      let currentTotal = new Decimal(originalTotal);
      const appliedDiscounts = {};
      const discountMessages = [];

      // Step 1: Apply brand and category discounts (already in current_price)
      const { total: afterBrandCategory, discounts: brandCategoryDiscounts, messages: bcMessages } 
        = this.applyBrandAndCategoryDiscounts(cartItems);
      
      currentTotal = afterBrandCategory;
      Object.assign(appliedDiscounts, brandCategoryDiscounts);
      discountMessages.push(...bcMessages);

      // Step 2: Apply voucher codes (if any in customer profile)
      // For this implementation, assuming voucher code is passed via customer profile
      if (customer.voucherCode) {
        const { total: afterVoucher, discount, message } 
          = await this.applyVoucherDiscount(customer.voucherCode, currentTotal, cartItems, customer);
        
        if (discount.gt(0)) {
          currentTotal = afterVoucher;
          appliedDiscounts[`Voucher_${customer.voucherCode}`] = discount;
          discountMessages.push(message);
        }
      }

      // Step 3: Apply bank offers
      if (paymentInfo && paymentInfo.bank_name) {
        const { total: afterBank, discount, message } 
          = this.applyBankOffer(paymentInfo, currentTotal);
        
        if (discount.gt(0)) {
          currentTotal = afterBank;
          appliedDiscounts[`Bank_${paymentInfo.bank_name}`] = discount;
          discountMessages.push(message);
        }
      }

      return new DiscountedPrice({
        original_price: originalTotal,
        final_price: currentTotal,
        applied_discounts: appliedDiscounts,
        message: discountMessages.join(' | ')
      });

    } catch (error) {
      console.error('Error calculating cart discounts:', error);
      throw new Error('Failed to calculate discounts');
    }
  }

  /**
   * Apply brand and category discounts
   */
  applyBrandAndCategoryDiscounts(cartItems) {
    let total = new Decimal(0);
    const discounts = {};
    const messages = [];

    cartItems.forEach(item => {
      const { product, quantity } = item;
      let itemPrice = product.base_price;
      
      // Apply brand discount
      const brandDiscount = this.brandDiscounts.get(product.brand);
      if (brandDiscount) {
        const discountAmount = itemPrice.mul(brandDiscount.percentage).div(100);
        itemPrice = itemPrice.sub(discountAmount);
        
        const totalBrandDiscount = discountAmount.mul(quantity);
        const discountKey = `Brand_${product.brand}`;
        discounts[discountKey] = (discounts[discountKey] || new Decimal(0)).add(totalBrandDiscount);
        
        if (!messages.find(m => m.includes(product.brand))) {
          messages.push(`${brandDiscount.percentage}% off on ${product.brand}`);
        }
      }

      // Apply category discount
      const categoryDiscount = this.categoryDiscounts.get(product.category);
      if (categoryDiscount) {
        const discountAmount = itemPrice.mul(categoryDiscount.percentage).div(100);
        itemPrice = itemPrice.sub(discountAmount);
        
        const totalCategoryDiscount = discountAmount.mul(quantity);
        const discountKey = `Category_${product.category}`;
        discounts[discountKey] = (discounts[discountKey] || new Decimal(0)).add(totalCategoryDiscount);
        
        if (!messages.find(m => m.includes(product.category))) {
          messages.push(`${categoryDiscount.percentage}% off on ${product.category}`);
        }
      }

      total = total.add(itemPrice.mul(quantity));
    });

    return { total, discounts, messages };
  }

  /**
   * Apply voucher discount
   */
  async applyVoucherDiscount(voucherCode, currentTotal, cartItems, customer) {
    const voucher = this.voucherCodes.get(voucherCode);
    
    if (!voucher) {
      return { total: currentTotal, discount: new Decimal(0), message: '' };
    }

    // Validate voucher
    const isValid = await this.validateDiscountCode(voucherCode, cartItems, customer);
    if (!isValid) {
      return { total: currentTotal, discount: new Decimal(0), message: '' };
    }

    const discountAmount = currentTotal.mul(voucher.percentage).div(100);
    const actualDiscount = Decimal.min(discountAmount, voucher.max_discount || discountAmount);
    const finalTotal = currentTotal.sub(actualDiscount);

    return {
      total: finalTotal,
      discount: actualDiscount,
      message: `${voucher.percentage}% off with ${voucherCode}`
    };
  }

  /**
   * Apply bank offer discount
   */
  applyBankOffer(paymentInfo, currentTotal) {
    const bankOffer = this.bankOffers.get(paymentInfo.bank_name);
    
    if (!bankOffer || paymentInfo.method !== 'CARD') {
      return { total: currentTotal, discount: new Decimal(0), message: '' };
    }

    const discountAmount = currentTotal.mul(bankOffer.percentage).div(100);
    const actualDiscount = Decimal.min(discountAmount, bankOffer.max_discount || discountAmount);
    const finalTotal = currentTotal.sub(actualDiscount);

    return {
      total: finalTotal,
      discount: actualDiscount,
      message: `${bankOffer.percentage}% instant discount on ${paymentInfo.bank_name} card`
    };
  }

  /**
   * Validate discount code
   */
  async validateDiscountCode(code, cartItems, customer) {
    try {
      const voucher = this.voucherCodes.get(code);
      
      if (!voucher) {
        return false;
      }

      // Check expiry
      if (voucher.valid_until && new Date() > voucher.valid_until) {
        return false;
      }

      // Check minimum order value against original cart value
      const cartTotal = cartItems.reduce((total, item) => {
        return total.add(item.product.base_price.mul(item.quantity));
      }, new Decimal(0));

      if (voucher.min_order_value && cartTotal.lt(voucher.min_order_value)) {
        return false;
      }

      // Additional validations can be added here:
      // - Brand exclusions
      // - Category restrictions
      // - Customer tier requirements
      // - Usage limits per customer

      return true;

    } catch (error) {
      console.error('Error validating discount code:', error);
      return false;
    }
  }

  /**
   * Get available discounts for a cart
   */
  getAvailableDiscounts(cartItems, customer) {
    const availableDiscounts = {
      brands: [],
      categories: [],
      vouchers: [],
      banks: []
    };

    // Brand discounts
    const uniqueBrands = [...new Set(cartItems.map(item => item.product.brand))];
    uniqueBrands.forEach(brand => {
      if (this.brandDiscounts.has(brand)) {
        availableDiscounts.brands.push({
          brand,
          discount: this.brandDiscounts.get(brand)
        });
      }
    });

    // Category discounts
    const uniqueCategories = [...new Set(cartItems.map(item => item.product.category))];
    uniqueCategories.forEach(category => {
      if (this.categoryDiscounts.has(category)) {
        availableDiscounts.categories.push({
          category,
          discount: this.categoryDiscounts.get(category)
        });
      }
    });

    return availableDiscounts;
  }
} 