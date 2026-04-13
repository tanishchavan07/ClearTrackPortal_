export type UserRole = 'client' | 'team' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface Project {
  id: string
  name: string
  description: string
  client_id: string
  status: 'planning' | 'active' | 'completed' | 'on-hold'
  progress: number
  health: 'green' | 'yellow' | 'red'
  created_at: string
}

export interface Milestone {
  id: string
  project_id: string
  title: string
  due_date: string
  status: 'todo' | 'in-progress' | 'done'
  created_at: string
}

export interface Task {
  id: string
  milestone_id: string
  title: string
  status: 'todo' | 'in-progress' | 'review' | 'done'
  estimated_hours?: number
  description: string
  assigned_to?: string
  created_at: string
}

export interface ActivityItem {
  id: string
  project_id: string
  user_id: string
  action: string
  message: string
  created_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  url: string
  folder: 'Requirements' | 'Designs' | 'Deliverables' | 'Invoices'
  uploaded_by: string
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  message: string
  is_internal: boolean
  created_at: string
}
