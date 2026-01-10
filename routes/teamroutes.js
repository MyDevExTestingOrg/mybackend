import express from 'express'
import {getTeamMembers,toggleOrgAccess,revokeMember,inviteMember} from '../controllers/teamController.js'


const router = express.Router();

router.get('/:userId',getTeamMembers);
router.post('/invite/:userId',inviteMember);
router.put('/access/:userId',toggleOrgAccess)
router.delete('/:memberId',revokeMember);

export default router;