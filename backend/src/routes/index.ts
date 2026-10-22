import { Router } from 'express';
import * as contentCtrl from '../controllers/content.controller';
import * as leadCtrl from '../controllers/lead.controller';
import * as quizCtrl from '../controllers/quiz.controller';
import { requireAdmin } from '../middlewares/require-admin';
import { hasDatabase } from '../config/env';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, database: hasDatabase ? 'configured' : 'static-content', time: new Date().toISOString() });
});

// ── Public content ──
router.get('/content', contentCtrl.getSiteContent);
router.get('/laws', contentCtrl.getLaws);
router.get('/courses', contentCtrl.getCourses);
router.get('/tiers', contentCtrl.getTiers);
router.get('/sectors', contentCtrl.getSectors);
router.get('/media', contentCtrl.getMedia); // ?group=M1|M2|M3
router.get('/events', contentCtrl.getEvents); // ?status=up|web|past
router.get('/elearning', contentCtrl.getElearning);

// ── Public writes ──
router.post('/leads', leadCtrl.createLead);
router.post('/quiz-attempts', quizCtrl.createAttempt);

// ── Admin ──
router.get('/leads', requireAdmin, leadCtrl.listLeads);
router.patch('/leads/:id', requireAdmin, leadCtrl.updateLead);
