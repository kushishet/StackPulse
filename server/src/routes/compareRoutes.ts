import { Router, Response } from 'express';
import { comparisonService } from '../services/comparisonService.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// On-the-fly multi-developer comparison (Public/Open)
router.post('/', async (req, res, next) => {
  try {
    const { usernames } = req.body;
    if (!Array.isArray(usernames) || usernames.length === 0) {
      res.status(400).json({ error: true, message: 'Array of usernames is required.' });
      return;
    }
    const result = await comparisonService.compareDevelopers(usernames);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// List saved comparisons for logged-in user
router.get('/saved', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const comparisons = await comparisonService.getUserComparisons(req.user!.userId);
    res.json({ comparisons });
  } catch (err) {
    next(err);
  }
});

// Save a named comparison
router.post('/saved', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { name, usernames, description } = req.body;
    const comparison = await comparisonService.saveComparison(
      req.user!.userId,
      name,
      usernames,
      description
    );
    res.status(201).json({ comparison });
  } catch (err) {
    next(err);
  }
});

// Get a single saved comparison
router.get('/saved/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const comparison = await comparisonService.getComparisonById(id, req.user!.userId);
    res.json({ comparison });
  } catch (err) {
    next(err);
  }
});

// Update a saved comparison
router.put('/saved/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { name, usernames, description } = req.body;
    const comparison = await comparisonService.updateComparison(
      id,
      req.user!.userId,
      name,
      usernames,
      description
    );
    res.json({ comparison });
  } catch (err) {
    next(err);
  }
});

// Delete a saved comparison
router.delete('/saved/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const deleted = await comparisonService.deleteComparison(id, req.user!.userId);
    if (!deleted) {
      res.status(404).json({ error: true, message: 'Comparison not found.' });
      return;
    }
    res.json({ success: true, message: 'Comparison deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
