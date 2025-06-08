import { createBrowserRouter } from 'react-router-dom';
import CancellationManagement from '../pages/admin/CancellationManagement';
import { ProtectedRoute } from '../components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/admin/cancellations',
    element: (
      <ProtectedRoute>
        <CancellationManagement />
      </ProtectedRoute>
    ),
  },
  // Add other routes here
]);

export default router; 