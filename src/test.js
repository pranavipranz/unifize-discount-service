import { DiscountService } from './services/DiscountService.js';
import { sampleCartItems, sampleCustomer, samplePaymentInfo } from './data/fake_data.js';
import Decimal from 'decimal.js';

/**
 * Simple test suite for the Discount Service
 */
async function runTests() {
  console.log('🧪 Running Discount Service Tests\n');
  
  const discountService = new DiscountService();

  // Test 1: Voucher validation
  console.log('Test 1: Voucher Validation');
  console.log('='.repeat(30));
  
  const testVoucher = 'SUPER69';
  const cartTotal = sampleCartItems.reduce((total, item) => {
    return total.add(item.product.base_price.mul(item.quantity));
  }, new Decimal(0));
  
  console.log(`Cart total: ₹${cartTotal}`);
  console.log(`Voucher min order: ₹${discountService.voucherCodes.get(testVoucher).min_order_value}`);
  
  const isValid = await discountService.validateDiscountCode(testVoucher, sampleCartItems, sampleCustomer);
  console.log(`Voucher ${testVoucher} is ${isValid ? 'valid' : 'invalid'}\n`);

  // Test 2: Direct voucher application
  console.log('Test 2: Direct Voucher Application');
  console.log('='.repeat(35));
  
  const customerWithVoucher = { ...sampleCustomer, voucherCode: 'SUPER69' };
  const result = await discountService.calculateCartDiscounts(
    sampleCartItems,
    customerWithVoucher,
    null // No payment info to isolate voucher effect
  );
  
  console.log(`Original: ₹${result.original_price}`);
  console.log(`Final: ₹${result.final_price}`);
  console.log(`Discounts:`, result.applied_discounts);
  console.log(`Message: ${result.message}\n`);

  // Test 3: Bank offer only
  console.log('Test 3: Bank Offer Only');
  console.log('='.repeat(25));
  
  const resultBankOnly = await discountService.calculateCartDiscounts(
    sampleCartItems,
    { ...sampleCustomer, voucherCode: null },
    samplePaymentInfo
  );
  
  console.log(`With bank offer: ₹${resultBankOnly.final_price}`);
  console.log(`Bank discount: ₹${resultBankOnly.applied_discounts.Bank_ICICI || 0}`);
  
  console.log('\n✅ Tests completed!');
}

// Run tests
runTests().catch(console.error); 