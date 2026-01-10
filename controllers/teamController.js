import express from 'express';
import User from '../models/User.js'
import Member from '../models/Member.js'
import Invitation from '../models/Invitation.js'

export const getTeamMembers = async(req, res)=>{
     try{
        const {userId} = req.params
        if (!userId || userId === "null") {
            return res.status(400).json({ message: "Valid User ID is required" });
        }
        console.log(userId);
        const allMembers = await User.find({ 
            _id: { $ne: userId }, 
            role: { $in: ['ProjectManager', 'TeamLead'] } 
        });
        res.status(200).json({ members: allMembers || [] });
     }
     catch(error)
     {
      res.status(500).json({ message: error.message });
     }
}
export const inviteMember = async (req, res) => {
    try {
        const { userId } = req.params;
        const { githubUsername, role } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $push: { members: { githubUsername, role, accessibleOrgs: [] } } },
            { new: true }
        );
        res.status(201).json(updatedUser.members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const toggleOrgAccess = async (req, res) => {
    try {
        const { userId } = req.params;
        const { memberId, orgName } = req.body;

        const user = await User.findById(userId);
        const member = user.members.id(memberId);

        const index = member.accessibleOrgs.indexOf(orgName);
        if (index > -1) {
            member.accessibleOrgs.splice(index, 1);
        } else {
            member.accessibleOrgs.push(orgName);
        }

        await user.save();
        res.status(200).json(user.members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const revokeMember = async (req, res) => {
    try {
        const { memberId } = req.params; 

       
        const deletedUser = await User.findByIdAndDelete(memberId);

        if (!deletedUser) {
            return res.status(404).json({ message: "Member not found" });
        }

        res.status(200).json({ message: "Member removed successfully from system" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const teamleadstatus = async (req, res) => {
    try {
        const { managerId } = req.params;

        const teamLeads = await Invitation.find({ 
            invitedBy: managerId, 
            role: 'TeamLead',
            status: 'accepted' // Sirf unhe dikhayein jinhone join kar liya hai
        }).select('email role teamName assignedRepos invitedBy');

        const activityData = await Promise.all(teamLeads.map(async (lead) => {
            const lastPR = await PRAnalytics.findOne({ 
                author: lead.username,
                status: 'merged'
            }).sort({ mergedAt: -1 });

            return {
                _id: lead._id,
                username: lead.username,
                teamName: lead.teamName || 'Engineering',
                assignedRepos: lead.assignedRepos || [],
                lastPushDate: lastPR ? lastPR.mergedAt : null,
                status: lastPR && (new Date() - lastPR.mergedAt < 86400000) ? 'active' : 'inactive'
            };
        }));
        console.log(activityData)

        res.status(200).json(activityData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};