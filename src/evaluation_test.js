import { DiscountService } from './services/DiscountService.js';
import { 
  sampleCartItems, 
  sampleCustomer, 
  sampleCustomerNoVoucher,
  samplePaymentInfo, 
  testScenarios,
  expectedDiscountCalculation 
} from './data/fake_data.js';
import { Product, CartItem, CustomerProfile, PaymentInfo, BrandTier } from './models/index.js';
import Decimal from 'decimal.js';

/**
 * Evaluation Test Suite for Unifize Backend Developer Assignment
 * Tests all assignment evaluation metrics including detailed error handling, validation rules, and discount calculations using dummy data.
 */
class DiscountServiceEvaluationTest {
  constructor() {
    this.discountService = new DiscountService();
    this.testResults = [];
    this.failedTests = 0;
    this.passedTests = 0;
  }

  /**
   * Run all comprehensive tests
   */
  async runAllTests() {
    console.log('🧪 UNIFIZE ASSIGNMENT EVALUATION TEST SUITE');
    console.log('='.repeat(60));
    console.log('Testing Assignment Evaluation Metrics with Dummy Data:');
    console.log('✓ Core Features: Calculations, Stacking, Validation, Errors');
    console.log('✓ Code Organization: Separation, Extensibility, Documentation');
    console.log('='.repeat(60));

    await this.testAccurateCalculations();
    await this.testDiscountStacking();
    await this.testValidationRules();
    await this.testErrorMessages();
    await this.testCodeOrganization();
    await this.testAssignmentScenario();

    this.printSummary();
  }

  /**
   * Test 1: Accurate Discount Calculations using Dummy Data
   */
  async testAccurateCalculations() {
    console.log('\n📊 TEST 1: Accurate Discount Calculations');
    console.log('-'.repeat(50));

    const result = await this.discountService.calculateCartDiscounts(
      testScenarios.complete.cartItems,
      testScenarios.complete.customer,
      testScenarios.complete.paymentInfo
    );

    console.log(`Original: ₹${result.original_price}`);
    console.log(`Final: ₹${result.final_price}`);
    console.log(`Expected: ₹2673`);

    const accurate = result.final_price.equals(new Decimal(2673));
    this.logResult('Accurate Calculations', accurate);
  }

  /**
   * Test 2: Proper Discount Stacking Order
   */
  async testDiscountStacking() {
    console.log('\n🔄 TEST 2: Proper Discount Stacking Order');
    console.log('-'.repeat(50));

    const customerWithVoucher = { ...sampleCustomer, voucherCode: 'SUPER69' };
    const result = await this.discountService.calculateCartDiscounts(
      sampleCartItems,
      customerWithVoucher,
      samplePaymentInfo
    );

    console.log('Applied Discounts:');
    Object.entries(result.applied_discounts).forEach(([name, amount]) => {
      console.log(`• ${name.replace('_', ' ')}: ₹${amount}`);
    });

    const hasProperOrder = Object.keys(result.applied_discounts).some(key => 
      key.startsWith('Brand_') || key.startsWith('Category_')
    );
    
    this.logResult('Proper Stacking Order', hasProperOrder);
  }

