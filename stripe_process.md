# Stripe Integration Blueprint - HalalExtra Certification Payments

## Overview

This document provides comprehensive technical and functional details for the Stripe payment integration in HalalExtra's halal certification application system. The implementation uses **Stripe Elements with Payment Intents** for secure, customizable card payments integrated within a multi-step application form.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │     Stripe      │
│   (React)       │    │   (Express)      │    │     API         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Create Payment     │                       │
         │ ─────────────────────▶│ 2. Create PaymentIntent│
         │                       │ ─────────────────────▶│
         │                       │ 3. Return clientSecret│
         │ 4. clientSecret       │ ◀─────────────────────│
         │ ◀─────────────────────│                       │
         │                       │                       │
         │ 5. confirmCardPayment │                       │
         │ ──────────────────────┼──────────────────────▶│
         │                       │                       │
         │ 6. Payment Success    │                       │
         │ ◀─────────────────────┼───────────────────────│
         │                       │                       │
         │ 7. Submit Application │                       │
         │ ─────────────────────▶│ 8. Verify Payment     │
         │                       │ ─────────────────────▶│
         │                       │ 9. Create Application │
         │                       │                       │
```

## Technical Implementation

### 1. Dependencies and Versions

#### Frontend Dependencies
```json
{
  "@stripe/react-stripe-js": "^2.5.1",
  "@stripe/stripe-js": "^2.4.0"
}
```

#### Backend Dependencies
```json
{
  "stripe": "^14.21.0"
}
```

### 2. Environment Configuration

#### Environment Variables Required

**Frontend (.env)**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Stripe publishable key
```

**Backend (.env)**
```bash
STRIPE_SECRET_KEY=sk_test_...            # Stripe secret key
```

**Production Considerations:**
- Use `pk_live_` and `sk_live_` prefixes for production keys
- Store secret keys securely (Railway environment variables)
- Never commit keys to version control

### 3. Frontend Implementation

#### 3.1 Stripe Initialization (`PaymentForm.tsx`)

```typescript
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Load Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
```

#### 3.2 Payment Form Structure

```typescript
interface PaymentFormProps {
  formData: ApplicationFormData;     // Application data for payment context
  prevStep: () => void;             // Navigate back in multi-step form
  onPaymentSuccess: (paymentIntentId: string) => void; // Handle success
}

const PaymentForm = (props: PaymentFormProps) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};
```

#### 3.3 Payment Flow Implementation

**State Management:**
```typescript
const [isProcessing, setIsProcessing] = useState(false);
const [clientSecret, setClientSecret] = useState("");
const [paymentAmount] = useState(100); // $1.00 AUD in cents
```

**Payment Intent Creation:**
```typescript
useEffect(() => {
  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'aud',
          metadata: {
            businessName: formData.businessName,
            ownerEmail: formData.ownerEmail,
            applicationId: 'pending'
          }
        }),
      });

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
    } catch (error) {
      // Error handling with toast notifications
    }
  };

  if (formData.businessName && formData.ownerEmail) {
    createPaymentIntent();
  }
}, [formData, paymentAmount]);
```

**Payment Confirmation:**
```typescript
const handlePayment = async (event: React.FormEvent) => {
  event.preventDefault();

  if (!stripe || !elements || !clientSecret) return;

  setIsProcessing(true);
  const cardElement = elements.getElement(CardElement);

  try {
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: formData.ownerName,
          email: formData.ownerEmail,
          phone: formData.ownerPhone,
          address: {
            line1: formData.address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postcode,
            country: 'AU',
          },
        },
      },
    });

    if (error) {
      // Handle payment error
    } else if (paymentIntent?.status === 'succeeded') {
      onPaymentSuccess(paymentIntent.id);
    }
  } catch (error) {
    // Handle exception
  } finally {
    setIsProcessing(false);
  }
};
```

#### 3.4 Card Element Configuration

```typescript
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': { color: '#aab7c4' },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: { color: '#9e2146' },
  },
  hidePostalCode: true, // Already collected in form
};
```

### 4. Backend Implementation

