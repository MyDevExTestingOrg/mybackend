import User from '../models/User.js'
import PRAnalytics from '../models/PRAnalytics.js'

export const getTrendMetrics = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
       
        if (!user) return res.status(404).json({ message: "User not found" });

        const reposToTrack = user.monitoredRepos || [];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trends = await PRAnalytics.aggregate([
            { 
                $match: { 
                    repoFullName: { $in: reposToTrack },
                    status: 'merged',
                    mergedAt: { $gte: thirtyDaysAgo }
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$mergedAt" } }, 
                    dailyAvgCycleTime: { $avg: "$cycleTimeMinutes" },
                    dailyAvgPrSize: { $avg: "$prSize" },
                    prCount: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } } 
        ]);

        res.status(200).json(trends);
    } catch (error) {
        console.error("Trend Error:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getDoraMetrics = async (req, res) => {
    try {
        const { userId } = req.query;
        const user = await User.findById(userId);
        
        const repos = user.role === 'CTO' ? user.monitoredRepos : user.assignedRepos;

        const stats = await PRAnalytics.aggregate([
            { $match: { repoFullName: { $in: repos }, status: 'merged' } },
            { 
                $group: {
                    _id: null,
                    avgCycleTime: { $avg: "$cycleTimeMinutes" },
                    totalMerged: { $sum: 1 },
                    avgPrSize: { $avg: "$prSize" }
                }
            }
        ]);

        res.status(200).json(stats[0] || { avgCycleTime: 0, totalMerged: 0, avgPrSize: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getCTOMetrics = async (req, res) => {
    try {
        const { userId } = req.params;
        const { project } = req.query; 
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // CTO के लिए monitoredRepos और Manager के लिए assignedRepos स्कोप
        let reposToTrack = user.role === 'CTO' ? (user.monitoredRepos || []) : (user.assignedRepos || []);

        let matchStage = { 
            repoFullName: { $in: reposToTrack }, 
            status: 'merged' 
        };

        // Project filter logic
        if (project && project !== 'null') {
            matchStage.repoFullName = { $regex: new RegExp(`^${project}/`, 'i') };
        }

        const metrics = await PRAnalytics.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    "overall": [
                        { 
                            $group: { 
                                _id: null, 
                                avgCycleTime: { $avg: "$cycleTimeMinutes" }, 
                                avgPrSize: { $avg: "$prSize" }, 
                                totalMerged: { $sum: 1 } 
                            } 
                        }
                    ],
                    "orgWiseData": [
                        { $addFields: { orgName: { $arrayElemAt: [{ $split: ["$repoFullName", "/"] }, 0] } } },
                        { $group: { _id: "$orgName", avgCycleTime: { $avg: "$cycleTimeMinutes" }, totalPRs: { $sum: 1 } } }
                    ],
                    "teamWiseData": [
                        { $group: { _id: "$repoFullName", avgCycleTime: { $avg: "$cycleTimeMinutes" }, totalPRs: { $sum: 1 } } }
                    ],
                    "recentPRs": [
                        { $sort: { mergedAt: -1 } }, { $limit: 8 },
                        { $project: { title: 1, repo: "$repoFullName", author: 1, time: "$cycleTimeMinutes" } }
                    ]
                }
            }
        ]);

        // डेटा एक्सट्रैक्शन
        const overall = metrics[0].overall[0] || { avgCycleTime: 0, avgPrSize: 0, totalMerged: 0 };

        res.status(200).json({
            // 🚨 Fix: Hours और Minutes दोनों भेजें ताकि ग्राफ से मैच हो सके
            avgCycleTime: {
                hrs: (overall.avgCycleTime / 60).toFixed(1) + "h",
                mins: Math.round(overall.avgCycleTime) + "m"
            },
            // 🚨 Fix: overall से सीधे avgPrSize लें
            avgPrSize: Math.round(overall.avgPrSize) || 0,
            totalMerged: overall.totalMerged || 0,
            orgWiseData: metrics[0].orgWiseData || [],
            teamWiseData: metrics[0].teamWiseData || [],
            recentPRs: metrics[0].recentPRs || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getManagerScopedMetrics = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        
      const repos = user.assignedRepos || [];
        if (repos.length === 0) {
            return res.status(200).json({ 
                avgCycleTime: { hrs: "0h", mins: "0m" }, 
                activePRs: 0, 
                throughput: 0,
                avgPrSize: 0 
            });
        }

        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const metrics = await PRAnalytics.aggregate([
            { $match: { repoFullName: { $in: repos } } },
            {
                $facet: {
                    cycleTime: [
                        { $match: { status: 'merged', mergedAt: { $gte: last30Days } } }, 
                        { $group: {
                            _id: null,
                            avgMinutes: { $avg: "$cycleTimeMinutes" } 
                        }}
                    ],
                    activePRs: [
                        { $match: { status: 'open' } }, 
                        { $count: "count" }
                    ],
                    throughput: [
                        { $match: { status: 'merged', mergedAt: { $gte: last30Days } } },
                        { $count: "count" }
                    ],
                    prSizeData: [
                        { $match: { status: 'merged' } }, 
                        { $group: {
                            _id: null,
                            avgSize: { $avg: "$prSize" } 
                        }}
                    ]
                }
            }
        ]);

        const avgMin = metrics[0].cycleTime[0]?.avgMinutes || 0;
        const avgSize = metrics[0].prSizeData[0]?.avgSize || 0;

        res.status(200).json({
            avgCycleTime: {
                hrs: (avgMin / 60).toFixed(1) + "h",
                mins: Math.round(avgMin) + "m"
            },
            activePRs: metrics[0].activePRs[0]?.count || 0,
            throughput: metrics[0].throughput[0]?.count || 0,
            avgPrSize: Math.round(avgSize) 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};