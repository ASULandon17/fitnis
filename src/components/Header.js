import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

function Header() {
  const { currentUser, userProfile } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Fitniss</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/food" className="nav-link">Food</Link>
          <Link to="/workouts" className="nav-link">Workouts</Link>
          <Link to="/about" className="nav-link">About</Link>
          {currentUser ? (
            <Link to="/profile" className="profile-link">
              <div className="profile-avatar">
                {userProfile?.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt="Profile" 
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {userProfile?.username?.charAt(0)?.toUpperCase() || 
                     currentUser.email?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <Link to="/signin" className="nav-link signin-btn">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;