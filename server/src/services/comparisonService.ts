import { db } from '../db/database.js';
import { developerService } from './developerService.js';
import { Comparison, Developer } from '../types/index.js';

export interface ComparisonMetricsResult {
  developers: Developer[];
  highlights: {
    mostStars: { username: string; value: number };
    mostFollowers: { username: string; value: number };
    mostRepos: { username: string; value: number };
    mostForks: { username: string; value: number };
  };
  languageComparison: {
    allLanguages: string[];
    breakdownByDev: Record<string, Record<string, number>>; // username -> { lang -> percentage }
  };
  commitComparison: {
    weeks: string[];
    series: Array<{
      username: string;
      data: number[];
    }>;
  };
}

class ComparisonService {
  /**
   * Compare multiple developers on-the-fly given an array of usernames
   */
  public async compareDevelopers(usernames: string[]): Promise<ComparisonMetricsResult> {
    if (!usernames || usernames.length === 0) {
      throw new Error('At least one developer username must be provided.');
    }

    const uniqueUsernames = Array.from(new Set(usernames.map(u => u.trim()).filter(Boolean)));
    const developers: Developer[] = [];

    for (const username of uniqueUsernames) {
      try {
        const { developer } = await developerService.getDeveloperProfile(username, undefined, false);
        developers.push(developer);
      } catch (err: any) {
        console.warn(`[ComparisonService] Failed to load developer '${username}':`, err.message);
      }
    }

    if (developers.length === 0) {
      throw new Error('None of the requested developer profiles could be retrieved.');
    }

    // 1. Calculate highlights (leaders in each metric)
    const mostStars = developers.reduce((max, d) => (d.total_stars > max.value ? { username: d.github_username, value: d.total_stars } : max), { username: '', value: -1 });
    const mostFollowers = developers.reduce((max, d) => (d.followers > max.value ? { username: d.github_username, value: d.followers } : max), { username: '', value: -1 });
    const mostRepos = developers.reduce((max, d) => (d.public_repos > max.value ? { username: d.github_username, value: d.public_repos } : max), { username: '', value: -1 });
    const mostForks = developers.reduce((max, d) => (d.total_forks > max.value ? { username: d.github_username, value: d.total_forks } : max), { username: '', value: -1 });

    // 2. Aggregate Language Comparison
    const allLangsSet = new Set<string>();
    const breakdownByDev: Record<string, Record<string, number>> = {};

    for (const dev of developers) {
      breakdownByDev[dev.github_username] = {};
      const langs = dev.languages || {};
      for (const [lang, info] of Object.entries(langs)) {
        allLangsSet.add(lang);
        breakdownByDev[dev.github_username][lang] = info.percentage;
      }
    }

    // Sort languages by overall popularity across compared developers
    const allLanguages = Array.from(allLangsSet).sort((a, b) => {
      const sumA = developers.reduce((sum, d) => sum + (d.languages?.[a]?.percentage || 0), 0);
      const sumB = developers.reduce((sum, d) => sum + (d.languages?.[b]?.percentage || 0), 0);
      return sumB - sumA;
    }).slice(0, 8); // Top 8 distinct languages

    // 3. Commit Comparison Series
    const weekLabelsSet = new Set<string>();
    developers.forEach(d => {
      d.commit_activity?.forEach(item => weekLabelsSet.add(item.week));
    });
    const weeks = Array.from(weekLabelsSet);

    const series = developers.map(d => {
      const devCommitMap = new Map((d.commit_activity || []).map(item => [item.week, item.commits]));
      return {
        username: d.github_username,
        data: weeks.map(w => devCommitMap.get(w) || 0),
      };
    });

    return {
      developers,
      highlights: { mostStars, mostFollowers, mostRepos, mostForks },
      languageComparison: { allLanguages, breakdownByDev },
      commitComparison: { weeks, series },
    };
  }

