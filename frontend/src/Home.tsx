import { useNavigate } from 'react-router-dom';
import './index.css'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

interface HomeProps {
  loggedIn: boolean;
  username: string;
}

function Home({ username }: HomeProps) {
  const navigate = useNavigate();
  const handleLogout = () => {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userId');
    window.location.reload();
  };

  return (
    <div className="Home d-flex">
      <nav className="sidebar d-flex flex-column p-3">
        <h4>Hey, {username}.</h4>
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item">
            <a href="#" className="nav-link active">Home</a>
          </li>
          <li>
            <a href="#" className="nav-link">Dashboard</a>
          </li>
          <li>
            <a href="#" className="nav-link">Settings</a>
          </li>
          <li className="nav-item dropdown">
            <a className="nav-link dropdown-toggle" href="#" id="recentProjectsDropdown"
              role="button" data-bs-toggle="dropdown" aria-expanded="false"
              onClick={(event) => event.preventDefault()}>
              Recent Projects
            </a>
            <ul className="dropdown-menu" aria-labelledby="recentProjectsDropdown">
              <li><a className="dropdown-item" href="#">Project A</a></li>
              <li><a className="dropdown-item" href="#">Project B</a></li>
              <li><a className="dropdown-item" href="#">Project C</a></li>
            </ul>
          </li>
        </ul>
      </nav>
      <main className="main-content flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h2 className="mb-3">Welcome back, {username}</h2>
          <p className="text-muted mb-4">Start a new crochet diagram or open a saved project.</p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/editor')}
          >
            New Diagram
          </button>
        </div>
      </main>
      <button className="logout-button btn btn-primary" onClick={handleLogout}>Log Out</button>
    </div>
  )
}

export default Home