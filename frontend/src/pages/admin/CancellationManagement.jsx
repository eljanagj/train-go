import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Close,
  Delete,
  Visibility,
} from "@mui/icons-material";
import Sidebar from "../../components/Sidebar";

const CancellationManagement = ({ theme, toggleTheme }) => {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCancellation, setSelectedCancellation] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancellationToDelete, setCancellationToDelete] = useState(null);

  useEffect(() => {
    fetchCancellations();
  }, []);

  const fetchCancellations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cancellations");
      setCancellations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Failed to fetch cancellation requests");
      setCancellations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedCancellation) return;

    try {
      await api.post(`/cancellations/${selectedCancellation.id}/status`, {
        status,
        adminNotes,
        refundAmount: parseFloat(refundAmount) || undefined,
      });
      setSuccessMessage(
        `Cancellation request ${status.toLowerCase()} successfully`
      );
      setSelectedCancellation(null);
      setAdminNotes("");
      setRefundAmount("");
      fetchCancellations();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to update cancellation status");
    }
  };

  const handleDeleteClick = (cancellation) => {
    setCancellationToDelete(cancellation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cancellationToDelete) return;

    try {
      await api.delete(`/cancellations/${cancellationToDelete.id}`);
      setSuccessMessage(
        "Cancellation request and reservation deleted successfully"
      );
      setDeleteDialogOpen(false);
      setCancellationToDelete(null);
      fetchCancellations();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete cancellation request");
    } finally {
      // Ensure delete dialog is closed even on error
      if (deleteDialogOpen) {
        setDeleteDialogOpen(false);
      }
    }
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="management-page">
          <Container>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="50vh"
            >
              <Typography>Loading...</Typography>
            </Box>
          </Container>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Sidebar />
        <div className="management-page">
          <Container>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="50vh"
            >
              <Alert severity="error">{error}</Alert>
            </Box>
          </Container>
        </div>
      </>
    );
  }

  const pendingCancellations = cancellations.filter(
    (c) => c.status === "PENDING"
  );
  const approvedCancellations = cancellations.filter(
    (c) => c.status === "APPROVED"
  );
  const rejectedCancellations = cancellations.filter(
    (c) => c.status === "REJECTED"
  );

  return (
    <>
      <Sidebar />
      <div className="management-page">
        <Container>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Cancellation Requests
            </Typography>

            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <Chip
                label={`Total: ${cancellations.length}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`Pending: ${pendingCancellations.length}`}
                color="warning"
                variant="outlined"
              />
              <Chip
                label={`Approved: ${approvedCancellations.length}`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`Rejected: ${rejectedCancellations.length}`}
                color="error"
                variant="outlined"
              />
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reservation ID</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Requested Date</TableCell>
                    <TableCell>Refund Amount</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cancellations.map((cancellation) => (
                    <TableRow key={cancellation.id}>
                      <TableCell>#{cancellation.reservation.id}</TableCell>
                      <TableCell>{cancellation.reason}</TableCell>
                      <TableCell>
                        <Chip
                          label={cancellation.status}
                          color={
                            cancellation.status === "PENDING"
                              ? "warning"
                              : cancellation.status === "APPROVED"
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(cancellation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {cancellation.refundAmount
                          ? `$${cancellation.refundAmount}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {cancellation.status === "PENDING" ? (
                            <Tooltip title="Review">
                              <IconButton
                                color="info"
                                size="small"
                                onClick={() => {
                                  setSelectedCancellation(cancellation);
                                  setAdminNotes(cancellation.adminNotes || "");
                                  setRefundAmount(
                                    cancellation.refundAmount || ""
                                  );
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteClick(cancellation)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Container>

        <Dialog
          open={!!selectedCancellation}
          onClose={() => setSelectedCancellation(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Review Cancellation Request</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Reservation Details
              </Typography>
              <Typography variant="body2" paragraph>
                ID: #{selectedCancellation?.reservation.id}
              </Typography>
              <Typography variant="body2" paragraph>
                Price: ${selectedCancellation?.reservation.price}
              </Typography>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Cancellation Reason
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedCancellation?.reason}
              </Typography>

              <TextField
                fullWidth
                label="Admin Notes"
                multiline
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                sx={{ mt: 2 }}
              />

              <TextField
                fullWidth
                label="Refund Amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                InputProps={{
                  startAdornment: "$",
                }}
                sx={{ mt: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setSelectedCancellation(null)}
              startIcon={<Close />}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleStatusUpdate("REJECTED")}
              color="error"
              startIcon={<Cancel />}
            >
              Reject
            </Button>
            <Button
              onClick={() => handleStatusUpdate("APPROVED")}
              color="success"
              startIcon={<CheckCircle />}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Cancellation Request</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this cancellation request and its
              associated reservation? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              startIcon={<Close />}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              startIcon={<Delete />}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default CancellationManagement;
