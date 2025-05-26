import React, { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";

const StripePaymentForm = ({ reservationId }) => {
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
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/reservations/${reservationId}/confirmation`,
        },
      });

      if (paymentError) {
        setError(paymentError.message);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
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