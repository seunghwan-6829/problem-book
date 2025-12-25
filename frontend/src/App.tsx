import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import ProblemDetail from './pages/ProblemDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import MockExam from './pages/MockExam';
import Coming from './pages/Coming';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/problems/:id" element={<ProblemDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/mock-exam" element={<MockExam />} />
          <Route path="/coming" element={<Coming />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

