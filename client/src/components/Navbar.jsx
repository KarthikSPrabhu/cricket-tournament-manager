import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaTrophy, FaChartBar, FaCricket } from 'react-icons/fa';
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: <FaHome /> },
    { path: '/matches', label: 'Matches', icon: <FaCricket /> },
    { path: '/points-table', label: 'Points Table', icon: <FaTrophy /> },
    { path: '/statistics', label: 'Statistics', icon: <FaChartBar /> },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <FaCricket className="navbar-logo" />
          <span className="navbar-title">Cricket Tournament 2023</span>
        </div>

        <button 
          className="navbar-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="navbar-toggle-icon"></span>
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar-item ${
                location.pathname === item.path ? 'active' : ''
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="navbar-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          <Link
            to="/admin/login"
            className="navbar-item admin-btn"
            onClick={() => setIsMenuOpen(false)}
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;