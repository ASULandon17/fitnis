import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Your Fitniss Journey</h1>
          <p>Transform your lifestyle with personalized workouts, nutrition tracking, and expert guidance.</p>
          <div className="hero-buttons">
            <button className="btn-primary">Get Started</button>
            <button className="btn-secondary">Learn More</button>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <h2>Everything You Need to Stay Fit</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🥗</div>
              <h3>Nutrition Tracking</h3>
              <p>Track your meals and maintain a healthy diet with our comprehensive food database.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💪</div>
              <h3>Custom Workouts</h3>
              <p>Get personalized workout plans tailored to your fitness level and goals.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your progress and stay motivated with detailed analytics and insights.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;