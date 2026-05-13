// ─────────────────────────────────────────────────────────────────────────────
// JiraService — Integración con la API de Jira Cloud
//
// Configurar en .env:
//   VITE_JIRA_BASE_URL=https://blueexpress.atlassian.net
//   VITE_JIRA_TOKEN=<personal_access_token>
//
// IMPORTANTE: Las credenciales NO deben hardcodearse nunca.
// En producción (GAS), las llamadas a Jira deben hacerse desde el backend
// (Código.gs) para no exponer el token en el frontend.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  JiraSearchParams,
  JiraSearchResult,
  JiraIssue,
} from './jiraTypes';

export class JiraService {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/rest/api/3${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Jira API ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  /**
   * Busca issues usando JQL.
   * Ejemplo: searchIssues({ jql: 'project = PLAN AND sprint in openSprints()' })
   */
  async searchIssues(params: JiraSearchParams): Promise<JiraSearchResult> {
    const body = {
      jql: params.jql,
      maxResults: params.maxResults ?? 50,
      startAt: params.startAt ?? 0,
      fields: params.fields ?? [
        'summary', 'status', 'issuetype', 'priority',
        'assignee', 'labels', 'created', 'updated', 'duedate',
        'customfield_10015', 'customfield_10016', 'customfield_10020',
      ],
    };
    return this.request<JiraSearchResult>('/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Obtiene una issue por su clave.
   * Ejemplo: getIssue('PLAN-123')
   */
  async getIssue(key: string): Promise<JiraIssue> {
    return this.request<JiraIssue>(`/issue/${key}`);
  }

  /**
   * Issues del sprint activo de un proyecto.
   */
  async getActiveSprintIssues(projectKey: string): Promise<JiraSearchResult> {
    return this.searchIssues({
      jql: `project = ${projectKey} AND sprint in openSprints() ORDER BY rank ASC`,
    });
  }
}

// Factory: instancia singleton desde variables de entorno
let _instance: JiraService | null = null;

export function getJiraService(): JiraService {
  if (!_instance) {
    const baseUrl = import.meta.env.VITE_JIRA_BASE_URL;
    const token = import.meta.env.VITE_JIRA_TOKEN;
    if (!baseUrl || !token) {
      throw new Error(
        'Jira no configurado. Definir VITE_JIRA_BASE_URL y VITE_JIRA_TOKEN en .env',
      );
    }
    _instance = new JiraService(baseUrl, token);
  }
  return _instance;
}
