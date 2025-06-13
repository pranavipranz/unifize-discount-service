# Unifize E-commerce Discount Service

A JavaScript implementation of an e-commerce discount service that handles multiple types of discounts with proper business logic precedence.

## 🎯 Assignment Overview

This project implements a fashion e-commerce discount system supporting:

- **Brand-specific discounts** (e.g., "Min 40% off on PUMA")
- **Bank card offers** (e.g., "10% instant discount on ICICI Bank cards")
- **Category-specific deals** (e.g., "Extra 10% off on T-shirts")
- **Vouchers** (e.g., 'SUPER69' for 69% off on any product)

## 🏗️ Architecture

### Data Models
- `Product` - Product information with pricing
- `CartItem` - Items in customer's cart
- `PaymentInfo` - Payment method and bank details
- `CustomerProfile` - Customer information
- `DiscountedPrice` - Final pricing result with applied discounts

### Core Service
- `DiscountService` - Main service handling discount calculations and validations

## 📦 Installation

```bash
# Navigate to project directory
cd unifize-discount-service

# Install dependencies
npm install

# Run the demo
npm start
```

## 🚀 Usage

### Basic Example

```javascript
import { DiscountService } from './src/services/DiscountService.js';
import { sampleCartItems, sampleCustomer, samplePaymentInfo } from './src/data/fake_data.js';

const discountService = new DiscountService();

// Calculate discounts
const result = await discountService.calculateCartDiscounts(
  sampleCartItems,
  sampleCustomer,
  samplePaymentInfo
);

console.log(`Final Price: ₹${result.final_price}`);
console.log(`Total Savings: ₹${result.getTotalDiscount()}`);
```

### Discount Precedence

The service applies discounts in the following order:

1. **Brand & Category Discounts** - Applied first to base prices
2. **Voucher Codes** - Applied to the subtotal after brand/category discounts
3. **Bank Offers** - Applied last as instant discounts

## 🧪 Test Scenarios

The project includes three main test scenarios:

### Scenario 1: Multiple Discount Scenario (Assignment Requirement)
- PUMA T-shirt with "Min 40% off"
- Additional 10% off on T-shirts category
- ICICI bank offer of 10% instant discount

**Cart:**
- PUMA T-shirt (₹2000) x 2 = ₹4000
- PUMA T-shirt (₹1500) x 1 = ₹1500
- **Total: ₹5500**

**Expected Result:**
- Original: ₹5500
- Final: ₹2673
- **Total Savings: ₹2827 (51.4% off)**

### Scenario 2: Brand Discount Only
Tests single discount type application.

### Scenario 3: With Voucher Code
Tests voucher code application with validation.

## 📋 API Reference

### DiscountService Methods

#### `calculateCartDiscounts(cartItems, customer, paymentInfo)`
Calculates final price after applying all applicable discounts.

**Parameters:**
- `cartItems`: Array of CartItem objects
- `customer`: CustomerProfile object
- `paymentInfo`: PaymentInfo object (optional)

**Returns:** DiscountedPrice object

#### `validateDiscountCode(code, cartItems, customer)`
Validates if a discount code can be applied.

**Parameters:**
- `code`: Discount code string
- `cartItems`: Array of CartItem objects
- `customer`: CustomerProfile object

**Returns:** Boolean

## 🗂️ Project Structure

```
unifize-discount-service/
├── src/
│   ├── models/
│   │   └── index.js          # Data models
│   ├── services/
│   │   └── DiscountService.js # Main discount logic
│   ├── data/
│   │   └── fake_data.js      # Test data
│   └── index.js              # Demo application
├── package.json
└── README.md
```

## 🔧 Configuration

### Discount Rules
Discount rules are configured in the `DiscountService` constructor:

```javascript
// Brand discounts
this.brandDiscounts.set('PUMA', { percentage: 40, min_discount: 40 });

// Category discounts  
this.categoryDiscounts.set('T-shirts', { percentage: 10 });

// Bank offers
this.bankOffers.set('ICICI', { percentage: 10, max_discount: 2000 });

// Voucher codes
this.voucherCodes.set('SUPER69', { 
  percentage: 69, 
  max_discount: 5000,
  min_order_value: 1000,
  valid_until: new Date('2024-12-31')
});
```

## 🎨 Features

- ✅ Multiple discount types support
- ✅ Proper discount precedence handling
- ✅ Voucher code validation with business rules
- ✅ Bank offer integration
- ✅ Decimal precision for financial calculations
- ✅ Comprehensive error handling
- ✅ Extensible architecture for new discount types

## 🧮 Business Logic

### Discount Calculation Flow
1. **Initialize** with original cart total
2. **Apply brand discounts** to individual products
3. **Apply category discounts** to discounted prices
4. **Apply voucher codes** to subtotal (with validation)
5. **Apply bank offers** to final amount
6. **Return** comprehensive result with breakdown

### Voucher Validation Rules
- Expiry date validation
- Minimum order value requirements
- Customer tier restrictions (extensible)
- Brand/category exclusions (extensible)

## 📊 Expected Output

```
🛍️  Unifize E-commerce Discount Service Demo

📋 SCENARIO 1: Multiple Discount Scenario
- PUMA T-shirts with "Min 40% off"
- Additional 10% off on T-shirts category
- ICICI bank offer of 10% instant discount

💰 COMPLETE DISCOUNT SCENARIO
Original Price: ₹5500.00
Final Price: ₹2673.00
Total Savings: ₹2827.00 (51.4%)

Discounts Applied:
  • Brand PUMA: ₹2200.00
  • Category T-shirts: ₹330.00
  • Bank ICICI: ₹297.00
```

## 🚀 Running the Project

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Run specific test
node src/index.js
```

## 📝 Notes

- Built with ES6 modules for modern JavaScript standards
- Uses Decimal.js for precise financial calculations
- Extensible architecture for adding new discount types
- Comprehensive error handling and validation
- Real-world e-commerce business logic implementation

## 👨‍💻 Author

**Pranavi Peramsetty**  
Unifize Backend Developer Assignment 