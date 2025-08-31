import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css'

function Login({ onLogin }) {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const response = await fetch('http://localhost:8000/login', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      setMessage(data.message);
      sessionStorage.setItem('loggedIn', 'true');
      sessionStorage.setItem('username', data.user.username);
      sessionStorage.setItem('userId', data.user.id);
      console.log(data.user.username);
      if (onLogin) onLogin();
      navigate('/');
    } else {
      setMessage(data.detail || 'Login failed');
    }
  };

  return (
    <div className="Login">
      <h2 className="login-welcome">Crochet Scribbles</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username </label>
          <input id="username" type="text" name="username" required />
        </div>
        <div>
          <label htmlFor="password">Password </label>
          <input id="password" type="password" name="password" required />
        </div>
        <div>
          <button className="btn btn-primary" type="submit">Login</button>
        </div>
      </form>
      {message && <div className="login-error">{message}</div>}
      <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
    </div>
  )
}

export default Login