import express from 'express'
import {handleGithubWebhook} from '../controllers/webhookController.js'
import {getCTOMetrics,getTrendMetrics} from '../controllers/analyticsController.js'

const router = express.Router();

router.post('/github', handleGithubWebhook);
router.get('/metrics/:userId', getCTOMetrics);
router.get('/trends/:userId', getTrendMetrics);

export default router;