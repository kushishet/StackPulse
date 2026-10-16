import { db } from '../db/database.js';
import { Pin } from '../types/index.js';

class PinService {
  /**
   * Pin a repository with optional note and tags for a user
   */
  public async pinRepository(
    userId: number,
    repoId: number,
    note?: string,
    tags: string[] = []
  ): Promise<Pin> {
    // Check if repo exists
    const repoCheck = await db.query('SELECT * FROM repos WHERE id = $1', [repoId]);
    if (repoCheck.rows.length === 0) {
      throw new Error(`Repository with ID ${repoId} does not exist.`);
    }

    // Check if already pinned by this user
    const existing = await db.query(
      'SELECT * FROM pins WHERE user_id = $1 AND repo_id = $2',
      [userId, repoId]
    );

    const formattedTags = Array.isArray(tags) ? tags.map(t => t.trim().toLowerCase().replace(/^#/, '')) : [];

    if (existing.rows.length > 0) {
      // Update existing pin
      const updateRes = await db.query(
        `UPDATE pins SET note = $1, tags = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [note?.trim() || null, JSON.stringify(formattedTags), existing.rows[0].id, userId]
      );
      return this.enrichPin(updateRes.rows[0]);
    }

    // Create new pin
    const insertRes = await db.query(
      `INSERT INTO pins (user_id, repo_id, note, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, repoId, note?.trim() || null, JSON.stringify(formattedTags)]
    );

    return this.enrichPin(insertRes.rows[0]);
  }

  /**
   * Get all pinned repositories for a user with optional tag filter
   */
  public async getUserPins(userId: number, tagFilter?: string): Promise<Pin[]> {
    const pinsRes = await db.query(
      'SELECT * FROM pins WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );

    const enrichedPins: Pin[] = [];
    for (const p of pinsRes.rows) {
      const pin = await this.enrichPin(p);
      if (tagFilter) {
        const cleanTag = tagFilter.trim().toLowerCase().replace(/^#/, '');
        if (!pin.tags.includes(cleanTag)) {
          continue;
        }
      }
      enrichedPins.push(pin);
    }

    return enrichedPins;
  }

  /**
   * Update note and tags for a pin
   */
  public async updatePin(
    pinId: number,
    userId: number,
    note?: string,
    tags?: string[]
  ): Promise<Pin> {
    const check = await db.query(
      'SELECT * FROM pins WHERE id = $1 AND user_id = $2',
      [pinId, userId]
    );

    if (check.rows.length === 0) {
      throw new Error('Pin not found or unauthorized.');
    }

    const currentTags = typeof check.rows[0].tags === 'string' ? JSON.parse(check.rows[0].tags || '[]') : (check.rows[0].tags || []);
    const newTags = tags !== undefined
      ? tags.map(t => t.trim().toLowerCase().replace(/^#/, ''))
      : currentTags;

    const res = await db.query(
      `UPDATE pins SET note = $1, tags = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [note !== undefined ? note.trim() : check.rows[0].note, JSON.stringify(newTags), pinId, userId]
    );

    return this.enrichPin(res.rows[0]);
  }

  /**
   * Unpin a repository by pin ID
   */
  public async deletePin(pinId: number, userId: number): Promise<boolean> {
    const res = await db.query(
      'DELETE FROM pins WHERE id = $1 AND user_id = $2',
      [pinId, userId]
    );
    return res.rowCount > 0;
  }

  /**
   * Unpin by repo ID
   */
  public async deletePinByRepoId(repoId: number, userId: number): Promise<boolean> {
    const res = await db.query(
      'DELETE FROM pins WHERE repo_id = $1 AND user_id = $2',
      [repoId, userId]
    );
    return res.rowCount > 0;
  }

  /**
   * Enrich pin with repo details and developer username/avatar
   */
  private async enrichPin(pinRow: any): Promise<Pin> {
    const tags = typeof pinRow.tags === 'string' ? JSON.parse(pinRow.tags || '[]') : (pinRow.tags || []);
    const repoRes = await db.query('SELECT * FROM repos WHERE id = $1', [pinRow.repo_id]);
    const repo = repoRes.rows[0] ? {
      ...repoRes.rows[0],
      languages: typeof repoRes.rows[0].languages === 'string' ? JSON.parse(repoRes.rows[0].languages || '{}') : (repoRes.rows[0].languages || {}),
    } : undefined;

    let developer = undefined;
    if (repo) {
      const devRes = await db.query('SELECT github_username, avatar_url FROM developers WHERE id = $1', [repo.developer_id]);
      if (devRes.rows[0]) {
        developer = devRes.rows[0];
      }
    }

    return {
      id: pinRow.id,
      user_id: pinRow.user_id,
      repo_id: pinRow.repo_id,
      note: pinRow.note,
      tags,
      created_at: pinRow.created_at,
      updated_at: pinRow.updated_at,
      repo,
      developer,
    };
  }
}

export const pinService = new PinService();