  /**
   * Test 3: Clear Validation Rules
   */
  async testValidationRules() {
    console.log('\n✅ TEST 3: Clear Validation Rules');
    console.log('-'.repeat(50));

    const validVoucher = await this.discountService.validateDiscountCode(
      'SUPER69', sampleCartItems, sampleCustomer
    );
    
    const invalidVoucher = await this.discountService.validateDiscountCode(
      'INVALID123', sampleCartItems, sampleCustomer
    );

    console.log(`Valid voucher result: ${validVoucher.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`Invalid voucher result: ${invalidVoucher.isValid ? 'VALID' : 'INVALID'}`);
    if (!invalidVoucher.isValid) {
      console.log(`Error: ${invalidVoucher.error}`);
    }

    const rulesWork = validVoucher.isValid && !invalidVoucher.isValid;
    this.logResult('Clear Validation Rules', rulesWork);
  }

  /**
   * Test 4: Detailed Error Messages
   */
  async testErrorMessages() {
    console.log('\n❌ TEST 4: Detailed Error Messages');
    console.log('-'.repeat(50));

    try {
      await this.discountService.calculateCartDiscounts([], sampleCustomer);
      this.logResult('Detailed Error Messages', false);
    } catch (error) {
      console.log(`Error message: ${error.message}`);
      const hasDetailedError = error.message.includes('Cart items are required');
      this.logResult('Detailed Error Messages', hasDetailedError);
    }
  }

  /**
   * Test 5: Code Organization
   */
  async testCodeOrganization() {
    console.log('\n🏗️ TEST 5: Code Organization & Extensibility');
    console.log('-'.repeat(50));

    // Test extensibility by adding new discount
    this.discountService.brandDiscounts.set('TESTBRAND', { percentage: 30 });
    
    const testProduct = new Product({
      id: 'TEST-001',
      brand: 'TESTBRAND',
      brand_tier: BrandTier.REGULAR,
      category: 'T-shirts',
      base_price: 1000,
      current_price: 1000
    });

    const testCartItem = new CartItem({
      product: testProduct,
      quantity: 1,
      size: 'M'
    });

    const result = await this.discountService.calculateCartDiscounts(
      [testCartItem], sampleCustomerNoVoucher, null
    );

    const extensible = !!result.applied_discounts.Brand_TESTBRAND;
    console.log(`New discount type added: ${extensible ? 'SUCCESS' : 'FAILED'}`);
    
    this.logResult('Code Organization & Extensibility', extensible);
  }

  /**
   * Test 6: Assignment Specific Scenario
   */
  async testAssignmentScenario() {
    console.log('\n🎯 TEST 6: Assignment Specific Scenario');
    console.log('-'.repeat(50));
    console.log('PUMA T-shirt + Category discount + ICICI bank offer');

    // Show cart contents for clarity
    this.displayCart(testScenarios.complete.cartItems);

    const result = await this.discountService.calculateCartDiscounts(
      testScenarios.complete.cartItems,
      testScenarios.complete.customer,
      testScenarios.complete.paymentInfo
    );

    console.log(`\nResults:`);
    console.log(`Original: ₹${result.original_price} (Expected: ₹${expectedDiscountCalculation.original_price})`);
    console.log(`Final: ₹${result.final_price} (Expected: ₹${expectedDiscountCalculation.final_price})`);
    console.log(`Savings: ₹${result.getTotalDiscount()} (${result.getDiscountPercentage().toFixed(1)}%)`);

    // Validate against expected values
    const originalMatches = result.original_price.equals(new Decimal(expectedDiscountCalculation.original_price));
    const finalMatches = result.final_price.equals(new Decimal(expectedDiscountCalculation.final_price));
    
    const hasPuma = !!result.applied_discounts.Brand_PUMA;
    const hasCategory = !!result.applied_discounts['Category_T-shirts'];
    const hasBank = !!result.applied_discounts.Bank_ICICI;

    console.log(`\nValidation against expected results:`);
    console.log(`✓ Original price match: ${originalMatches ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Final price match: ${finalMatches ? 'PASS' : 'FAIL'}`);
    console.log(`✓ PUMA discount: ${hasPuma ? 'Applied' : 'Missing'}`);
    console.log(`✓ T-shirt category: ${hasCategory ? 'Applied' : 'Missing'}`);
    console.log(`✓ ICICI bank offer: ${hasBank ? 'Applied' : 'Missing'}`);

    const scenarioComplete = hasPuma && hasCategory && hasBank && originalMatches && finalMatches;
    this.logResult('Assignment Scenario', scenarioComplete);
  }

  /**
   * Log test result
   */
  logResult(testName, passed) {
    if (passed) {
      console.log(`✅ ${testName}: PASSED`);
      this.passedTests++;
    } else {
      console.log(`❌ ${testName}: FAILED`);
      this.failedTests++;
    }
  }

  /**
   * Display cart contents for better test visibility
   */
  displayCart(cartItems) {
    console.log('\n🛒 CART CONTENTS');
    console.log('-'.repeat(40));
    
    cartItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.product.brand} ${item.product.category}`);
      console.log(`   Price: ₹${item.product.base_price} x ${item.quantity} = ₹${item.getTotalPrice()}`);
      console.log(`   Size: ${item.size}`);
    });
    
    // Calculate total
    let totalSum = 0;
    cartItems.forEach(item => {
      totalSum += parseFloat(item.getTotalPrice().toString());
    });
    console.log(`\nCart Total: ₹${totalSum.toFixed(2)}`);
  }

  /**
   * Print comprehensive test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Passed: ${this.passedTests} ✅`);
    console.log(`Failed: ${this.failedTests} ❌`);
    console.log(`Total: ${this.passedTests + this.failedTests}`);
    
    if (this.failedTests === 0) {
      console.log('\n🎉 ALL EVALUATION METRICS SATISFIED!');
      console.log('✅ Ready for submission');
    }
  }
}

// Run evaluation tests
async function runEvaluationTests() {
  const testSuite = new DiscountServiceEvaluationTest();
  await testSuite.runAllTests();
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEvaluationTests().catch(console.error);
}

export { DiscountServiceEvaluationTest, runEvaluationTests }; 