export interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

export interface CommitActivityItem {
  week: string;
  commits: number;
}

export interface Developer {
  id: number;
  github_username: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  total_stars: number;
  total_forks: number;
  languages: Record<string, { bytes: number; percentage: number }>;
  commit_activity: CommitActivityItem[];
  fetched_at: string;
}

export interface Repository {
  id: number;
  developer_id: number;
  github_repo_id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stars: number;
  forks: number;
  open_issues: number;
  primary_language: string | null;
  languages: Record<string, number>;
  pushed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_pinned?: boolean;
  pin_details?: {
    id: number;
    note: string | null;
    tags: string[];
    created_at: string;
  } | null;
}

export interface Comparison {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  developer_ids?: number[];
  developers?: Developer[];
}

export interface Pin {
  id: number;
  user_id: number;
  repo_id: number;
  note: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  repo?: Repository;
  developer?: {
    github_username: string;
    avatar_url: string | null;
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface ComparisonResult {
  developers: Developer[];
  highlights: {
    mostStars: { username: string; value: number };
    mostFollowers: { username: string; value: number };
    mostRepos: { username: string; value: number };
    mostForks: { username: string; value: number };
  };
  languageComparison: {
    allLanguages: string[];
    breakdownByDev: Record<string, Record<string, number>>;
  };
  commitComparison: {
    weeks: string[];
    series: Array<{
      username: string;
      data: number[];
    }>;
  };
}
