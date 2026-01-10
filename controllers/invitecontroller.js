import crypto from 'crypto'
import Invitation from '../models/Invitation.js'
import User from '../models/User.js';
import nodemailer from 'nodemailer';

export const sendInvite = async(req,res)=>{
    try{
      const { email, role, teamName, orgId ,invitedBy,assignedRepos} = req.body;
      console.log('data receive:',{email , role, teamName,orgId , invitedBy,assignedRepos});
    //   const invitedBy = req.user.id;
      const token = crypto.randomBytes(32).toString('hex');
      const newinvite = new Invitation({
            email,
            role,
            teamName:teamName || (role === 'ProjectManager' ? "All Teams" : "General"),
            orgId:orgId || "INTERNAL_ORG_01",
            invitedBy,
            assignedRepos: assignedRepos || [],   
            token
      }) 
      await newinvite.save();
      const transporter = nodemailer.createTransport({
        service:'gmail',
        auth:{
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }

      })
      const inviteLink = `http://localhost:5173/accept-invite?token=${token}`;
      const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: `Invitation to join as ${role}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2>Welcome to the Team! </h2>
                    <p>You have been invited to join the organization as a <b>${role}</b>.</p>
                    ${role === 'TeamLead' ? `<p>Assigned Team: <b>${teamName}</b></p>` : '<p>Scope: <b>Full Organization Access</b></p>'}
                    <p>Click the button below to accept the invitation and connect your GitHub:</p>
                    <a href="${inviteLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accept Invitation</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If the button doesn't work, copy this link: ${inviteLink}</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
        console.log(`Invite link for ${email}: ${inviteLink}`);
        res.status(200).json({ message: "Invitation sent successfully!", inviteLink });
    }
    catch(error)
    {
     console.error("Nodemailer Failed:", error.message); 
    return res.status(500).json({ message: "Email configuration error", details: error.message });
     }
}
export const acceptInvite = async(req, res) => {
    try {
        const { token, username } = req.body;
        
       
        const invite = await Invitation.findOne({ token, status: 'pending' });
        if (!invite) return res.status(400).json({ message: "Invalid or expired token" });

        const newUser = await User.findOneAndUpdate(

            { username: username }, 
            {
                role: invite.role,
                username: username, 
                teamName: invite.teamName,
                assignedRepos: invite.assignedRepos || [], 
                selectedOrganization: invite.orgId,
                status: 'active'
            },
            
            { new: true, upsert: true, runValidators: true } 
        );
        console.log(assignedRepos);

        invite.status = 'accepted';
        await invite.save();

        res.status(200).json(newUser);
    } 
    catch(error) {
        console.error("Accept Invite Error:", error.message);
        res.status(500).json({ message: error.message });
    }
}