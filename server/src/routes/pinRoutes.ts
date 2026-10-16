import { Router, Response } from 'express';
import { pinService } from '../services/pinService.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// All pin routes require authentication to ensure user privacy
router.use(requireAuth);

// Get all pinned repositories for the logged in user (with optional tag filter)
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tagFilter = req.query.tag as string | undefined;
    const pins = await pinService.getUserPins(req.user!.userId, tagFilter);
    res.json({ pins });
  } catch (err) {
    next(err);
  }
});

// Pin a repository with optional note and tags
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { repoId, note, tags } = req.body;
    if (!repoId) {
      res.status(400).json({ error: true, message: 'repoId is required.' });
      return;
    }

    const pin = await pinService.pinRepository(
      req.user!.userId,
      Number(repoId),
      note,
      Array.isArray(tags) ? tags : []
    );

    res.status(201).json({ pin });
  } catch (err) {
    next(err);
  }
});

// Update pin note and tags
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const pinId = parseInt(String(req.params.id), 10);
    const { note, tags } = req.body;

    const pin = await pinService.updatePin(
      pinId,
      req.user!.userId,
      note,
      Array.isArray(tags) ? tags : undefined
    );

    res.json({ pin });
  } catch (err) {
    next(err);
  }
});

// Delete a pin by ID
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const pinId = parseInt(String(req.params.id), 10);
    const deleted = await pinService.deletePin(pinId, req.user!.userId);

    if (!deleted) {
      res.status(404).json({ error: true, message: 'Pin not found.' });
      return;
    }

    res.json({ success: true, message: 'Repository unpinned successfully.' });
  } catch (err) {
    next(err);
  }
});

// Unpin directly by repoId
router.delete('/repo/:repoId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const repoId = parseInt(String(req.params.repoId), 10);
    const deleted = await pinService.deletePinByRepoId(repoId, req.user!.userId);

    res.json({ success: true, deleted, message: 'Repository unpinned.' });
  } catch (err) {
    next(err);
  }
});

export default router;
