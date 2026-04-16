import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Login from './Login'
import Signup from './Signup'
import EditorPage from './pages/EditorPage'
import ProjectsListPage from './pages/ProjectsListPage'
import { getAccessToken } from './api/client'

function App() {
  const [loggedIn, setLoggedIn] = useState(!!getAccessToken())

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={loggedIn ? '/projects' : '/login'} replace />} />
        <Route path="/login" element={<Login onLogin={() => setLoggedIn(true)} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/projects" element={loggedIn ? <ProjectsListPage /> : <Navigate to="/login" replace />} />
        <Route path="/editor/:projectId" element={loggedIn ? <EditorPage /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
