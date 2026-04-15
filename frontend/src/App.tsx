import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Home from './Home'
import Login from './Login'
import Signup from './Signup'
import EditorPage from './pages/EditorPage'

function App() {
  const [loggedIn, setLoggedIn] = useState(sessionStorage.getItem('loggedIn') === 'true')
  const [username, setUsername] = useState(sessionStorage.getItem('username') || '')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={loggedIn ? <Home loggedIn={loggedIn} username={username} /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login onLogin={() => {
          setLoggedIn(true);
          setUsername(sessionStorage.getItem('username') || '');
        }} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
