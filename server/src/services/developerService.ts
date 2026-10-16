import { db } from '../db/database.js';
import { githubService } from './githubService.js';
import { config } from '../config.js';
import { Developer, Repository, CommitActivityItem } from '../types/index.js';

class DeveloperService {
  /**
   * Look up a developer by GitHub username.
   * Leverages PostgreSQL caching with TTL and forceRefresh option.
   */
  public async getDeveloperProfile(
    username: string,
    userId?: number,
    forceRefresh: boolean = false
  ): Promise<{ developer: Developer; repos: Repository[]; is_cached: boolean }> {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      throw new Error('Username is required.');
    }

    // 1. Check local / PostgreSQL cache
    const existingDevRes = await db.query(
      'SELECT * FROM developers WHERE LOWER(github_username) = LOWER($1)',
      [cleanUsername]
    );

    const existingDev = existingDevRes.rows[0];

    if (existingDev && !forceRefresh) {
      const fetchedTime = new Date(existingDev.fetched_at).getTime();
      const ageMinutes = (Date.now() - fetchedTime) / (1000 * 60);

      if (ageMinutes < config.cacheTtlMinutes) {
        // Cache is fresh! Fetch repos from database
        const reposRes = await db.query(
          'SELECT * FROM repos WHERE developer_id = $1 ORDER BY stars DESC',
          [existingDev.id]
        );

        let repos: Repository[] = reposRes.rows.map(r => ({
          ...r,
          languages: typeof r.languages === 'string' ? JSON.parse(r.languages || '{}') : (r.languages || {}),
        }));

        // Attach pin info if user is authenticated
        if (userId) {
          repos = await this.attachPinDetailsToRepos(repos, userId);
        }

        const dev: Developer = {
          ...existingDev,
          languages: typeof existingDev.languages === 'string' ? JSON.parse(existingDev.languages || '{}') : (existingDev.languages || {}),
          commit_activity: typeof existingDev.commit_activity === 'string' ? JSON.parse(existingDev.commit_activity || '[]') : (existingDev.commit_activity || []),
        };

        return { developer: dev, repos, is_cached: true };
      }
    }

    // 2. Fetch live data from GitHub API
    console.log(`[DeveloperService] Fetching fresh data for '${cleanUsername}' from GitHub API...`);
    const ghUser = await githubService.fetchUserProfile(cleanUsername);
    const ghRepos = await githubService.fetchUserRepos(cleanUsername, 100);

    // Compute metrics
    let totalStars = 0;
    let totalForks = 0;
    const rawLanguageBytes: Record<string, number> = {};

    // For top 3 repos by stars, fetch detailed language breakdown if API rate limit allows
    const sortedRepos = [...ghRepos].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
    const topReposToInspect = sortedRepos.slice(0, 3);

    for (const repo of sortedRepos) {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;

      if (repo.language) {
        // Fallback byte estimation if detailed breakdown not fetched
        rawLanguageBytes[repo.language] = (rawLanguageBytes[repo.language] || 0) + (repo.size ? repo.size * 1024 : 10000);
      }
    }

    // Query detailed language breakdown for top repos
    for (const topRepo of topReposToInspect) {
      try {
        const detailedLangs = await githubService.fetchRepoLanguages(ghUser.login, topRepo.name);
        for (const [lang, bytes] of Object.entries(detailedLangs)) {
          rawLanguageBytes[lang] = (rawLanguageBytes[lang] || 0) + bytes;
        }
      } catch (e) {
        // Non-blocking
      }
    }

    // Compute language percentages
    const totalBytes = Object.values(rawLanguageBytes).reduce((acc, val) => acc + val, 0);
    const languagesBreakdown: Record<string, { bytes: number; percentage: number }> = {};
    if (totalBytes > 0) {
      for (const [lang, bytes] of Object.entries(rawLanguageBytes)) {
        languagesBreakdown[lang] = {
          bytes,
          percentage: Math.round((bytes / totalBytes) * 1000) / 10,
        };
      }
    }

    // Compute Commit Activity
    const commitActivity = await this.calculateCommitActivity(cleanUsername, sortedRepos[0]);

    // 3. Upsert Developer into DB
    let devId: number;
    const devParams = [
      ghUser.login,
      ghUser.name || ghUser.login,
      ghUser.avatar_url,
      ghUser.bio,
      ghUser.company,
      ghUser.location,
      ghUser.blog,
      ghUser.twitter_username,
      ghUser.followers || 0,
      ghUser.following || 0,
      ghUser.public_repos || 0,
      ghUser.public_gists || 0,
      totalStars,
      totalForks,
      JSON.stringify(languagesBreakdown),
      JSON.stringify(commitActivity),
    ];

    if (existingDev) {
      devId = existingDev.id;
      await db.query(
        `UPDATE developers SET
          name = $1, avatar_url = $2, bio = $3, company = $4, location = $5,
          blog = $6, twitter_username = $7, followers = $8, following = $9,
          public_repos = $10, public_gists = $11, total_stars = $12, total_forks = $13,
          languages = $14, commit_activity = $15, fetched_at = CURRENT_TIMESTAMP
        WHERE id = $16`,
        [...devParams.slice(1), devId]
      );
    } else {
      const insertDevRes = await db.query(
        `INSERT INTO developers (
          github_username, name, avatar_url, bio, company, location, blog,
          twitter_username, followers, following, public_repos, public_gists,
          total_stars, total_forks, languages, commit_activity, fetched_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
        RETURNING id`,
        devParams
      );
      devId = insertDevRes.rows[0].id;
    }

