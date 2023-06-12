import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import Home from './components/home/Home';
import Login from './components/login/Login';
import NotFound from './components/not-found/NotFound';

import firebase from './config/firebase';

const App = () => {
  const [user, setUser] = useState(null);
  const auth = getAuth();  

  const handleLogout = () => {
    auth.signOut();
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  }, [auth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home user={user} handleLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
