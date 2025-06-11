import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth0 } from '@auth0/auth0-react';
import { faqService } from '../../services/faqService';

const FAQList = () => {
  const [faqs, setFaqs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth0();

  const isAdmin = isAuthenticated && user?.['https://your-namespace/roles']?.includes('admin');

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    try {
      const data = await faqService.getAllFaqs();
      setFaqs(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setError('Failed to load FAQs. Please try again later.');
      setFaqs([]);
    }
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await faqService.deleteFaq(id);
        await loadFaqs();
        setError(null);
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        setError('Failed to delete FAQ. Please try again later.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await faqService.updateFaq(editingFaq.id, formData);
      } else {
        await faqService.createFaq(formData);
      }
      setOpenDialog(false);
      setEditingFaq(null);
      setFormData({ question: '', answer: '' });
      await loadFaqs();
      setError(null);
    } catch (error) {
      console.error('Error saving FAQ:', error);
      setError('Failed to save FAQ. Please try again later.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Frequently Asked Questions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isAdmin && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setEditingFaq(null);
              setFormData({ question: '', answer: '' });
              setOpenDialog(true);
            }}
          >
            Add New FAQ
          </Button>
        </Box>
      )}

      {Array.isArray(faqs) && faqs.length > 0 ? (
        faqs.map((faq) => (
          <Accordion key={faq.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{faq.answer}</Typography>
              {isAdmin && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton onClick={() => handleEdit(faq)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(faq.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          No FAQs available.
        </Typography>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              margin="normal"
              required
              multiline
              rows={4}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingFaq ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default FAQList; 