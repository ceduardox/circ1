import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { DashboardPage } from '@/pages/Dashboard';
import { DayViewPage } from '@/pages/DayView';
import { ProfilePage } from '@/pages/Profile';
import { ProgressPage } from '@/pages/Progress';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboard';
import { AdminDaysPage } from '@/pages/admin/AdminDays';
import { AdminDayDetailPage } from '@/pages/admin/AdminDayDetail';
import { AdminUsersPage } from '@/pages/admin/AdminUsers';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalytics';

function App() {
  const { fetchMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, [isAuthenticated, fetchMe]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={
            <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
              <MobileHeader />
              <div className="flex flex-1 overflow-hidden">
                <DesktopSidebar />
                <main className="flex-1 md:pl-60 pt-16 md:pt-0 p-4 md:p-8 min-h-screen overflow-x-hidden min-w-0">
                  <ProtectedRoute />
                </main>
              </div>
            </div>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/day/:dayNumber" element={<DayViewPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/progress" element={<ProgressPage />} />

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/days" element={<AdminDaysPage />} />
              <Route path="/admin/days/:dayId" element={<AdminDayDetailPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            </Route>
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;