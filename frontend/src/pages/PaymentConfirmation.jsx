import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
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
        const response = await axios.post(`http://localhost:3000/reservations/${reservationId}/update-payment`, {
          paymentIntentId: paymentIntentId
        });

        if (response.data.status === 'confirmed') {
          setError(null);
          setPaymentSuccess(true);
        } else if (response.data.status === 'cancelled') {
          setError('Payment failed. Please try again or contact support.');
        } else {
          setError(`Payment status: ${response.data.status}. Please contact support if this seems incorrect.`);
        }
      } catch (err) {
        console.error('Error updating payment status:', {
          error: err,
          response: err.response?.data,
          status: err.response?.status,
          paymentIntent: paymentIntentId,
          redirectStatus: status,
          reservationId: reservationId,
          url: `http://localhost:3000/reservations/${reservationId}/update-payment`
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

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `train-ticket-${reservationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading ticket:', error);
      setError('Failed to download ticket. Please try again or contact support.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="payment-confirmation-page">
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <Container>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
        >
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">
              {error}
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/profile')}
                >
                  Go to Profile
                </Button>
              </Box>
            </Alert>
          ) : paymentSuccess ? (
            <Alert severity="success">
              <Typography variant="h6">Payment Successful!</Typography>
              <Typography>
                Your reservation has been confirmed. You can now download your ticket.
              </Typography>
              <Box mt={2} display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDownloadTicket}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? 'Downloading...' : 'Download Ticket PDF'}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/profile')}
                >
                  Go to Profile
                </Button>
              </Box>
            </Alert>
          ) : (
            <Alert severity="info">
              <Typography>Processing payment confirmation...</Typography>
            </Alert>
          )}
        </Box>
      </Container>
      <Footer />
    </div>
  );
};

export default PaymentConfirmation;