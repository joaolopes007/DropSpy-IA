import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Explore } from "./pages/Explore";
import { Saved } from "./pages/Saved";
import { Settings } from "./pages/Settings";
import { Plans } from "./pages/Plans";
import { Integrations } from "./pages/Integrations";
import { Suppliers } from "./pages/Suppliers";
import { Calculator } from "./pages/Calculator";
import { Activities } from "./pages/Activities";
import { Terms } from "./pages/Terms";
import { Privacy } from "./pages/Privacy";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access to Plans page even if unsubscribed (it acts as the payment page)
  if (location.pathname === "/plans") {
    return <>{children}</>;
  }

  const isSubscribed = profile?.subscription_active && 
                     (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) >= new Date());

  if (!isSubscribed) {
    return <Navigate to="/plans" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();
  return (
    <main className="bg-black min-h-screen text-white font-sans flex overflow-hidden">
      <Sidebar onLogout={logout} />
      <div className="flex-1 ml-64 flex flex-col h-screen relative">
        <Header />
        <div className="flex-1 p-12 overflow-y-auto relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] pointer-events-none" />
          {children}
        </div>
      </div>
    </main>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login mode="login" />} />
            <Route path="/register" element={<Login mode="register" />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/explore" element={
              <ProtectedRoute>
                <AppLayout><Explore /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/saved" element={
              <ProtectedRoute>
                <AppLayout><Saved /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/integrations" element={
              <ProtectedRoute>
                <AppLayout><Integrations /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/suppliers" element={
              <ProtectedRoute>
                <AppLayout><Suppliers /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/calculator" element={
              <ProtectedRoute>
                <AppLayout><Calculator /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/activities" element={
              <ProtectedRoute>
                <AppLayout><Activities /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout><Settings /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/plans" element={
              <ProtectedRoute>
                <AppLayout><Plans /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
