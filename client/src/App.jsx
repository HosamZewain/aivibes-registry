import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationDesk from './pages/RegistrationDesk';
import AdminImport from './pages/AdminImport';
import AdminDashboard from './pages/AdminDashboard';
import CheckIn from './pages/CheckIn';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<RegistrationDesk />} />
          <Route path="/admin" element={<AdminImport />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/check" element={<CheckIn />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
