import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import 'bootstrap/dist/css/bootstrap.css';
import Home from './Home'
import Login from './Login'

function App() {
  const [loggedIn, setLoggedIn] = useState(sessionStorage.getItem('loggedIn') === 'true')
  const [username, setUsername] = useState(sessionStorage.getItem('username') || '')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={loggedIn ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login onLogin={() => {
          setLoggedIn(true);
          setUsername(sessionStorage.getItem('username') || '');
        }} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
