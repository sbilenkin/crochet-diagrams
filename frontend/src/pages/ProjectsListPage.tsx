import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createProject,
  deleteProject,
  listProjects,
  type ProjectSummary,
} from '../api/projects';
import { clearAccessToken } from '../api/client';

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, (Date.now() - then) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function ProjectsListPage() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem('username') ?? '';
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('Untitled Diagram');

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((e: Error) => setError(e.message));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      const p = await createProject({ name });
      navigate(`/editor/${p.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(id);
      setProjects((ps) => ps?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLogout = () => {
    clearAccessToken();
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userId');
    window.location.href = '/login';
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-4">
        <h2 className="mb-0">Your Projects</h2>
        <span className="text-muted ms-3">Hey, {username}</span>
        <div className="ms-auto d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCreating((c) => !c)}
          >
            {creating ? 'Cancel' : 'New Project'}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>

      {creating && (
        <form className="card card-body mb-4" onSubmit={handleCreate}>
          <div className="d-flex gap-2">
            <input
              autoFocus
              type="text"
              className="form-control"
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Create & open
            </button>
          </div>
        </form>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {projects === null ? (
        <div className="text-muted">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="text-muted">
          No projects yet. Click "New Project" to create one.
        </div>
      ) : (
        <div className="row g-3">
          {projects.map((p) => (
            <div key={p.id} className="col-sm-6 col-md-4 col-lg-3">
              <div className="card h-100">
                <div
                  className="card-img-top bg-light d-flex align-items-center justify-content-center"
                  style={{ height: 140 }}
                >
                  {p.thumbnail ? (
                    <img
                      src={p.thumbnail}
                      alt=""
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  ) : (
                    <span className="text-muted small">No preview</span>
                  )}
                </div>
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-truncate" title={p.name}>
                    {p.name}
                  </h5>
                  <div className="text-muted small mb-3">
                    Edited {formatRelative(p.updated_at)}
                  </div>
                  <div className="mt-auto d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary flex-grow-1"
                      onClick={() => navigate(`/editor/${p.id}`)}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsListPage;
