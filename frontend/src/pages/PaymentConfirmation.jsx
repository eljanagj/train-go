import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { reservationService } from '../services/reservationService';
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
      const searchParams = new URLSearchParams(location.search);
      const paymentIntentId = searchParams.get('payment_intent');
      const status = searchParams.get('redirect_status');

      try {
        if (!paymentIntentId) {
          throw new Error('Payment intent ID is missing from URL parameters');
        }

        console.log('Payment confirmation details:', {
          paymentIntentId,
          status,
          reservationId,
          fullUrl: window.location.href,
          searchParams: location.search
        });

        const response = await reservationService.updatePaymentStatus(reservationId, paymentIntentId);

        if (response.payment?.status === 'completed') {
          setError(null);
          setPaymentSuccess(true);
        } else if (response.payment?.status === 'failed') {
          setError('Payment failed. Please try again or contact support.');
        } else if (response.payment?.status === 'pending') {
          setError('Payment is still processing. Please wait a moment and refresh the page.');
        } else {
          setError(`Payment status: ${response.payment?.status}. Please contact support if this seems incorrect.`);
        }
      } catch (err) {
        console.error('Error updating payment status:', {
          error: err,
          response: err.response?.data,
          status: err.response?.status,
          paymentIntent: paymentIntentId,
          redirectStatus: status,
          reservationId: reservationId
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
  }, [reservationId, location.search, navigate]);

  const handleDownloadTicket = async () => {
    try {
      setDownloadingPdf(true);
      const pdfBlob = await ticketService.downloadTicketByReservation(reservationId);
      const url = window.URL.createObjectURL(pdfBlob);
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

  if (loading) {
    return (
      <div className="payment-confirmation-page">
        <NavBar />
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="payment-confirmation-page">
      <NavBar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : paymentSuccess ? (
            <>
              <Typography variant="h4" component="h1" gutterBottom>
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
                sx={{ mt: 2 }}
              >
                {downloadingPdf ? 'Downloading...' : 'Download Ticket'}
              </Button>
            </>
          ) : (
            <Alert severity="warning" sx={{ mb: 3 }}>
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