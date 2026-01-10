import mongoose from 'mongoose'

const MemberSchema = new mongoose.Schema({
    githubUsername: String,
    role: { type: String, enum: ['Manager', 'Team Lead'] },
    accessibleOrgs: [String] 
})
export default mongoose.model('Member',MemberSchema);