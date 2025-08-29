// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Poll Types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  pollId: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  creatorId: string;
  creator: User;
  isPublic: boolean;
  allowMultipleVotes: boolean;
  allowAddOptions: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  totalVotes: number;
  hasVoted?: boolean;
  userVotes?: string[]; // Option IDs that the current user voted for
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  isPublic?: boolean;
  allowMultipleVotes?: boolean;
  allowAddOptions?: boolean;
  expiresAt?: Date;
}

export interface Vote {
  id: string;
  userId: string;
  pollId: string;
  optionId: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// UI State Types
export interface PollFilters {
  search?: string;
  category?: string;
  isPublic?: boolean;
  createdBy?: 'me' | 'others' | 'all';
  sortBy?: 'created' | 'votes' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalPolls: number;
  totalVotes: number;
  pollsCreated: number;
  pollsVoted: number;
}

// Form Types
export interface PollFormData {
  title: string;
  description: string;
  options: string[];
  isPublic: boolean;
  allowMultipleVotes: boolean;
  allowAddOptions: boolean;
  expiresAt?: string;
}

export interface UserProfileFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface SidebarItem extends NavItem {
  isActive?: boolean;
  badge?: string | number;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Poll Status
export type PollStatus = 'active' | 'expired' | 'draft';

// Vote Status
export type VoteStatus = 'not_voted' | 'voted' | 'multiple_voted';
