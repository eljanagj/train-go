import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  CleaningServices,
  Person,
  Schedule,
  LocalOffer
} from '@mui/icons-material';
import discountService from '../../services/discountService';
import Sidebar from '../../components/Sidebar';
import '../../styles/management.css';

const DiscountCodeManagement = () => {
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDiscountCodes();
  }, []);

  const loadDiscountCodes = async () => {
    try {
      setLoading(true);
      const codes = await discountService.getAllDiscountCodes();
      setDiscountCodes(codes);
    } catch (error) {
      console.error('Error loading discount codes:', error);
      setMessage('Error loading discount codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupExpired = async () => {
    try {
      setCleanupLoading(true);
      const result = await discountService.cleanupExpiredCodes();
      setMessage(`${result} expired discount codes removed`);
      loadDiscountCodes();
    } catch (error) {
      console.error('Error cleaning up expired codes:', error);
      setMessage('Error cleaning up expired codes');
    } finally {
      setCleanupLoading(false);
    }
  };

  const getStatusColor = (code) => {
    if (new Date(code.expireDate) < new Date()) return 'error';
    return 'success';
  };

  const getStatusText = (code) => {
    if (new Date(code.expireDate) < new Date()) return 'EXPIRED';
    return 'ACTIVE';
  };

  const expiredCodes = discountCodes.filter(code => 
    new Date(code.expireDate) < new Date()
  );

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="management-page">
          <Container>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress />
            </Box>
          </Container>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="management-page">
        <Container maxWidth="lg">
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" gutterBottom>
                Discount Code Management
              </Typography>
              <Button
                variant="contained"
                color="warning"
                startIcon={cleanupLoading ? <CircularProgress size={20} /> : <CleaningServices />}
                onClick={handleCleanupExpired}
                disabled={cleanupLoading || expiredCodes.length === 0}
              >
                Cleanup Expired ({expiredCodes.length})
              </Button>
            </Box>

            {message && (
              <Alert 
                severity={message.includes('Error') ? 'error' : 'success'} 
                sx={{ mb: 2 }}
                onClose={() => setMessage('')}
              >
                {message}
              </Alert>
            )}

            <Box mb={2}>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Box display="flex" gap={2}>
                <Chip 
                  label={`Total: ${discountCodes.length}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  label={`Active: ${discountCodes.filter(c => new Date(c.expireDate) >= new Date()).length}`}
                  color="success"
                  variant="outlined"
                />
                <Chip 
                  label={`Expired: ${expiredCodes.length}`}
                  color="error"
                  variant="outlined"
                />
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Expire Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {discountCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LocalOffer sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" fontFamily="monospace">
                            {code.code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Person sx={{ mr: 1, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {code.user?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${code.discountPercentage}%`}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(code.expireDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(code)}
                          color={getStatusColor(code)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(code.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {discountCodes.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  No discount codes found
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      </div>
    </>
  );
};

export default DiscountCodeManagement; 