  /**
   * Save a comparison for a logged-in user
   */
  public async saveComparison(
    userId: number,
    name: string,
    usernames: string[],
    description?: string
  ): Promise<Comparison> {
    if (!name || !name.trim()) {
      throw new Error('Comparison name is required.');
    }
    if (!usernames || usernames.length === 0) {
      throw new Error('At least one developer is required in a comparison.');
    }

    // Resolve or fetch developers to get their IDs
    const devIds: number[] = [];
    for (const uname of usernames) {
      const { developer } = await developerService.getDeveloperProfile(uname, userId, false);
      devIds.push(developer.id);
    }

    // Create comparison record
    const compRes = await db.query(
      `INSERT INTO comparisons (user_id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, name.trim(), description || null]
    );

    const comparison = compRes.rows[0];

    // Insert comparison_devs
    for (let i = 0; i < devIds.length; i++) {
      await db.query(
        `INSERT INTO comparison_devs (comparison_id, developer_id, display_order)
         VALUES ($1, $2, $3)`,
        [comparison.id, devIds[i], i]
      );
    }

    return this.getComparisonById(comparison.id, userId);
  }

  /**
   * Retrieve all saved comparisons for a user
   */
  public async getUserComparisons(userId: number): Promise<Comparison[]> {
    const compRes = await db.query(
      'SELECT * FROM comparisons WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );

    const comparisons: Comparison[] = [];
    for (const comp of compRes.rows) {
      // Fetch associated developers
      const devsRes = await db.query(
        `SELECT d.* FROM comparison_devs cd
         JOIN developers d ON cd.developer_id = d.id
         WHERE cd.comparison_id = $1
         ORDER BY cd.display_order ASC`,
        [comp.id]
      );

      const devs: Developer[] = devsRes.rows.map(d => ({
        ...d,
        languages: typeof d.languages === 'string' ? JSON.parse(d.languages || '{}') : (d.languages || {}),
        commit_activity: typeof d.commit_activity === 'string' ? JSON.parse(d.commit_activity || '[]') : (d.commit_activity || []),
      }));

      comparisons.push({
        ...comp,
        developer_ids: devs.map(d => d.id),
        developers: devs,
      });
    }

    return comparisons;
  }

  /**
   * Get single saved comparison with full details and metrics
   */
  public async getComparisonById(comparisonId: number, userId: number): Promise<Comparison> {
    const compRes = await db.query(
      'SELECT * FROM comparisons WHERE id = $1 AND user_id = $2',
      [comparisonId, userId]
    );

    if (compRes.rows.length === 0) {
      throw new Error('Comparison not found or unauthorized.');
    }

    const comp = compRes.rows[0];
    const devsRes = await db.query(
      `SELECT d.* FROM comparison_devs cd
       JOIN developers d ON cd.developer_id = d.id
       WHERE cd.comparison_id = $1
       ORDER BY cd.display_order ASC`,
      [comp.id]
    );

    const devs: Developer[] = devsRes.rows.map(d => ({
      ...d,
      languages: typeof d.languages === 'string' ? JSON.parse(d.languages || '{}') : (d.languages || {}),
      commit_activity: typeof d.commit_activity === 'string' ? JSON.parse(d.commit_activity || '[]') : (d.commit_activity || []),
    }));

    return {
      ...comp,
      developer_ids: devs.map(d => d.id),
      developers: devs,
    };
  }

  /**
   * Update saved comparison name or developers
   */
  public async updateComparison(
    comparisonId: number,
    userId: number,
    name: string,
    usernames?: string[],
    description?: string
  ): Promise<Comparison> {
    const compRes = await db.query(
      'SELECT * FROM comparisons WHERE id = $1 AND user_id = $2',
      [comparisonId, userId]
    );

    if (compRes.rows.length === 0) {
      throw new Error('Comparison not found or unauthorized.');
    }

    await db.query(
      `UPDATE comparisons SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4`,
      [name.trim(), description || null, comparisonId, userId]
    );

    if (usernames && usernames.length > 0) {
      // Re-link developers
      await db.query('DELETE FROM comparison_devs WHERE comparison_id = $1', [comparisonId]);
      for (let i = 0; i < usernames.length; i++) {
        const { developer } = await developerService.getDeveloperProfile(usernames[i], userId, false);
        await db.query(
          `INSERT INTO comparison_devs (comparison_id, developer_id, display_order)
           VALUES ($1, $2, $3)`,
          [comparisonId, developer.id, i]
        );
      }
    }

    return this.getComparisonById(comparisonId, userId);
  }

  /**
   * Delete saved comparison
   */
  public async deleteComparison(comparisonId: number, userId: number): Promise<boolean> {
    const res = await db.query(
      'DELETE FROM comparisons WHERE id = $1 AND user_id = $2',
      [comparisonId, userId]
    );
    return res.rowCount > 0;
  }
}

export const comparisonService = new ComparisonService();
