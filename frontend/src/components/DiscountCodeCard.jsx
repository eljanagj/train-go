import React, { useState } from 'react';
import { Card, CardContent, Typography, Chip, Box, Alert, Button, CircularProgress } from '@mui/material';
import { LocalOffer, Schedule, Percent, Refresh } from '@mui/icons-material';
import discountService from '../services/discountService';

const DiscountCodeCard = ({ discountCode, eligibility, userId, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  
  if (!discountCode && !eligibility?.isEligible) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Discount Codes
            </Typography>
          </Box>
          
          {refreshMessage && (
            <Alert severity={refreshMessage.includes('Error') ? 'error' : 'info'} sx={{ mb: 2 }}>
              {refreshMessage}
            </Alert>
          )}
          
          {eligibility && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                You have {eligibility.currentReservationCount} reservations. 
                {eligibility.nextDiscountAt > 0 && (
                  <> Make {eligibility.nextDiscountAt - eligibility.currentReservationCount} more reservations to get your first discount code!</>
                )}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!discountCode) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Discount Codes
            </Typography>
          </Box>
          
          {refreshMessage && (
            <Alert severity={refreshMessage.includes('Error') ? 'error' : 'info'} sx={{ mb: 2 }}>
              {refreshMessage}
            </Alert>
          )}
          
          <Alert severity="info">
            No discount codes available yet.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isExpired = new Date(discountCode.expireDate) < new Date();
  const isActive = !isExpired;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
             Discount Codes
          </Typography>
        </Box>
        
        {refreshMessage && (
          <Alert severity={refreshMessage.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {refreshMessage}
          </Alert>
        )}
        
        <Card 
          variant="outlined" 
          sx={{ 
            mt: 2,
            background: '#ffffff',
            border: isExpired ? '1px solid #e0e0e0' : '1px solid #4caf50',
            borderRadius: '8px',
            boxShadow: isExpired ? '0 2px 4px rgba(0,0,0,0.05)' : '0 2px 8px rgba(76, 175, 80, 0.15)',
            color: 'inherit'
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography variant="h5" component="div" fontWeight="bold" color="text.primary">
                {discountCode.code}
              </Typography>
              <Chip 
                label={isActive ? 'ACTIVE' : 'EXPIRED'}
                color={isActive ? 'success' : 'error'}
                size="small"
              />
            </Box>
            
            <Box display="flex" alignItems="center" mb={1}>
              <Percent sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.primary">
                {discountCode.discountPercentage}% Discount
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" mb={1}>
              <Schedule sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Expires: {new Date(discountCode.expireDate).toLocaleDateString()}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center">
              <LocalOffer sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Status: {isActive ? 'Ready to use' : 'Expired'}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {eligibility && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              You have {eligibility.currentReservationCount} reservations.
              {eligibility.nextDiscountAt > 0 && eligibility.nextDiscountPercentage > eligibility.currentDiscountPercentage && (
                <> Make {eligibility.nextDiscountAt - eligibility.currentReservationCount} more reservations to upgrade to {eligibility.nextDiscountPercentage}% discount!</>
              )}
              {eligibility.currentDiscountPercentage === 30 && (
                <> You've reached the maximum discount level! 🎉</>
              )}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscountCodeCard; 