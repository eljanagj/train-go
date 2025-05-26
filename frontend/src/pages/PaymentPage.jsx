import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../components/StripePaymentForm';
import { paymentService } from '../services/paymentService';
import { reservationService } from '../services/reservationService';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import "../styles/payment.css";

console.log('Environment variables:', {
  all: import.meta.env,
  stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
});

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) {
  console.error('Stripe publishable key is missing. Make sure VITE_STRIPE_PUBLISHABLE_KEY is set in your .env file.');
}

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const PaymentPage = ({ theme, toggleTheme }) => {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reservationData = await reservationService.getReservation(reservationId);
        setReservation(reservationData);

        // Get payment for this reservation
        const payment = await paymentService.getPaymentByReservation(reservationId);

        if (payment && payment.paymentIntentId) {
          const paymentIntent = await paymentService.getPaymentIntent(payment.paymentIntentId);

          if (paymentIntent && paymentIntent.client_secret) {
            setClientSecret(paymentIntent.client_secret);
          } else {
            console.error('No client secret in payment intent:', paymentIntent);
            throw new Error('Invalid payment intent - no client secret');
          }
        } else {
          console.error('No payment found for reservation:', reservationId);
          throw new Error('No payment found for this reservation');
        }
      } catch (err) {
        console.error('Error fetching payment data:', err);
        setError(err.response?.data?.message || err.message || "Failed to initialize payment");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reservationId]);

  const renderContent = () => {
    if (!stripePromise) {
      return (
        <Alert severity="error">
          Stripe configuration is missing. Please check your environment variables.
        </Alert>
      );
    }

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error">{error}</Alert>
      );
    }

    if (!reservation) {
      return (
        <Alert severity="error">Reservation not found</Alert>
      );
    }

    return (
      <>
        <Typography variant="h4" gutterBottom>
          Complete Your Payment
        </Typography>
        <Typography variant="h6" gutterBottom>
          Reservation Details
        </Typography>
        <Box mb={4} className="reservation-details">
          <Typography>
            <strong>From:</strong> {reservation.schedule?.route?.departureStation || 'N/A'}
          </Typography>
          <Typography>
            <strong>To:</strong> {reservation.schedule?.route?.arrivalStation || 'N/A'}
          </Typography>
          <Typography>
            <strong>Departure:</strong> {new Date(reservation.schedule?.departureTime).toLocaleString() || 'N/A'}
          </Typography>
          <Typography>
            <strong>Arrival:</strong> {new Date(reservation.schedule?.arrivalTime).toLocaleString() || 'N/A'}
          </Typography>
          <Typography>
            <strong>Seat:</strong> {reservation.seatNumber}
          </Typography>
          <Typography>
            <strong>Price:</strong> €{reservation.price}
          </Typography>
        </Box>

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <StripePaymentForm reservationId={reservationId} />
          </Elements>
        )}
      </>
    );
  };

  return (
    <div className="payment-page">
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <Container>
        <Box mt={4} mb={4}>
          {renderContent()}
        </Box>
      </Container>
      <Footer />
    </div>
  );
};

export default PaymentPage;