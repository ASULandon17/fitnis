import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './SignIn.css';

function SignIn() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // eslint-disable-next-line no-unused-vars
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          setMessage(error.message);
        } else {
          setMessage('Successfully signed in!');
          // You can redirect user here later
        }
      } else {
        // eslint-disable-next-line no-unused-vars
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (error) {
          setMessage(error.message);
        } else {
          setMessage('Check your email for verification link!');
        }
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <div className="signin-form">
          <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
          {message && (
            <div className={`message ${message.includes('Successfully') || message.includes('Check') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength="6"
              />
            </div>
            <button type="submit" className="signin-btn-submit" disabled={loading}>
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
          <p className="signin-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;