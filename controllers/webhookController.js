import PRAnalytics from '../models/PRAnalytics.js'
export const handleGithubWebhook = async (req, res) => {

    const event = req.headers['x-github-event'];
    const body = req.body;
    console.log(body);
    if (!body) {
        return res.status(400).send('No payload received');
    }

    console.log(`Webhook Received: ${event}`);

    try {
        if (event === 'pull_request') {

            const { action, pull_request, repository } = body;
            if (!action || !pull_request) return res.status(200).send('Event ignored');
            const repoName = repository.full_name;
            const prId = pull_request.id.toString();
            console.log("Incoming Action:", action); 
            console.log("Repo Full Name:", repository.full_name);

            if (action === 'opened') {
                const prSize = pull_request.additions + pull_request.deletions;

                console.log(`New PR opened in ${repoName}`);
                await PRAnalytics.create({
                    prId: prId,
                    prNumber: pull_request.number,
                    title: pull_request.title,
                    repoFullName: repoName,
                    author: pull_request.user.login,
                    createdAt: pull_request.created_at,
                    prSize: pull_request.additions + pull_request.deletions,
                    status: 'opened'
                })
                 console.log(`✅ DB Saved: PR #${pull_request.number} in ${repoName}`);
                console.log(`Title: ${pull_request.title} | Size: ${prSize}`);
            }

            if (action === 'closed' && pull_request.merged) {
                const mergedAt = new Date(pull_request.merged_at);
                const createdAt = new Date(pull_request.created_at);

                const cycleTime = Math.round((mergedAt - createdAt) / (1000 * 60));
                await PRAnalytics.findOneAndUpdate({prId: prId},
                    { 
                        status: 'merged', 
                        mergedAt: mergedAt,
                        cycleTimeMinutes: cycleTime 
                    }
                )
                console.log(`DB: PR #${pull_request.number} marked as MERGED. Cycle Time: ${cycleTime} min and author ${author}`);
                
            }
        }
       res.status(200).send('Webhook Received');
    } catch (error) {
        console.error('DB Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
};
