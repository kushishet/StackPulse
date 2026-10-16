import { Router, Response } from 'express';
import { developerService } from '../services/developerService.js';
import { githubService } from '../services/githubService.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db/database.js';

const router = Router();

// Rate limit status endpoint
router.get('/rate-limit', (req, res) => {
  const info = githubService.getRateLimitInfo();
  res.json({
    rateLimit: info,
    isPostgres: db.isPostgres(),
  });
});

// Recent lookups
router.get('/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string || '8', 10);
    const recent = await developerService.getRecentDevelopers(limit);
    res.json({ developers: recent });
  } catch (err) {
    next(err);
  }
});

// Search developers (from cached DB + prefix match)
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string || '').trim().toLowerCase();
    if (!q) {
      res.json({ results: [] });
      return;
    }

    const resDb = await db.query(
      'SELECT id, github_username, name, avatar_url, followers, total_stars FROM developers WHERE LOWER(github_username) LIKE $1 LIMIT 5',
      [`%${q}%`]
    );

    res.json({ results: resDb.rows });
  } catch (err) {
    next(err);
  }
});

// Get developer profile and repositories (optionally authenticated to get pin status)
router.get('/:username', optionalAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const username = String(req.params.username);
    const force = req.query.force === 'true';
    const userId = req.user?.userId;

    const result = await developerService.getDeveloperProfile(username, userId, force);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Force refresh developer from live GitHub API
router.post('/:username/refresh', optionalAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const username = String(req.params.username);
    const userId = req.user?.userId;

    const result = await developerService.getDeveloperProfile(username, userId, true);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
