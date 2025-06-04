import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { reservationService } from '../services/reservationService';
import { paymentService } from '../services/paymentService';
import { ticketService } from '../services/ticketService';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';

const PaymentConfirmation = ({ theme, toggleTheme }) => {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const updatePaymentStatus = async () => {
      try {
        // First, get the payment for this reservation
        const payment = await paymentService.getPaymentByReservation(reservationId);
        
        if (!payment || !payment.paymentIntentId) {
          throw new Error('No payment found for this reservation');
        }

        // Get the payment intent status
        const paymentIntent = await paymentService.getPaymentIntent(payment.paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          // If payment is already succeeded, update the status in our backend
          const response = await reservationService.updatePaymentStatus(reservationId, payment.paymentIntentId);
          
          if (response.status === 'confirmed' || response.payment?.status === 'completed') {
            setError(null);
            setPaymentSuccess(true);
          } else if (response.status === 'cancelled' || response.payment?.status === 'failed') {
            setError('Payment failed. Please try again or contact support.');
          } else {
            setError(`Payment status: ${response.status}. Please contact support if this seems incorrect.`);
          }
        } else if (paymentIntent.status === 'requires_payment_method') {
          setError('Payment failed. Please try again.');
        } else if (paymentIntent.status === 'requires_confirmation') {
          setError('Payment requires confirmation. Please try again.');
        } else {
          setError(`Unexpected payment status: ${paymentIntent.status}. Please contact support.`);
        }
      } catch (err) {
        console.error('Error updating payment status:', {
          error: err,
          response: err.response?.data,
          status: err.response?.status,
          reservationId
        });

        let errorMessage = 'Failed to update payment status';

        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.status === 400) {
          errorMessage = 'Invalid payment information. Please contact support.';
        } else if (err.response?.status === 404) {
          errorMessage = 'Reservation not found. Please contact support.';
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (reservationId) {
      updatePaymentStatus();
    }
  }, [reservationId]);

  const handleDownloadTicket = async () => {
    try {
      setDownloadingPdf(true);
      const pdfBlob = await ticketService.downloadTicketByReservation(reservationId);
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${reservationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading ticket:', err);
      setError('Failed to download ticket. Please try again later.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="payment-confirmation-page">
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <Container>
        <Box mt={4} mb={4}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : paymentSuccess ? (
            <Box>
              <Typography variant="h4" gutterBottom>
                Payment Successful!
              </Typography>
              <Typography variant="body1" paragraph>
                Your reservation has been confirmed. You can now download your ticket.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleDownloadTicket}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? 'Downloading...' : 'Download Ticket'}
              </Button>
            </Box>
          ) : (
            <Alert severity="warning">
              Processing payment status...
            </Alert>
          )}
        </Box>
      </Container>
      <Footer />
    </div>
  );
};

export default PaymentConfirmation;