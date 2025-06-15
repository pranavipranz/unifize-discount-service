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
   * @param {Array} cartItems - Array of cart items
   * @param {Object} customer - Customer profile
   * @param {Object} paymentInfo - Payment information (optional)
   * @returns {DiscountedPrice} Final pricing with applied discounts
   * @throws {Error} If required parameters are missing or invalid
   */
  async calculateCartDiscounts(cartItems, customer, paymentInfo = null) {
    try {
      // Input validation
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error('Cart items are required and must be a non-empty array');
      }
      
      if (!customer || typeof customer !== 'object') {
        throw new Error('Customer profile is required');
      }

      // Calculate original total
      const originalTotal = cartItems.reduce((total, item) => {
        if (!item.product || !item.product.base_price || !item.quantity) {
          throw new Error('Invalid cart item: missing product or quantity information');
        }
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
        const { total: afterVoucher, discount, message, error } 
          = await this.applyVoucherDiscount(customer.voucherCode, currentTotal, cartItems, customer);
        
        if (discount.gt(0)) {
          currentTotal = afterVoucher;
          appliedDiscounts[`Voucher_${customer.voucherCode}`] = discount;
          discountMessages.push(message);
        } else if (error) {
          // Log voucher error but continue with other discounts
          console.warn(`Voucher validation failed: ${error}`);
          discountMessages.push(`Voucher ${customer.voucherCode} could not be applied`);
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
      
      // Provide specific error messages based on error type
      if (error.message.includes('Cart items are required')) {
        throw new Error('Invalid input: ' + error.message);
      } else if (error.message.includes('Customer profile is required')) {
        throw new Error('Invalid input: ' + error.message);
      } else if (error.message.includes('Invalid cart item')) {
        throw new Error('Invalid cart data: ' + error.message);
      } else {
        throw new Error(`Failed to calculate discounts: ${error.message}`);
      }
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
    const validation = await this.validateDiscountCode(voucherCode, cartItems, customer);
    if (!validation.isValid) {
      return { 
        total: currentTotal, 
        discount: new Decimal(0), 
        message: '',
        error: validation.error
      };
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
   * Validate discount code with detailed error messages
   * @param {string} code - Discount code to validate
   * @param {Array} cartItems - Cart items for validation
   * @param {Object} customer - Customer profile
   * @returns {Object} Validation result with detailed error message
   */
  async validateDiscountCode(code, cartItems, customer) {
    try {
      const voucher = this.voucherCodes.get(code);
      
      if (!voucher) {
        return { 
          isValid: false, 
          error: `Voucher code '${code}' not found`,
          errorCode: 'VOUCHER_NOT_FOUND'
        };
      }

      // Check expiry
      if (voucher.valid_until && new Date() > voucher.valid_until) {
        return { 
          isValid: false, 
          error: `Voucher code '${code}' has expired on ${voucher.valid_until.toDateString()}`,
          errorCode: 'VOUCHER_EXPIRED'
        };
      }

      // Check minimum order value against original cart value
      const cartTotal = cartItems.reduce((total, item) => {
        return total.add(item.product.base_price.mul(item.quantity));
      }, new Decimal(0));

      if (voucher.min_order_value && cartTotal.lt(voucher.min_order_value)) {
        return { 
          isValid: false, 
          error: `Minimum order value of ₹${voucher.min_order_value} required. Current cart total: ₹${cartTotal}`,
          errorCode: 'MIN_ORDER_NOT_MET'
        };
      }

      // Additional validations can be added here:
      // - Brand exclusions
      // - Category restrictions  
      // - Customer tier requirements
      // - Usage limits per customer

      return { 
        isValid: true, 
        error: null,
        errorCode: null
      };

    } catch (error) {
      console.error('Error validating discount code:', error);
      return { 
        isValid: false, 
        error: `System error while validating voucher: ${error.message}`,
        errorCode: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use validateDiscountCode for detailed validation
   */
  async validateDiscountCodeSimple(code, cartItems, customer) {
    const result = await this.validateDiscountCode(code, cartItems, customer);
    return result.isValid;
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