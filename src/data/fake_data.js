import { Product, CartItem, PaymentInfo, CustomerProfile, BrandTier } from '../models/index.js';

/**
 * Fake Data for Testing the Discount Service
 * Scenario: PUMA T-shirt with "Min 40% off" + 10% off on T-shirts + ICICI bank offer
 */

// Sample Products
export const sampleProducts = [
  new Product({
    id: 'PUMA-TSHIRT-001',
    brand: 'PUMA',
    brand_tier: BrandTier.PREMIUM,
    category: 'T-shirts',
    base_price: 2000, // ₹2000
    current_price: 2000 // Will be discounted by service
  }),
  new Product({
    id: 'NIKE-SHOES-001',
    brand: 'NIKE',
    brand_tier: BrandTier.PREMIUM,
    category: 'Shoes',
    base_price: 8000,
    current_price: 8000
  }),
  new Product({
    id: 'ADIDAS-JEANS-001',
    brand: 'ADIDAS',
    brand_tier: BrandTier.REGULAR,
    category: 'Jeans',
    base_price: 3500,
    current_price: 3500
  }),
  new Product({
    id: 'PUMA-TSHIRT-002',
    brand: 'PUMA',
    brand_tier: BrandTier.REGULAR,
    category: 'T-shirts',
    base_price: 1500,
    current_price: 1500
  })
];

// Sample Cart Items - Multiple Discount Scenario
export const sampleCartItems = [
  new CartItem({
    product: sampleProducts[0], // PUMA T-shirt ₹2000
    quantity: 2,
    size: 'L'
  }),
  new CartItem({
    product: sampleProducts[3], // Another PUMA T-shirt ₹1500
    quantity: 1,
    size: 'M'
  })
];

// Sample Customer Profile
export const sampleCustomer = new CustomerProfile({
  id: 'CUST-001',
  tier: 'premium',
  email: 'customer@example.com',
  phone: '+91-9876543210',
  is_premium_member: true,
  voucherCode: 'SUPER69' // Optional voucher code for testing
});

// Sample Payment Info - ICICI Bank Card
export const samplePaymentInfo = new PaymentInfo({
  method: 'CARD',
  bank_name: 'ICICI',
  card_type: 'CREDIT'
});

// Alternative Payment Info for testing
export const alternativePaymentInfo = new PaymentInfo({
  method: 'UPI',
  bank_name: null,
  card_type: null
});

// Sample Customer without voucher
export const sampleCustomerNoVoucher = new CustomerProfile({
  id: 'CUST-002',
  tier: 'regular',
  email: 'customer2@example.com',
  phone: '+91-9876543211',
  is_premium_member: false
});

/**
 * Expected Calculation for the Multiple Discount Scenario:
 * 
 * Cart:
 * - PUMA T-shirt (₹2000) x 2 = ₹4000
 * - PUMA T-shirt (₹1500) x 1 = ₹1500
 * Total: ₹5500
 * 
 * Discounts Applied (in order):
 * 1. Brand Discount (PUMA - 40% off):
 *    - ₹4000 * 40% = ₹1600 (on first item)
 *    - ₹1500 * 40% = ₹600 (on second item)
 *    - Subtotal after brand discount: ₹5500 - ₹2200 = ₹3300
 * 
 * 2. Category Discount (T-shirts - 10% off on already discounted price):
 *    - ₹2400 * 10% = ₹240 (on first item after brand discount)
 *    - ₹900 * 10% = ₹90 (on second item after brand discount)
 *    - Subtotal after category discount: ₹3300 - ₹330 = ₹2970
 * 
 * 3. Bank Offer (ICICI - 10% instant discount):
 *    - ₹2970 * 10% = ₹297
 *    - Final total: ₹2970 - ₹297 = ₹2673
 * 
 * Total Savings: ₹5500 - ₹2673 = ₹2827 (51.4% off)
 */

export const expectedDiscountCalculation = {
  original_price: 5500,
  final_price: 2673,
  total_savings: 2827,
  savings_percentage: 51.4,
  applied_discounts: {
    'Brand_PUMA': 2200,
    'Category_T-shirts': 330,
    'Bank_ICICI': 297
  }
};

// Additional test scenarios
export const testScenarios = {
  // Scenario 1: Only brand discount
  brandOnly: {
    cartItems: [sampleCartItems[0]], // Single PUMA T-shirt
    customer: sampleCustomerNoVoucher,
    paymentInfo: null
  },
  
  // Scenario 2: With voucher code
  withVoucher: {
    cartItems: sampleCartItems,
    customer: sampleCustomer, // Has SUPER69 voucher
    paymentInfo: null
  },
  
  // Scenario 3: Complete scenario (as described in assignment)
  complete: {
    cartItems: sampleCartItems,
    customer: sampleCustomerNoVoucher,
    paymentInfo: samplePaymentInfo
  }
}; 