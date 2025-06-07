import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import { LocalOffer, CheckCircle, Error } from '@mui/icons-material';
import discountService from '../services/discountService';

const DiscountCodeInput = ({ 
  originalPrice, 
  onDiscountApplied, 
  userId,
  disabled = false 
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [error, setError] = useState('');
  const [userDiscountCode, setUserDiscountCode] = useState(null);

  // Load user's discount code on component mount
  useEffect(() => {
    const loadUserDiscountCode = async () => {
      if (userId) {
        try {
          const code = await discountService.getUserDiscountCode(userId);
          setUserDiscountCode(code);
        } catch (error) {
          console.error('Error loading user discount code:', error);
        }
      }
    };
    loadUserDiscountCode();
  }, [userId]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setError('Please enter a discount code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Apply the discount with user validation
      const result = await discountService.applyDiscount(discountCode, originalPrice, userId);
      
      if (result.isValid) {
        setDiscountInfo(result);
        setApplied(true);
        onDiscountApplied({
          ...result,
          discountCode: discountCode
        });
      } else {
        setError(result.message || 'Invalid discount code');
      }
    } catch (error) {
      setError('Failed to apply discount code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setApplied(false);
    setDiscountInfo(null);
    setDiscountCode('');
    setError('');
    onDiscountApplied(null);
  };

  const handleUseMyCode = () => {
    if (userDiscountCode) {
      setDiscountCode(userDiscountCode.code);
    }
  };

  if (applied && discountInfo) {
    return (
      <Card sx={{ mb: 2, border: '2px solid #4caf50' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <CheckCircle sx={{ color: '#4caf50', mr: 1 }} />
            <Typography variant="h6" color="success.main">
              Discount Applied!
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" align="center" mb={1}>
            <Typography variant="body2">Original Price:</Typography>
            <Typography variant="body2">${originalPrice.toFixed(2)}</Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" align="center" mb={1}>
            <Typography variant="body2">Discount ({discountInfo.discountPercentage}%):</Typography>
            <Typography variant="body2" color="success.main">-${discountInfo.discountAmount.toFixed(2)}</Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" align="center" mb={2}>
            <Typography variant="body1" fontWeight="bold">Final Price:</Typography>
            <Typography variant="body1" fontWeight="bold" color="success.main">
              ${discountInfo.discountedPrice.toFixed(2)}
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" align="center">
            <Chip 
              label={`Code: ${discountCode}`} 
              color="success" 
              size="small"
              icon={<LocalOffer />}
            />
            <Button 
              onClick={handleRemoveDiscount}
              variant="outlined"
              size="small"
              disabled={disabled}
            >
              Remove
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🎫 Discount Code
        </Typography>
        
        {userDiscountCode && new Date(userDiscountCode.expireDate) > new Date() && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleUseMyCode}
                disabled={disabled}
              >
                Use My Code
              </Button>
            }
          >
            You have an active {userDiscountCode.discountPercentage}% discount code available!
          </Alert>
        )}
        
        <Box display="flex" gap={2} mb={2}>
          <TextField
            fullWidth
            label="Enter discount code"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            disabled={loading || disabled}
            error={!!error}
            helperText={error}
            placeholder="DISCOUNT-XXXXXXXX"
          />
          <Button
            variant="contained"
            onClick={handleApplyDiscount}
            disabled={loading || !discountCode.trim() || disabled}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Apply'}
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Enter your discount code to get a reduced price on your reservation.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DiscountCodeInput; 