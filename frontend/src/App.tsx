import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { MembershipGate } from '@/components/program/MembershipGate';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { LandingPage } from '@/pages/Landing';
import { DashboardPage } from '@/pages/Dashboard';
import { DayViewPage } from '@/pages/DayView';
import { ProfilePage } from '@/pages/Profile';
import { ProgressPage } from '@/pages/Progress';
import { ProgramPage } from '@/pages/Program';
import { NetworkPage } from '@/pages/Network';
import { EarningsPage } from '@/pages/Earnings';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboard';
import { AdminDaysPage } from '@/pages/admin/AdminDays';
import { AdminDayDetailPage } from '@/pages/admin/AdminDayDetail';
import { AdminUsersPage } from '@/pages/admin/AdminUsers';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalytics';
import { AdminCommissionsPage } from '@/pages/admin/AdminCommissions';
import { AdminNetworkPage } from '@/pages/admin/AdminNetwork';
import { AdminWithdrawalsPage } from '@/pages/admin/AdminWithdrawals';
import { FloatingChat } from '@/components/chat/FloatingChat';

function App() {
  const { fetchMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, [isAuthenticated, fetchMe]);

  return (
    <ThemeProvider>
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 dark:bg-dark-900">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-dark-100 flex flex-col">
              <MobileHeader />
              <DesktopSidebar />
              <div className="flex flex-col flex-1 overflow-hidden md:pl-60">
                <DesktopHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-screen overflow-x-hidden min-w-0 max-w-7xl mx-auto w-full">
                  <ProtectedRoute>
                    <MembershipGate>
                      <Outlet />
                    </MembershipGate>
                  </ProtectedRoute>
                </main>
              </div>
            </div>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/day/:dayNumber" element={<DayViewPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/program" element={<ProgramPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/earnings" element={<EarningsPage />} />

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/days" element={<AdminDaysPage />} />
              <Route path="/admin/days/:dayId" element={<AdminDayDetailPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/commissions" element={<AdminCommissionsPage />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="/admin/network" element={<AdminNetworkPage />} />
            </Route>
          </Route>
        </Routes>
        <FloatingChat />
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