#### 4.1 Stripe Initialization (`server/routes.ts`)

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia', // Latest stable version
});
```

#### 4.2 Payment Intent Creation Endpoint

```typescript
app.post('/api/create-payment-intent', asyncHandler(async (req, res) => {
  try {
    const { amount, currency = 'aud', metadata } = req.body;
    
    // Validation
    if (!amount || amount < 50) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,                    // Amount in cents
      currency: currency,                // Currency code
      metadata: metadata || {},          // Custom metadata
      automatic_payment_methods: {
        enabled: true,                   // Enable all available payment methods
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    res.status(400).json({ message: error.message || 'Failed to create payment intent' });
  }
}));
```

#### 4.3 Payment Verification in Application Processing

```typescript
// Verify payment before creating application
try {
  const paymentIntent = await stripe.paymentIntents.retrieve(applicationData.paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    return res.status(400).json({ message: 'Payment not completed' });
  }

  // Create payment record for internal tracking
  await storage.createPayment({
    paymentIntentId: applicationData.paymentIntentId,
    applicationId: application.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    paymentMethod: paymentIntent.payment_method_types[0] || null,
    customerEmail: store.ownerEmail,
    customerName: store.ownerName,
    metadata: paymentIntent.metadata
  });
} catch (error) {
  console.error('Payment verification error:', error);
  return res.status(400).json({ message: 'Payment verification failed' });
}
```

## Payment Configuration

### 1. Pricing Structure

```typescript
// Current Implementation
const CERTIFICATION_FEE = 100; // $1.00 AUD in cents

// Expandable for different certification types
const PRICING_TIERS = {
  basic: 100,      // $1.00 AUD
  premium: 200,    // $2.00 AUD  
  enterprise: 500  // $5.00 AUD
};
```

### 2. Supported Payment Methods

**Automatic Payment Methods Enabled:**
- Credit Cards (Visa, Mastercard, American Express)
- Debit Cards
- Digital Wallets (Apple Pay, Google Pay) - automatic detection
- Bank transfers (if enabled in Stripe dashboard)

**Currency Support:**
- Primary: Australian Dollar (AUD)
- Expandable to multiple currencies via configuration

### 3. Geographic Configuration

```typescript
// Billing Details Collection
billing_details: {
  address: {
    country: 'AU',        // Fixed to Australia
    // Other fields collected from application form
  }
}
```

## Security Implementation

### 1. Client-Side Security

**PCI DSS Compliance:**
- Card data never touches application servers
- Stripe.js handles all sensitive card data tokenization
- Elements provide secure card input fields

**HTTPS Requirements:**
- Production requires HTTPS for Stripe.js to function
- All API calls use credentials: 'include' for session security

### 2. Server-Side Security

**Key Management:**
```typescript
// Environment-based key selection
const stripe = new Stripe(
  process.env.NODE_ENV === 'production' 
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST
);
```

**Payment Verification:**
- Double verification: client-side confirmation + server-side retrieval
- Payment status checked before application creation
- Metadata validation for request authenticity

### 3. Error Handling

**Frontend Error Categories:**
```typescript
// Network errors
if (!response.ok) {
  throw new Error('Failed to create payment intent');
}

// Stripe errors
if (error) {
  console.error('Payment error:', error);
  toast({
    title: t("payment.errorTitle"),
    description: error.message || t("payment.paymentError"),
    variant: "destructive",
  });
}

// Processing errors
} catch (error) {
  console.error('Payment error:', error);
  toast({
    title: t("payment.errorTitle"),
    description: t("payment.paymentError"),
    variant: "destructive",
  });
}
```

**Backend Error Categories:**
```typescript
// Validation errors
if (!amount || amount < 50) {
  return res.status(400).json({ message: 'Invalid amount' });
}

