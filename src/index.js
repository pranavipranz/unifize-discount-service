import { DiscountService } from './services/DiscountService.js';
import { 
  sampleCartItems, 
  sampleCustomer, 
  sampleCustomerNoVoucher,
  samplePaymentInfo,
  testScenarios
} from './data/fake_data.js';

/**
 * Main demonstration of the Unifize Discount Service
 */
async function main() {
  console.log('🛍️  Unifize E-commerce Discount Service Demo\n');
  console.log('=' .repeat(60));

  const discountService = new DiscountService();

  try {
    // Scenario 1: Multiple Discount Scenario (as per assignment)
    console.log('\n📋 SCENARIO 1: Multiple Discount Scenario');
    console.log('- PUMA T-shirts with "Min 40% off"');
    console.log('- Additional 10% off on T-shirts category'); 
    console.log('- ICICI bank offer of 10% instant discount');

    displayCart(testScenarios.complete.cartItems);

    const result1 = await discountService.calculateCartDiscounts(
      testScenarios.complete.cartItems,
      testScenarios.complete.customer,
      testScenarios.complete.paymentInfo
    );

    displayResult('Complete Discount Scenario', result1);

    // Scenario 2: Brand Discount Only
    console.log('\n📋 SCENARIO 2: Brand Discount Only');
    
    displayCart(testScenarios.brandOnly.cartItems);
    
    const result2 = await discountService.calculateCartDiscounts(
      testScenarios.brandOnly.cartItems,
      testScenarios.brandOnly.customer,
      testScenarios.brandOnly.paymentInfo
    );

    displayResult('Brand Discount Only', result2);

    // Scenario 3: With Voucher Code
    console.log('\n📋 SCENARIO 3: With Voucher Code (SUPER69)');
    
    displayCart(testScenarios.withVoucher.cartItems);
    
    const result3 = await discountService.calculateCartDiscounts(
      testScenarios.withVoucher.cartItems,
      testScenarios.withVoucher.customer,
      testScenarios.withVoucher.paymentInfo
    );

    displayResult('With Voucher Code', result3);

    // Demonstrate voucher validation
    console.log('\n🔍 VOUCHER VALIDATION DEMO');
    console.log('-'.repeat(40));
    
    const validCodes = ['SUPER69', 'WELCOME20', 'INVALID123'];
    for (const code of validCodes) {
      const validation = await discountService.validateDiscountCode(
        code, 
        sampleCartItems, 
        sampleCustomer
      );
      console.log(`Voucher "${code}": ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
      if (!validation.isValid && validation.error) {
        console.log(`  Error: ${validation.error}`);
      }
    }

    // Show available discounts
    console.log('\n💡 AVAILABLE DISCOUNTS FOR CART');
    console.log('-'.repeat(40));
    const availableDiscounts = discountService.getAvailableDiscounts(
      sampleCartItems, 
      sampleCustomer
    );
    
    console.log('Brand Discounts:');
    availableDiscounts.brands.forEach(brand => {
      console.log(`  • ${brand.brand}: ${brand.discount.percentage}% off`);
    });
    
    console.log('Category Discounts:');
    availableDiscounts.categories.forEach(category => {
      console.log(`  • ${category.category}: ${category.discount.percentage}% off`);
    });

  } catch (error) {
    console.error('❌ Error in discount calculation:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Demo completed successfully!');
}

/**
 * Display discount calculation results in a formatted way
 */
function displayResult(scenarioName, result) {
  console.log(`\n💰 ${scenarioName.toUpperCase()}`);
  console.log('-'.repeat(40));
  console.log(`Original Price: ₹${result.original_price.toFixed(2)}`);
  console.log(`Final Price: ₹${result.final_price.toFixed(2)}`);
  console.log(`Total Savings: ₹${result.getTotalDiscount().toFixed(2)} (${result.getDiscountPercentage().toFixed(1)}%)`);
  
  console.log('\nDiscounts Applied:');
  Object.entries(result.applied_discounts).forEach(([name, amount]) => {
    console.log(`  • ${name.replace('_', ' ')}: ₹${amount.toFixed(2)}`);
  });
  
  if (result.message) {
    console.log(`\nMessage: ${result.message}`);
  }
}

/**
 * Display cart contents
 */
function displayCart(cartItems) {
  console.log('\n🛒 CART CONTENTS');
  console.log('-'.repeat(40));
  
  cartItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.product.brand} ${item.product.category}`);
    console.log(`   Price: ₹${item.product.base_price} x ${item.quantity} = ₹${item.getTotalPrice()}`);
    console.log(`   Size: ${item.size}`);
  });
  
  // Calculate total using the existing getTotalPrice method
  let totalSum = 0;
  cartItems.forEach(item => {
    totalSum += parseFloat(item.getTotalPrice().toString());
  });
  console.log(`\nCart Total: ₹${totalSum.toFixed(2)}`);
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, displayResult, displayCart }; 