import mongoose from 'mongoose';

const PRAnalyticsSchema = new mongoose.Schema({
    prId: { type: String, required: true, unique: true }, 
    prNumber: { type: Number },
    title: { type: String },
    repoFullName: { type: String, required: true }, 
    author: { type: String },
    status: { type: String, enum: ['opened', 'merged', 'closed'], default: 'opened' },
    
    createdAt: { type: Date, required: true },
    firstCommentAt: { type: Date }, 
    mergedAt: { type: Date },       
    closedAt: { type: Date },

    // Metrics jo hum calculate karke store karenge
    pickupTimeMinutes: { type: Number }, 
    cycleTimeMinutes: { type: Number },  
    prSize: { type: Number },            
}, { timestamps: true });

const PRAnalytics = mongoose.model('PRAnalytics', PRAnalyticsSchema);
export default PRAnalytics;