// Stripe API errors
} catch (error: any) {
  console.error('Payment intent creation error:', error);
  res.status(400).json({ 
    message: error.message || 'Failed to create payment intent' 
  });
}
```

## User Experience Design

### 1. Payment Flow Integration

**Multi-Step Form Integration:**
```
Step 1: Business Information
Step 2: Operations Details  
Step 3: Document Upload
Step 4: Contact Information
Step 5: Payment & Review ← Stripe integration here
Step 6: Confirmation
```

**Progress Indication:**
- Clear step indicators showing payment as final step
- Loading states during payment processing
- Success confirmation with payment ID

### 2. Payment Form UI Components

**Payment Summary Card:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Payment Details</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <span>Certification Fee</span>
        <span className="text-2xl font-bold">
          ${(paymentAmount / 100).toFixed(2)} AUD
        </span>
      </div>
    </div>
  </CardContent>
</Card>
```

**Security Trust Indicators:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="flex flex-col items-center">
    <Shield className="h-8 w-8 text-green-600" />
    <p>SSL Encrypted</p>
  </div>
  <div className="flex flex-col items-center">
    <CreditCard className="h-8 w-8 text-blue-600" />
    <p>Stripe Secure</p>
  </div>
  <div className="flex flex-col items-center">
    <CheckCircle className="h-8 w-8 text-green-600" />
    <p>Instant Confirmation</p>
  </div>
</div>
```

### 3. Loading and Status Management

**Processing States:**
```typescript
// Button states
{isProcessing ? (
  <>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    Processing Payment...
  </>
) : (
  <>
    <CheckCircle className="mr-2 h-4 w-4" />
    Pay $1.00 AUD
  </>
)}

// Form disable during processing
disabled={!stripe || isProcessing || !clientSecret}
```

## Database Schema

### 1. Payment Records Table

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  application_id INTEGER REFERENCES applications(id),
  amount INTEGER NOT NULL,                    -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'AUD',
  status VARCHAR(50) NOT NULL,               -- Stripe payment status
  payment_method VARCHAR(50),                -- Card, bank_transfer, etc.
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  metadata JSONB,                           -- Additional payment metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Application-Payment Relationship

```typescript
// Applications table includes payment reference
export const applications = pgTable("applications", {
  // ... other fields
  paymentIntentId: text("payment_intent_id"),
  paymentStatus: text("payment_status").default("pending"),
  // ... other fields
});
```

## Testing Strategy

### 1. Test Card Numbers

**Stripe Test Cards:**
```typescript
const TEST_CARDS = {
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  authentication: '4000002760003184' // 3D Secure
};
```

### 2. Test Scenarios

**Positive Test Cases:**
- Successful payment with valid card
- Payment with different card brands
- Payment with 3D Secure authentication
- Form validation with proper error handling

**Negative Test Cases:**
- Declined card handling
- Insufficient funds scenario
- Network failure during payment
- Invalid card number handling
- Expired card handling

### 3. E2E Testing Integration

**Playwright Test Pattern:**
```typescript
// In actual test files
test('should complete payment flow', async ({ page }) => {
  // Navigate to payment step
  await page.goto('/apply');
  // ... fill form steps
  
  // Payment step
  await page.fill('[data-testid="card-number"]', '4242424242424242');
  await page.fill('[data-testid="card-expiry"]', '12/25');
  await page.fill('[data-testid="card-cvc"]', '123');
  await page.click('button:has-text("Pay $1.00")');
  
  // Verify success
  await expect(page.locator('text=Payment Successful')).toBeVisible();
});
```

## Monitoring and Analytics

### 1. Payment Metrics to Track

**Business Metrics:**
- Payment success rate
- Average payment processing time
- Payment method distribution
- Geographic distribution of payments
- Revenue tracking by time period

**Technical Metrics:**
- Payment intent creation success rate
- Client-side confirmation success rate
- Server-side verification success rate
- Error rate by error type
- Performance metrics for payment flow

### 2. Logging Implementation

**Frontend Logging:**
```typescript
// Payment attempt
console.log('Payment attempt started', {
  amount: paymentAmount,
  currency: 'aud',
  businessName: formData.businessName
});

// Payment success
console.log('Payment successful', {
  paymentIntentId: paymentIntent.id,
  amount: paymentIntent.amount
});

// Payment error
console.error('Payment error', {
  error: error.message,
  type: error.type,
  code: error.code
});
```

**Backend Logging:**
```typescript
// Payment intent creation
console.log('Payment intent created', {
  paymentIntentId: paymentIntent.id,
  amount: paymentIntent.amount,
  currency: paymentIntent.currency
});

