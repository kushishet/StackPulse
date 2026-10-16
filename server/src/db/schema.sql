-- StackPulse PostgreSQL Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Developers table
CREATE TABLE IF NOT EXISTS developers (
    id SERIAL PRIMARY KEY,
    github_username VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    company VARCHAR(255),
    location VARCHAR(255),
    blog VARCHAR(255),
    twitter_username VARCHAR(255),
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    public_repos INTEGER DEFAULT 0,
    public_gists INTEGER DEFAULT 0,
    total_stars INTEGER DEFAULT 0,
    total_forks INTEGER DEFAULT 0,
    languages TEXT DEFAULT '{}',
    commit_activity TEXT DEFAULT '[]',
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Repositories table
CREATE TABLE IF NOT EXISTS repos (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
    github_repo_id BIGINT,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    html_url TEXT NOT NULL,
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    open_issues INTEGER DEFAULT 0,
    primary_language VARCHAR(100),
    languages TEXT DEFAULT '{}',
    pushed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Saved Comparisons table (User-private)
CREATE TABLE IF NOT EXISTS comparisons (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comparison Developers junction table
CREATE TABLE IF NOT EXISTS comparison_devs (
    id SERIAL PRIMARY KEY,
    comparison_id INTEGER REFERENCES comparisons(id) ON DELETE CASCADE,
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    CONSTRAINT unique_comparison_developer UNIQUE (comparison_id, developer_id)
);

-- Pins and Notes table (User-private)
CREATE TABLE IF NOT EXISTS pins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    repo_id INTEGER REFERENCES repos(id) ON DELETE CASCADE,
    note TEXT,
    tags TEXT DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_repo_pin UNIQUE (user_id, repo_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_developers_username ON developers (LOWER(github_username));
CREATE INDEX IF NOT EXISTS idx_repos_developer_id ON repos (developer_id);
CREATE INDEX IF NOT EXISTS idx_repos_stars ON repos (stars DESC);
CREATE INDEX IF NOT EXISTS idx_comparisons_user_id ON comparisons (user_id);
CREATE INDEX IF NOT EXISTS idx_pins_user_id ON pins (user_id);
CREATE INDEX IF NOT EXISTS idx_pins_repo_id ON pins (repo_id);
