import axios from 'axios'
import User from '../models/User.js'

export const gitController = async (req,res)=>{
    const {userId} = req.params;
    try{
      const user = await User.findById(userId)
      if(!user || !user.accessToken)
      {
        return res.status(404).json({ message: "User or token not found" });
      }
      const response = await axios.get('https://api.github.com/user/repos?type=all&per_page=100&sort=updated', {
            headers: {
                Authorization: `token ${user.accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });
        console.log(response.data);
        const orgs = response.data.filter(org => org.state === 'active').map(org => ({
            id: org.organization.id,
            login: org.organization.login,
            avatar_url: org.organization.avatar_url,
            role: org.role,
            visibility: org.visibility,
        }));
        const repos = response.data.map(repo => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            private: repo.private, 
            owner: repo.owner.login
        }));

        res.json({ orgs, repos });
    }
   catch (err) {
        console.error("Error fetching GitHub data:", err.message);
        res.status(500).json({ message: "Failed to fetch GitHub data" });
    }
}
export const getMonitorRepos = async(req,res)=>{
    try{
        const {userId} = req.params;
        const user  =  await User.findById(userId).select('+monitoredRepos')
        if(!user) res.status(404).json({message:"user not found"});
        res.status(200).json(user.monitoredRepos);
    }
    catch(error){
        res.status(500).json({message:"error fetching",error:error.message});
    }
}
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
export const unlink = async(req,res)=>{
    try{
        const {userId} = req.params;
        const user = await User.findByIdAndUpdate(userId);
        if(!user)return res.status(404).json({message:"user not found"});
        res.status(200).json({message:" git hub unlink successfully"});
    }catch(error)
    {
      res.status(500).json({message:"Server Error",error:error.message});
    }
}