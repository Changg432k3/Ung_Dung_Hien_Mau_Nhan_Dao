/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { UserDashboard } from './pages/UserDashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminEvents } from './pages/admin/Events';
import { AdminEventDetails } from './pages/admin/EventDetails';
import { AdminLocations } from './pages/admin/Locations';
import { AdminParticipants } from './pages/admin/Participants';
import { AdminDonors } from './pages/admin/Donors';
import { AdminReports } from './pages/admin/Reports';
import { AdminMapEvents } from './pages/admin/MapEvents';
import { AdminBadges } from './pages/admin/Badges';
import { AdminCertificates } from './pages/admin/Certificates';
import { AdminPosts } from './pages/admin/Posts';
import { AdminLeaderboard } from './pages/admin/Leaderboard';
import { AdminRoles } from './pages/admin/Roles';
import { AdminSecurity } from './pages/admin/Security';
import { AdminInventory } from './pages/admin/Inventory';
import { Events } from './pages/Events';
import { EventDetails } from './pages/EventDetails';
import { History } from './pages/History';
import { Certificate } from './pages/Certificate';
import { VerifyCertificate } from './pages/VerifyCertificate';
import { useParams } from 'react-router-dom';
import { UserProfile } from './pages/UserProfile';
import { Rewards } from './pages/Rewards';
import { Leaderboard } from './pages/Leaderboard';
import { Community } from './pages/Community';
import { AboutUs } from './pages/AboutUs';
import { PublicEvents } from './pages/PublicEvents';
import { Guide } from './pages/Guide';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { PublicLayout } from './components/PublicLayout';
import { useApp } from './store/AppContext';
import { Toaster } from 'sonner';

import { CreateEvent } from './pages/CreateEvent';

// Wrapper to handle role-based routing for public pages
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useApp();
  if (currentUser) {
    return ['admin', 'staff', 'organizer'].includes(currentUser.role) ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

// Admin Route Wrapper
const AdminRoute = () => {
  const { currentUser } = useApp();
  console.log('AdminRoute: currentUser', currentUser);
  if (!currentUser) return <Navigate to="/login" />;
  if (!['admin', 'staff', 'organizer'].includes(currentUser.role)) {
    console.log('AdminRoute: Not an admin/staff/organizer, redirecting to /');
    return <Navigate to="/" />;
  }
  return <AdminLayout />;
};

const CertificateRoute = () => {
  const { id } = useParams();
  return <Certificate initialRecordId={id} />;
};

// Donor Route Wrapper
const DonorRoute = () => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" />;
  if (['admin', 'staff', 'organizer'].includes(currentUser.role)) {
    return <Navigate to="/admin" />;
  }
  return <Layout />;
};

// Super Admin Route Wrapper
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role !== 'admin') {
    return <Navigate to="/admin" />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicOnlyRoute><Home /></PublicOnlyRoute>} />
            <Route path="/about-us" element={<PublicOnlyRoute><AboutUs /></PublicOnlyRoute>} />
            <Route path="/public-events" element={<PublicOnlyRoute><PublicEvents /></PublicOnlyRoute>} />
            <Route path="/guide" element={<PublicOnlyRoute><Guide /></PublicOnlyRoute>} />
          </Route>
          
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          
          <Route path="/verify/:id" element={<VerifyCertificate />} />
          
          <Route element={<DonorRoute />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/settings" element={<UserProfile />} /> {/* Using UserProfile for now as a placeholder for settings */}
            <Route path="/history" element={<History />} />
            <Route path="/certificate" element={<CertificateRoute />} />
            <Route path="/certificate/:id" element={<CertificateRoute />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/community" element={<Community />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/events/new" element={<CreateEvent />} />
            <Route path="/admin/events/:id" element={<AdminEventDetails />} />
            <Route path="/admin/locations" element={<AdminLocations />} />
            <Route path="/admin/participants" element={<AdminParticipants />} />
            <Route path="/admin/donors" element={<AdminDonors />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/map-events" element={<AdminMapEvents />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/badges" element={<AdminBadges />} />
            <Route path="/admin/certificates" element={<AdminCertificates />} />
            <Route path="/admin/posts" element={<AdminPosts />} />
            <Route path="/admin/leaderboard" element={<AdminLeaderboard />} />
            <Route path="/admin/roles" element={<SuperAdminRoute><AdminRoles /></SuperAdminRoute>} />
            <Route path="/admin/security" element={<SuperAdminRoute><AdminSecurity /></SuperAdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
