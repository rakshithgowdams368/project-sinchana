import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import UserAuth from './pages/UserAuth';
import VendorAuth from './pages/VendorAuth';
import AdminAuth from './pages/AdminAuth';
import UserOnboarding from './pages/UserOnboarding';
import VendorOnboarding from './pages/VendorOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import Pending from './pages/Pending';
import VendorDashboard from './pages/VendorDashboard';
import Payment from './pages/Payment';
import UserDashboard from './pages/UserDashboard';
import Category from './pages/Category';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category" element={<Category />} />
        <Route path="/user_auth" element={<UserAuth />} />
        <Route path="/vendor_auth" element={<VendorAuth />} />
        <Route path="/admin_auth" element={<AdminAuth />} />
        <Route path="/user_onboarding" element={<UserOnboarding />} />
        <Route path="/vendor_onboarding" element={<VendorOnboarding />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/user_dashboard" element={<UserDashboard />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/vendor_dashboard" element={<VendorDashboard />} />
        <Route path="/admin_dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
