import express from 'express'
import {githubLogin , githubCallback,getUser,getManagers} from '../controllers/authController.js'
import {gitController,getMonitorRepos,deleteUser,unlink} from '../controllers/gitController.js'
import { setupRepos } from '../controllers/authController.js';
import {sendInvite} from '../controllers/invitecontroller.js'

const router = express.Router();

router.get('/github/login', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/users/github/:userId',getUser);
router.get('/user/orgs/:userId',gitController);
router.post('/setup-repos',setupRepos);
router.get('/monitoredRepos/:userId',getMonitorRepos);
router.delete('/delete/:userId',deleteUser);
router.put('/unlink/:userId',unlink);
router.post('/invite',sendInvite)
router.get('/users/role/ProjectManager', getManagers);

export default router;