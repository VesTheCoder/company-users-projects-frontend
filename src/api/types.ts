export type Role = 'owner' | 'admin' | 'viewer'
export type EmploymentStatus = 'active' | 'leave' | 'terminated'
export type ProjectStatus = 'planned' | 'active' | 'completed' | 'cancelled'
export interface User { id: string; login: string; display_name: string; expires_at: string }
export interface LoginResponse { user: Omit<User, 'expires_at'>; expires_at: string; csrf_token: string }
export interface Page<T> { items: T[]; next_cursor: string | null }
export interface Versioned { id: string; version: number; created_at: string; updated_at: string }
export interface CompanyInput { name: string; description: string | null; website: string | null }
export interface Company extends Versioned, CompanyInput { current_role: Role }
export interface EmployeeInput {
  full_name: string; work_email: string | null; work_phone: string | null; job_title: string | null
  status: EmploymentStatus; start_date: string; end_date: string | null
}
export interface Employee extends Versioned, EmployeeInput { company_id: string }
export interface ProjectInput { name: string; description: string | null; status: ProjectStatus; start_date: string | null; end_date: string | null }
export interface Project extends Versioned, ProjectInput { company_id: string }
export interface Access { user_id: string; login: string; display_name: string; role: Role; created_at: string; updated_at: string }
export interface Assignment {
  employee: Pick<Employee, 'id' | 'full_name' | 'job_title' | 'status'>
  assigned_at: string; assigned_by_user_id: string
}
export interface Snapshot<T> { data: T; etag: string | null }
