import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Shield, CheckCircle } from "lucide-react";
import { ApplicationFormData } from "./MultiStepForm";

// Load Stripe with publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  formData: ApplicationFormData;
  prevStep: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
}

const PaymentFormContent = ({ formData, prevStep, onPaymentSuccess }: PaymentFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentAmount] = useState(100); // $1.00 AUD in cents

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            amount: paymentAmount,
            currency: 'aud',
            metadata: {
              businessName: formData.businessName,
              ownerEmail: formData.ownerEmail,
              applicationId: 'pending' // Will be set after application creation
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast({
          title: t("payment.errorTitle"),
          description: t("payment.paymentIntentError"),
          variant: "destructive",
        });
      }
    };

    if (formData.businessName && formData.ownerEmail) {
      createPaymentIntent();
    }
  }, [formData.businessName, formData.ownerEmail, paymentAmount, toast, t]);

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      toast({
        title: t("payment.errorTitle"),
        description: t("payment.stripeNotLoadedError"),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    try {
      // Confirm payment
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
        console.error('Payment error:', error);
        toast({
          title: t("payment.errorTitle"),
          description: error.message || t("payment.paymentError"),
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: t("payment.successTitle"),
          description: t("payment.successMessage"),
        });
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: t("payment.errorTitle"),
        description: t("payment.paymentError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true, // We already have address info
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("payment.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t("payment.certificationFee")}</span>
              <span className="text-2xl font-bold text-primary">
                ${(paymentAmount / 100).toFixed(2)} AUD
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {t("payment.feeDescription")}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">{t("payment.applicationSummary")}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>{t("apply.form.businessName")}:</strong> {formData.businessName}</p>
              <p><strong>{t("apply.form.ownerName")}:</strong> {formData.ownerName}</p>
              <p><strong>{t("apply.form.ownerEmail")}:</strong> {formData.ownerEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("payment.cardDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="p-4 border rounded-lg">
              <CardElement options={cardElementOptions} />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>{t("payment.securePayment")}</span>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isProcessing}
                className="flex-1"
              >
                {t("common.back")}
              </Button>
              
              <Button
                type="submit"
                disabled={!stripe || isProcessing || !clientSecret}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("payment.processing")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t("payment.payNow", { amount: `$${(paymentAmount / 100).toFixed(2)}` })}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <Shield className="h-8 w-8 text-green-600" />
          <div>
            <p className="font-medium text-sm">{t("payment.sslEncrypted")}</p>
            <p className="text-xs text-gray-600">{t("payment.sslDescription")}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CreditCard className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-medium text-sm">{t("payment.stripeSecure")}</p>
            <p className="text-xs text-gray-600">{t("payment.stripeDescription")}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <p className="font-medium text-sm">{t("payment.instantConfirmation")}</p>
            <p className="text-xs text-gray-600">{t("payment.confirmationDescription")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentForm = (props: PaymentFormProps) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;