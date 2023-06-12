import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import './Login.css';

const Login = () => {
  const auth = getAuth();

  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log('Usuário logado:', user);
      })
      .catch((error) => {
        console.error('Erro ao fazer login:', error);
      });
  };

  return (
    <div className="login-container">
      <h1>Fazer login com Google</h1>
      <button className="login-button" onClick={handleGoogleLogin}>
        Login com Google
      </button>
    </div>
  );
};

export default Login;
