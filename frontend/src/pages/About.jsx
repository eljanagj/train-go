import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
import { faqService } from '../services/faqService';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import "bootstrap/dist/css/bootstrap.min.css";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`about-tabpanel-${index}`}
      aria-labelledby={`about-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const About = () => {
  const [value, setValue] = useState(0);
  const [faqs, setFaqs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth0();

  const isAdmin = isAuthenticated && user?.['https://your-namespace/roles']?.includes('admin');

  React.useEffect(() => {
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

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className="search-page">
      <NavBar />
      <header className="search-header text-center">
        <div className="search-container">
          <h1 className="search-title display-4 mb-3">About TrainGo</h1>
          <p className="lead text-light">Your Premier Train Travel Platform</p>
        </div>
      </header>

      <Container className="mt-4" style={{ paddingTop: '0px', minHeight: 'calc(100vh - 200px)' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="about tabs"
              centered
              sx={{
                '& .MuiTab-root': {
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  minWidth: 120,
                },
              }}
            >
              <Tab label="About Us" />
              <Tab label="FAQs" />
              <Tab label="Terms & Conditions" />
              <Tab label="Privacy Policy" />
            </Tabs>
          </Box>

          <TabPanel value={value} index={0}>
            <Typography variant="h5" gutterBottom>
              Welcome to TrainGo
            </Typography>
            <Typography paragraph>
              TrainGo is your premier platform for seamless train travel booking and management. We are committed to providing
              a reliable, efficient, and user-friendly experience for all your train travel needs.
            </Typography>
            <Typography paragraph>
              Our mission is to revolutionize train travel by making it more accessible, convenient, and enjoyable for everyone.
              With our advanced booking system, real-time updates, and comprehensive travel information, we ensure that your
              journey is smooth from start to finish.
            </Typography>
            <Typography paragraph>
              Whether you're planning a business trip or a leisurely vacation, TrainGo offers a wide range of services to
              meet your needs. From seat selection to online payments, we've got you covered every step of the way.
            </Typography>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Frequently Asked Questions
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {isAdmin && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setEditingFaq(null);
                    setFormData({ question: '', answer: '' });
                    setOpenDialog(true);
                  }}
                  sx={{ mb: 2 }}
                >
                  Add New FAQ
                </Button>
              )}
            </Box>

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
              <Typography variant="body1" color="text.secondary">
                No FAQs available.
              </Typography>
            )}
          </TabPanel>

          <TabPanel value={value} index={2}>
            <Typography variant="h5" gutterBottom>
              Terms and Conditions
            </Typography>
            <Typography paragraph>
              By using TrainGo's services, you agree to comply with and be bound by the following terms and conditions.
              Please read them carefully before using our platform.
            </Typography>
            <Typography variant="h6" gutterBottom>
              1. Booking and Reservations
            </Typography>
            <Typography paragraph>
              • All bookings are subject to availability and confirmation.
              • Prices are subject to change without notice.
              • Cancellation policies vary by ticket type and route.
            </Typography>
            <Typography variant="h6" gutterBottom>
              2. Payment Terms
            </Typography>
            <Typography paragraph>
              • All payments must be made in full at the time of booking.
              • We accept various payment methods as indicated during checkout.
              • Refunds are processed according to our cancellation policy.
            </Typography>
            <Typography variant="h6" gutterBottom>
              3. Travel Requirements
            </Typography>
            <Typography paragraph>
              • Passengers must present valid identification and tickets.
              • Children under 12 must be accompanied by an adult.
              • Special assistance requirements should be notified in advance.
            </Typography>
          </TabPanel>

          <TabPanel value={value} index={3}>
            <Typography variant="h5" gutterBottom>
              Privacy Policy
            </Typography>
            <Typography paragraph>
              At TrainGo, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.
            </Typography>
            <Typography variant="h6" gutterBottom>
              1. Information Collection
            </Typography>
            <Typography paragraph>
              • Personal information (name, email, contact details)
              • Payment information
              • Travel preferences and history
              • Device and usage information
            </Typography>
            <Typography variant="h6" gutterBottom>
              2. Information Usage
            </Typography>
            <Typography paragraph>
              • To process your bookings and payments
              • To communicate about your travel
              • To improve our services
              • To send promotional offers (with your consent)
            </Typography>
            <Typography variant="h6" gutterBottom>
              3. Data Protection
            </Typography>
            <Typography paragraph>
              • We implement security measures to protect your data
              • We do not sell your personal information
              • You can request access to your data
              • You can opt-out of marketing communications
            </Typography>
          </TabPanel>
        </Paper>
      </Container>

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
      <Footer />
    </div>
  );
};

export default About; 