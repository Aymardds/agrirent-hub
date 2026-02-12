import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Catalogue = lazy(() => import("./pages/Catalogue"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyEquipment = lazy(() => import("./pages/dashboard/MyEquipment"));
const MyRentals = lazy(() => import("./pages/dashboard/MyRentals"));
const MyInvoices = lazy(() => import("./pages/dashboard/MyInvoices"));
const Properties = lazy(() => import("./pages/dashboard/Properties"));
const Harvests = lazy(() => import("./pages/dashboard/Harvests"));
const UsersList = lazy(() => import("./pages/dashboard/UsersList"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Stock = lazy(() => import("./pages/dashboard/Stock"));
const Interventions = lazy(() => import("./pages/dashboard/Interventions"));
const Accounting = lazy(() => import("./pages/dashboard/Accounting"));
const Planning = lazy(() => import("./pages/dashboard/Planning"));
const Stats = lazy(() => import("./pages/dashboard/Stats"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const TechnicianDashboard = lazy(() => import("./pages/dashboard/TechnicianDashboard"));
const ClientDashboard = lazy(() => import("./pages/dashboard/ClientDashboard"));
const StockManagerDashboard = lazy(() => import("./pages/dashboard/StockManagerDashboard"));
const AccountantDashboard = lazy(() => import("./pages/dashboard/AccountantDashboard"));
const Expenses = lazy(() => import("./pages/dashboard/Expenses"));
const DebugRole = lazy(() => import("./pages/dashboard/DebugRole"));
const ConnectionTest = lazy(() => import("./pages/ConnectionTest"));
const NetworkDiagnostic = lazy(() => import("./pages/NetworkDiagnostic"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<LoadingSpinner />}>
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
              <Route path="/dashboard/expenses" element={
                <ProtectedRoute allowedRoles={['accountant', 'admin', 'super_admin']}>
                  <Expenses />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/planning" element={
                <ProtectedRoute allowedRoles={['stock_manager', 'admin', 'super_admin']}>
                  <Planning />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/stats" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <Stats />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/properties" element={
                <ProtectedRoute allowedRoles={['client', 'admin', 'super_admin']}>
                  <Properties />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/harvests" element={
                <ProtectedRoute allowedRoles={['client', 'admin', 'super_admin']}>
                  <Harvests />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/technician" element={
                <ProtectedRoute allowedRoles={['technician', 'admin', 'super_admin']}>
                  <TechnicianDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/client" element={
                <ProtectedRoute allowedRoles={['client', 'admin', 'super_admin']}>
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/stock-manager" element={
                <ProtectedRoute allowedRoles={['stock_manager', 'admin', 'super_admin']}>
                  <StockManagerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/accountant" element={
                <ProtectedRoute allowedRoles={['accountant', 'admin', 'super_admin']}>
                  <AccountantDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/debug-role" element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <DebugRole />
                </ProtectedRoute>
              } />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);


export default App;
