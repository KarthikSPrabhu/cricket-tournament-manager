import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaCricket } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './AdminLogin.css';

const AdminLogin = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.user.role === 'admin') {
          navigate('/admin/dashboard');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error('Please enter admin code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid admin code');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="login-header">
          <div className="logo-circle">
            <FaCricket className="logo-icon" />
          </div>
          <h1>Admin Portal</h1>
          <p className="subtitle">Cricket Tournament Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="adminCode">
              <FaLock /> Admin Access Code
            </label>
            <input
              type="password"
              id="adminCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter admin code"
              disabled={loading}
              autoComplete="off"
              autoFocus
            />
            <small className="hint">
              Enter the predefined admin code to access the dashboard
            </small>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Authenticating...
              </>
            ) : (
              'Access Dashboard'
            )}
          </button>

          <div className="login-footer">
            <p className="note">
              <strong>Note:</strong> This area is restricted to tournament administrators only.
              Unauthorized access is prohibited.
            </p>
            <button 
              type="button" 
              className="back-btn"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </button>
          </div>
        </form>

        <div className="security-info">
          <h3>Security Guidelines:</h3>
          <ul>
            <li>Never share your admin code with anyone</li>
            <li>Always log out after your session</li>
            <li>Use a secure connection</li>
            <li>Report any suspicious activity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;