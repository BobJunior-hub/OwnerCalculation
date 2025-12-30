import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntdApp } from "antd";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LoginPage from "./login";
import MyMenu, { DashboardLayout } from "./menu";
import Analytics from "./pages/analytics";
import Owners from "./pages/owners";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/menu" element={<MyMenu />} />
            <Route path="/owners" element={<DashboardLayout><Owners /></DashboardLayout>} />
            <Route path="/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
          </Routes>
        </Router>
      </AntdApp>
    </QueryClientProvider>
  );
}