    // 4. Update Repositories table
    await db.query('DELETE FROM repos WHERE developer_id = $1', [devId]);

    const savedRepos: Repository[] = [];
    for (const r of sortedRepos) {
      const repoInsertRes = await db.query(
        `INSERT INTO repos (
          developer_id, github_repo_id, name, full_name, description, html_url,
          stars, forks, open_issues, primary_language, languages, pushed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          devId,
          r.id,
          r.name,
          r.full_name,
          r.description,
          r.html_url,
          r.stargazers_count || 0,
          r.forks_count || 0,
          r.open_issues_count || 0,
          r.language || null,
          JSON.stringify({ [r.language || 'Other']: 100 }),
          r.pushed_at,
          r.created_at,
          r.updated_at,
        ]
      );

      if (repoInsertRes.rows[0]) {
        savedRepos.push({
          ...repoInsertRes.rows[0],
          languages: { [r.language || 'Other']: 100 },
        });
      }
    }

    // Attach pin information if user is logged in
    let finalRepos = savedRepos;
    if (userId) {
      finalRepos = await this.attachPinDetailsToRepos(savedRepos, userId);
    }

    const resultDeveloper: Developer = {
      id: devId,
      github_username: ghUser.login,
      name: ghUser.name || ghUser.login,
      avatar_url: ghUser.avatar_url,
      bio: ghUser.bio,
      company: ghUser.company,
      location: ghUser.location,
      blog: ghUser.blog,
      twitter_username: ghUser.twitter_username,
      followers: ghUser.followers || 0,
      following: ghUser.following || 0,
      public_repos: ghUser.public_repos || 0,
      public_gists: ghUser.public_gists || 0,
      total_stars: totalStars,
      total_forks: totalForks,
      languages: languagesBreakdown,
      commit_activity: commitActivity,
      fetched_at: new Date().toISOString(),
    };

    return { developer: resultDeveloper, repos: finalRepos, is_cached: false };
  }

  /**
   * Calculate commit activity over recent weeks from GitHub public events and top repo
   */
  private async calculateCommitActivity(username: string, topRepo?: any): Promise<CommitActivityItem[]> {
    const weeksMap: Record<string, number> = {};

    // Initialize past 8 weeks
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekLabel = `W${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)} (${d.toLocaleString('default', { month: 'short' })})`;
      weeksMap[weekLabel] = 0;
    }
    const weekLabels = Object.keys(weeksMap);

    // 1. Fetch public push events
    const events = await githubService.fetchUserCommitEvents(username);
    for (const ev of events) {
      const evDate = new Date(ev.created_at);
      const diffWeeks = Math.floor((now.getTime() - evDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks >= 0 && diffWeeks < 8) {
        const label = weekLabels[7 - diffWeeks];
        const commitCount = ev.payload?.commits?.length || 1;
        weeksMap[label] = (weeksMap[label] || 0) + commitCount;
      }
    }

    // 2. If events were sparse and we have a top repo, sample top repo commits
    const totalFound = Object.values(weeksMap).reduce((a, b) => a + b, 0);
    if (totalFound < 5 && topRepo) {
      const commits = await githubService.fetchRepoCommits(username, topRepo.name, 20);
      for (const c of commits) {
        const commitDate = new Date(c.commit?.author?.date || c.commit?.committer?.date || now);
        const diffWeeks = Math.floor((now.getTime() - commitDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (diffWeeks >= 0 && diffWeeks < 8) {
          const label = weekLabels[7 - diffWeeks];
          weeksMap[label] = (weeksMap[label] || 0) + 1;
        }
      }
    }

    return weekLabels.map(label => ({
      week: label,
      commits: weeksMap[label] || 0,
    }));
  }

  /**
   * Helper to attach user's pin info (note, tags) to repositories
   */
  private async attachPinDetailsToRepos(repos: Repository[], userId: number): Promise<Repository[]> {
    const pinsRes = await db.query('SELECT * FROM pins WHERE user_id = $1', [userId]);
    const pinMap = new Map<number, any>();
    for (const pin of pinsRes.rows) {
      pinMap.set(pin.repo_id, pin);
    }

    return repos.map(repo => {
      const pin = pinMap.get(repo.id);
      if (pin) {
        return {
          ...repo,
          is_pinned: true,
          pin_details: {
            id: pin.id,
            note: pin.note,
            tags: typeof pin.tags === 'string' ? JSON.parse(pin.tags || '[]') : (pin.tags || []),
            created_at: pin.created_at,
          },
        };
      }
      return {
        ...repo,
        is_pinned: false,
        pin_details: null,
      };
    });
  }

  /**
   * Get list of recently fetched developers
   */
  public async getRecentDevelopers(limit: number = 8): Promise<Developer[]> {
    const res = await db.query(
      'SELECT * FROM developers ORDER BY fetched_at DESC LIMIT $1',
      [limit]
    );

    return res.rows.map(d => ({
      ...d,
      languages: typeof d.languages === 'string' ? JSON.parse(d.languages || '{}') : (d.languages || {}),
      commit_activity: typeof d.commit_activity === 'string' ? JSON.parse(d.commit_activity || '[]') : (d.commit_activity || []),
    }));
  }
}

export const developerService = new DeveloperService();
