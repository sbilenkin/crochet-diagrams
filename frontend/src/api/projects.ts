import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { SerializedCanvas } from '../types/canvas';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFull extends ProjectSummary {
  canvas_json: SerializedCanvas;
}

export interface ProjectCreate {
  name: string;
  description?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
}

export function listProjects() {
  return apiGet<ProjectSummary[]>('/api/projects');
}

export function createProject(payload: ProjectCreate) {
  return apiPost<ProjectFull>('/api/projects', payload);
}

export function getProject(id: string) {
  return apiGet<ProjectFull>(`/api/projects/${id}`);
}

export function updateProject(id: string, payload: ProjectUpdate) {
  return apiPut<ProjectSummary>(`/api/projects/${id}`, payload);
}

export function saveCanvas(
  id: string,
  canvasJson: SerializedCanvas,
  thumbnail?: string,
) {
  return apiPut<ProjectSummary>(`/api/projects/${id}/canvas`, {
    canvas_json: canvasJson,
    thumbnail,
  });
}

export function deleteProject(id: string) {
  return apiDelete<void>(`/api/projects/${id}`);
}
