import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Fitnis</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/food" className="nav-link">Food</Link>
          <Link to="/workouts" className="nav-link">Workouts</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/signin" className="nav-link signin-btn">Sign In</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;