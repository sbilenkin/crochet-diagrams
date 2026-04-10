import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import './index.css'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

interface HomeProps {
  loggedIn: boolean;
  username: string;
}

function Home({ username }: HomeProps) {
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
        {/* Your main content goes here */}
        <div>
          <Stage width={window.innerWidth} height={window.innerHeight}>
            <Layer>
              <Text text="Try to drag shapes" fontSize={15} />
              <Rect
                x={20}
                y={50}
                width={100}
                height={100}
                fill="red"
                shadowBlur={10}
                draggable
              />
              <Circle
                x={200}
                y={100}
                radius={50}
                fill="green"
                draggable
              />
            </Layer>
          </Stage>
        </div>
      </main>
      <button className="logout-button btn btn-primary" onClick={handleLogout}>Log Out</button>
    </div>
  )
}

export default Home