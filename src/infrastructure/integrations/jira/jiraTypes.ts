// ─────────────────────────────────────────────────────────────────────────────
// Jira Types — Tipos para la API de Jira Cloud
//
// Basado en la API REST de Jira: https://developer.atlassian.com/cloud/jira/
// Completar con los campos necesarios para el equipo.
// ─────────────────────────────────────────────────────────────────────────────

export interface JiraIssue {
  id: string;
  key: string;          // Ej: "PLAN-123"
  self: string;         // URL de la issue
  fields: JiraIssueFields;
}

export interface JiraIssueFields {
  summary: string;
  description?: JiraDocument | null;
  status: JiraStatus;
  issuetype: JiraIssueType;
  priority?: JiraPriority;
  assignee?: JiraUser | null;
  reporter?: JiraUser | null;
  labels?: string[];
  created: string;      // ISO 8601
  updated: string;
  duedate?: string | null;
  customfield_10015?: string | null; // Start date (campo personalizado común)
  customfield_10016?: number | null; // Story points
  customfield_10020?: JiraSprint | null; // Sprint (campo personalizado)
}

export interface JiraStatus {
  id: string;
  name: string;        // "To Do" | "In Progress" | "Done" | etc.
  statusCategory: { key: 'new' | 'indeterminate' | 'done' };
}

export interface JiraIssueType {
  id: string;
  name: string;        // "Story" | "Task" | "Bug" | "Epic" | etc.
  subtask: boolean;
}

export interface JiraPriority {
  id: string;
  name: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'future' | 'closed';
  startDate?: string;
  endDate?: string;
}

export interface JiraDocument {
  type: 'doc';
  content?: unknown[];
}

export interface JiraSearchResult {
  total: number;
  maxResults: number;
  startAt: number;
  issues: JiraIssue[];
}

// Parámetros para búsqueda JQL
export interface JiraSearchParams {
  jql: string;
  maxResults?: number;
  startAt?: number;
  fields?: string[];
}
