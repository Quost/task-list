import React from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';

const Home = ({ user, handleLogout }) => {
  const navigate = useNavigate();

  //function to logout
  const logout = () => {
    handleLogout();
    navigate('/login');
  };

  return (
    <div className="home-container">
      <h1>Bem-vindo, {user.displayName}!</h1>
      <button className="logout-button" onClick={logout}>
        Deslogar
      </button>
    </div>
  );
};

export default Home;
