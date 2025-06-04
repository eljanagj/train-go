import React, { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { reservationService } from '../services/reservationService';
import { paymentService } from '../services/paymentService';

const StripePaymentForm = ({ reservationId, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get the payment intent from the elements
      const { error: elementsError } = await elements.submit();
      if (elementsError) {
        setError(elementsError.message);
        return;
      }

      // Extract payment intent ID from client secret
      const paymentIntentId = clientSecret.split('_secret_')[0];

      // Get the payment intent status
      const paymentIntent = await paymentService.getPaymentIntent(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // If payment is already succeeded, just update the status and redirect
        await reservationService.updatePaymentStatus(reservationId, paymentIntentId);
        navigate(`/reservations/${reservationId}/confirmation`);
        return;
      }

      // If payment is not succeeded, proceed with confirmation
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/reservations/${reservationId}/confirmation`,
        },
        redirect: 'always'
      });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        setError(paymentError.message);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="payment-button"
      >
        {processing ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
};

export default StripePaymentForm; 