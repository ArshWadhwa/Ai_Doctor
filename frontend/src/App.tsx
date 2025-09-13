import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ConsultationPage from './components/ConsultationPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/consultation" element={<ConsultationPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
