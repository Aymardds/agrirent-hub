import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Catalogue from "./pages/Catalogue";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyEquipment from "./pages/dashboard/MyEquipment";
import MyRentals from "./pages/dashboard/MyRentals";
import UsersList from "./pages/dashboard/UsersList";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Stock from "./pages/dashboard/Stock";
import Interventions from "./pages/dashboard/Interventions";
import Accounting from "./pages/dashboard/Accounting";
import Planning from "./pages/dashboard/Planning";
import Stats from "./pages/dashboard/Stats";
import Settings from "./pages/dashboard/Settings";
import TechnicianDashboard from "./pages/dashboard/TechnicianDashboard";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import StockManagerDashboard from "./pages/dashboard/StockManagerDashboard";
import AccountantDashboard from "./pages/dashboard/AccountantDashboard";
import DebugRole from "./pages/dashboard/DebugRole";
import ConnectionTest from "./pages/ConnectionTest";
import NetworkDiagnostic from "./pages/NetworkDiagnostic";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/connection-test" element={<ConnectionTest />} />
            <Route path="/network-diagnostic" element={<NetworkDiagnostic />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Dashboard Routes - FLAT structure for reliability */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/dashboard/equipment" element={
              <ProtectedRoute allowedRoles={['client', 'stock_manager', 'admin', 'super_admin', 'cooperative', 'provider']}>
                <Stock />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/rentals" element={
              <ProtectedRoute allowedRoles={['client', 'stock_manager', 'admin', 'super_admin', 'cooperative', 'provider']}>
                <MyRentals />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/users" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <UsersList />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/stock" element={
              <ProtectedRoute allowedRoles={['stock_manager', 'admin', 'super_admin']}>
                <Stock />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/interventions" element={
              <ProtectedRoute allowedRoles={['technician', 'stock_manager', 'admin', 'super_admin']}>
                <Interventions />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/maintenance" element={
              <ProtectedRoute allowedRoles={['technician', 'stock_manager', 'admin', 'super_admin']}>
                <Interventions />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/invoices" element={
              <ProtectedRoute allowedRoles={['accountant', 'admin', 'super_admin']}>
                <Accounting />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/finances" element={
              <ProtectedRoute allowedRoles={['accountant', 'admin', 'super_admin']}>
                <Accounting />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/payments" element={
              <ProtectedRoute allowedRoles={['accountant', 'admin', 'super_admin']}>
                <Accounting />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/planning" element={
              <ProtectedRoute allowedRoles={['technician', 'stock_manager', 'admin', 'super_admin']}>
                <Planning />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/my-rentals" element={
              <ProtectedRoute allowedRoles={['client', 'stock_manager', 'admin', 'super_admin', 'cooperative', 'provider']}>
                <MyRentals />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/catalog" element={
              <ProtectedRoute>
                <Catalogue />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/my-invoices" element={
              <ProtectedRoute allowedRoles={['client', 'stock_manager', 'admin', 'super_admin', 'cooperative', 'provider']}>
                <MyRentals />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/technician" element={
              <ProtectedRoute allowedRoles={['technician', 'super_admin']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/client" element={
              <ProtectedRoute allowedRoles={['client', 'super_admin']}>
                <ClientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/stock-manager" element={
              <ProtectedRoute allowedRoles={['stock_manager', 'super_admin']}>
                <StockManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/accountant" element={
              <ProtectedRoute allowedRoles={['accountant', 'super_admin']}>
                <AccountantDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/debug-role" element={
              <ProtectedRoute>
                <DebugRole />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/stats" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'technician']}>
                <Stats />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'technician', 'stock_manager', 'client', 'accountant', 'cooperative', 'provider']}>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
