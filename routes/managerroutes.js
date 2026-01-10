import express from 'express'
import { getManagerScopedMetrics } from '../controllers/analyticsController.js'
import { teamleadstatus } from '../controllers/teamController.js';

const router = express.Router();

router.get( '/manager-analytics/:userId' , getManagerScopedMetrics )
router.get('/invitations/:managerId', teamleadstatus );

export default router;
