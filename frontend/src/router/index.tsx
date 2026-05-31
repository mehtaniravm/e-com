import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import PrivateRoute from '@/components/PrivateRoute'
import LoginPage from '@/pages/LoginPage'
import Dashboard from '@/pages/Dashboard'
import OrdersPage from '@/pages/OrdersPage'
import UserManagementPage from '@/pages/UserManagementPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    element: <PrivateRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/orders', element: <OrdersPage /> },
          {
            element: <PrivateRoute requiredRole="ADMIN" />,
            children: [{ path: '/admin/users', element: <UserManagementPage /> }],
          },
        ],
      },
    ],
    errorElement: <NotFoundPage />,
  },
])
