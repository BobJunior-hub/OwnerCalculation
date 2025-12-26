import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { App as AntdApp } from "antd";
import LoginPage from "./login";
import MyMenu, { DashboardLayout } from "./menu";
import Owners from "./pages/owners";
import Analytics from "./pages/analytics";

export default function App() {
  return (
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
  );
}
