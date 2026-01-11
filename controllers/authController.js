import axios from 'axios';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import jwt from 'jsonwebtoken'
export const githubLogin = (req,res)=>
{
   const scopes = 'read:user user:email admin:org read:org repo';
   const inviteToken = req.query.token || "";
   const githubAuthUrl = 
  `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}` +
  `&redirect_uri=${process.env.GITHUB_CALLBACK_URL}` +
  `&scope=${scopes}&state=${inviteToken}`;   res.redirect(githubAuthUrl);
}
export const githubCallback = async (req, res) => {
    const code = req.query.code;
    const inviteToken = req.query.state; 

    if (!code) return res.status(400).send("Authentication code not found");

    try {
        const tokenExchangeResponse = await axios.post("https://github.com/login/oauth/access_token", {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code,
        }, { headers: { accept: 'application/json' } });

        const accessToken = tokenExchangeResponse.data.access_token;
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${accessToken}` },
        });
        const { id: githubId, login: username } = userResponse.data;

        let user = await User.findOne({ githubId:githubId.toString() });
        const userCount = await User.countDocuments();

        let finalRole = (userCount === 0) ? "CTO" : "TeamLead"; 
        let finalTeam = "";
        let finalOrg = "";
        let reposToAssign = [];

        if (inviteToken && inviteToken !== "" && inviteToken !=="undefined") {
            const invite = await Invitation.findOne({ token: inviteToken, status: 'pending' });
            if (invite) {
                finalRole = invite.role; 
                finalTeam = invite.teamName;
                finalOrg = invite.orgId;
                reposToAssign = invite.assignedRepos || [];
                
                invite.status = 'accepted';
                await invite.save();
                console.log(`Invitation Found! Assigning Role: ${finalRole}`);
            }
        } 
        else if (userCount === 0) {
            finalRole = "CTO";
            console.log("First User Detected: Assigning CTO");
        }

        if (!user) {
            user = new User({
                githubId:githubId.toString(),
                username: username,
                accessToken: accessToken,
                role: finalRole,
                teamName: finalTeam,
                selectedOrganization: finalOrg,
                monitoredRepos: reposToAssign,
                assignedRepos: reposToAssign
            });
        } else {
            user.accessToken = accessToken;
            if (inviteToken && inviteToken !== "undefined") {
                user.role = finalRole;
                user.teamName = finalTeam;
                user.selectedOrganization = finalOrg;
                user.monitoredRepos = reposToAssign;
                user.assignedRepos = reposToAssign;
            }
        }

        await user.save();
        console.log(` User Saved in DB: ${user.username} as ${user.role}`); 

      
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_secret', { expiresIn: '7d' });
        const isSetupDone = user.monitoredRepos && user.monitoredRepos.length > 0;
        const shouldSkipOnboarding = (user.role === 'ProjectManager' || user.role === 'TeamLead');

        const frontendRedirectUrl = `${process.env.FRONTEND_URL}/auth-success?token=${token}&userId=${user._id}&setupDone=${isSetupDone || shouldSkipOnboarding}&role=${user.role}`;
        res.redirect(frontendRedirectUrl);

    } catch (error) {
        console.error('Callback Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
};
export const getUser = async(req,res)=>{
    try{
   const {userId} = req.params;
   const user = await User.findById(userId)

   if(!user)
   {
     res.status(404).json({message:"user not found"})
   }
         const userData = user.toObject();
         userData.avatar_url = `https://github.com/${user.username}.png`;
         res.status(200).json(userData);
}catch(err)
{
    res.status(500).json({message:"Server error",err:err.message})
    console.log("user not found",err.message);
}
}
export const setupRepos = async(req,res)=>{
    try{
         const {userId, monitoredRepos}= req.body;
         const user = await User.findByIdAndUpdate(
            userId,
            { monitoredRepos: monitoredRepos }, 
            { new: true }
        );
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "Setup completed successfully", user });
    }catch(err){
       res.status(500).json({ message: "Error saving setup", error: error.message });
    }

}
export const getManagers = async (req, res) => {
    try {
        const managers = await User.find({ role: 'ProjectManager' }, 'username _id assignedRepos monitoredRepos');
        
        const formattedManagers = managers.map(m => ({
            _id: m._id,
            username: m.username,
            assignedRepos: m.assignedRepos && m.assignedRepos.length > 0 ? m.assignedRepos : m.monitoredRepos
        }));

        res.status(200).json(formattedManagers);
    } catch (error) {
        console.error("Error fetching managers:", error.message);
        res.status(500).json({ message: "Server error while fetching managers" });
    }
};