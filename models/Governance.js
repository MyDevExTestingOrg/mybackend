import mongoose from 'mongoose'
const governanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slaHours: { type: Number, default: 48 }, 
    deliveryGoalDays: { type: Number, default: 3 }, 
    updatedAt: { type: Date, default: Date.now }
})

export default mongoose.model('Governance', governanceSchema);