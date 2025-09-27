import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Food from './components/Food';
import Workouts from './components/Workouts';
import About from './components/About';
import SignIn from './components/SignIn';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/food" element={<Food />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/about" element={<About />} />
          <Route path="/signin" element={<SignIn />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;