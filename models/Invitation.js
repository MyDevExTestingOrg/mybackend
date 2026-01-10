import mongoose from 'mongoose'

const InvitationSchema = new mongoose.Schema({
    email: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['ProjectManager', 'TeamLead'], 
        required: true 
    },
    teamName: { type: String }, 
    orgId: { type: String }, 
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    status: { 
        type: String, 
        enum: ['pending', 'accepted'], 
        default: 'pending' 
    },
    token: { type: String, required: true } ,
    assignedRepos: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('invitation', InvitationSchema);