// Payment verification
console.log('Payment verified', {
  paymentIntentId: paymentIntent.id,
  status: paymentIntent.status,
  applicationId: application.id
});
```

## Webhook Integration (Future Enhancement)

### 1. Webhook Endpoints

**Recommended Events to Handle:**
```typescript
const WEBHOOK_EVENTS = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed', 
  'payment_intent.canceled',
  'payment_method.attached'
];

app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

## Deployment Considerations

### 1. Environment-Specific Configuration

**Development:**
- Use Stripe test keys (`pk_test_`, `sk_test_`)
- Enable detailed logging
- Use test webhook endpoints

**Production:**
- Use Stripe live keys (`pk_live_`, `sk_live_`)
- Enable error tracking (Sentry, etc.)
- Configure production webhook endpoints
- Monitor payment success rates

### 2. Railway Deployment Specifics

**Environment Variables Setup:**
```bash
# Via Railway CLI
railway add STRIPE_SECRET_KEY=sk_live_...
railway add VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Via Railway Dashboard
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3. Performance Optimization

**Frontend Optimizations:**
- Lazy load Stripe.js only on payment step
- Cache stripe promise across component renders  
- Optimize bundle size by importing only needed Stripe components

**Backend Optimizations:**
- Cache Stripe client instance
- Implement connection pooling for database operations
- Use async/await properly for Stripe API calls

## Compliance and Legal

### 1. PCI DSS Compliance

**Stripe SAQ A Eligibility:**
- Card data never touches your servers ✅
- Using Stripe.js for all card handling ✅
- No card data storage ✅
- HTTPS for all payment pages ✅

### 2. GDPR Compliance

**Data Handling:**
- Payment data processed by Stripe (GDPR compliant)
- Customer data retention policies
- Right to erasure implementation
- Data processing agreements with Stripe

### 3. Australian Privacy Laws

**Privacy Act 1988 Compliance:**
- Clear privacy policy regarding payment data
- Secure transmission and storage
- Data breach notification procedures

## Troubleshooting Guide

### 1. Common Issues

**"Stripe not loaded" Error:**
```typescript
// Solution: Add loading checks
if (!stripe || !elements) {
  return <div>Loading payment form...</div>;
}
```

**"Invalid publishable key" Error:**
```typescript
// Solution: Verify environment variables
console.log('Stripe key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

**Payment intent creation fails:**
```typescript
// Solution: Check backend logs and Stripe dashboard
console.error('Payment intent error:', error);
// Verify STRIPE_SECRET_KEY is set correctly
```

### 2. Debug Commands

**Test Stripe Connection:**
```bash
# Backend test
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "aud"}'

# Frontend test - check browser console
console.log('Stripe loaded:', !!window.Stripe);
```

## Future Enhancements

### 1. Payment Method Expansion

**Additional Payment Methods:**
- Bank transfers (BPAY, POLi)
- Buy now, pay later (Afterpay, Zip)
- Cryptocurrency payments
- Corporate account payments

### 2. Advanced Features

**Subscription Support:**
- Recurring certification fees  
- Multi-year certification packages
- Automatic renewal billing

**Multi-Currency Support:**
- Dynamic currency detection
- Real-time exchange rates
- Regional pricing strategies

### 3. Analytics Enhancement

**Advanced Reporting:**
- Payment funnel analysis
- Abandonment rate tracking
- A/B testing for payment forms
- Cohort analysis for payment success

## Conclusion

This Stripe integration provides a secure, user-friendly payment experience for halal certification applications. The implementation follows Stripe's best practices for security, user experience, and PCI compliance while maintaining full customization and branding control.

The system is designed to be:
- **Secure**: PCI DSS compliant with client-side tokenization
- **Reliable**: Double verification and comprehensive error handling  
- **Scalable**: Easy to expand with additional payment methods and currencies
- **Maintainable**: Clear separation of concerns and comprehensive documentation

For any modifications or enhancements, refer to this document as the blueprint and update accordingly to maintain consistency across implementations.