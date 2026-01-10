import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
    githubId:{
             type:String,
             required:true,
             unique:true
    },
    username: {
        type: String,
        required: true,
    },
    accessToken: {
        type: String,
        required: true,
    },
    role: { 
        type: String, 
        enum: ['CTO', 'ProjectManager', 'TeamLead'], 
        default: 'TeamLead' 
    },
    teamName: { type: String, default: null },
    selectedOrganization: { 
        type: String,
    },
    email:{
        type:String,
        // required:true,
         
        sparse: true 
    },
    avatar_url: { 
        type: String
     },
   monitoredRepos: {
        type: [String], 
        default: []
    },
    assignedRepos: {
    type: [String],
    default: []
}

})
const userModel = mongoose.model('user',UserSchema)
export default userModel;