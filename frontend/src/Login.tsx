import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css'
import { setAccessToken } from './api/client';

interface LoginProps {
  onLogin?: () => void;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: { user_id: number; username: string };
  detail?: string;
}

function Login({ onLogin }: LoginProps) {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch('http://localhost:8000/login', {
      method: 'POST',
      body: formData,
    });
    const data: LoginResponse = await response.json();
    if (response.ok) {
      setAccessToken(data.access_token);
      sessionStorage.setItem('loggedIn', 'true');
      sessionStorage.setItem('username', data.user.username);
      sessionStorage.setItem('userId', String(data.user.user_id));
      if (onLogin) onLogin();
      navigate('/projects');
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
