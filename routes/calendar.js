/**
 * PROPABRIDGE — Google Calendar OAuth Route
 * One-time OAuth flow to get refresh token for Calendar API
 */

const router = require('express').Router();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CALENDAR_CLIENT_ID,
        process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
        process.env.GOOGLE_CALENDAR_REDIRECT_URI || `http://localhost:${process.env.PORT || 8080}/api/calendar/callback`
    );
}

/**
 * @swagger
 * /api/calendar/authorize:
 *   get:
 *     tags: [📅 Scheduler]
 *     summary: Start Google Calendar OAuth flow (one-time setup)
 *     description: |
 *       Redirects to Google's OAuth consent screen. After authorization,
 *       the refresh token is saved to .env automatically.
 *       **Run this once** to enable Google Calendar integration.
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/authorize', (req, res) => {
    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar'],
    });

    res.redirect(authUrl);
});

/**
 * @swagger
 * /api/calendar/callback:
 *   get:
 *     tags: [📅 Scheduler]
 *     summary: OAuth callback — receives authorization code and stores refresh token
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token saved successfully
 */
router.get('/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.status(400).json({
            success: false,
            error: `OAuth error: ${error}`,
            tip: 'Try /api/calendar/authorize again',
        });
    }

    if (!code) {
        return res.status(400).json({
            success: false,
            error: 'No authorization code received',
            tip: 'Visit /api/calendar/authorize to start the OAuth flow',
        });
    }

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            return res.status(400).json({
                success: false,
                error: 'No refresh token received — Google may have already authorized this app.',
                tip: 'Go to https://myaccount.google.com/permissions, revoke Propabridge access, then try /api/calendar/authorize again.',
            });
        }

        // Save refresh token to .env file
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = '';
        try {
            envContent = fs.readFileSync(envPath, 'utf8');
        } catch { /* .env doesn't exist yet */ }

        if (envContent.includes('GOOGLE_CALENDAR_REFRESH_TOKEN=')) {
            // Replace existing token
            envContent = envContent.replace(
                /GOOGLE_CALENDAR_REFRESH_TOKEN=.*/,
                `GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`
            );
        } else {
            // Append to .env
            envContent += `\n# Google Calendar Refresh Token (auto-generated)\nGOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        }

        fs.writeFileSync(envPath, envContent);

        // Set in process.env for immediate use
        process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = tokens.refresh_token;

        console.log('✅ Google Calendar refresh token saved to .env');

        res.json({
            success: true,
            message: '✅ Google Calendar connected! Refresh token saved to .env.',
            access_token_expires: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'unknown',
            next_steps: [
                'Calendar integration is now active — viewings will create Google Calendar events.',
                'Restart the server for the token to take full effect: npm run dev',
                'Test by booking a viewing via POST /api/scheduler/book',
            ],
        });
    } catch (err) {
        console.error('Calendar OAuth error:', err.message);
        res.status(500).json({
            success: false,
            error: err.message,
            tip: 'Check GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET in .env',
        });
    }
});

/**
 * @swagger
 * /api/calendar/status:
 *   get:
 *     tags: [📅 Scheduler]
 *     summary: Check if Google Calendar is connected
 *     responses:
 *       200:
 *         description: Calendar status
 */
router.get('/status', (req, res) => {
    const hasRefreshToken = !!process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
    const hasServiceAccount = !!process.env.GOOGLE_APPLICATION_CREDENTIALS &&
        require('fs').existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    res.json({
        connected: hasRefreshToken || hasServiceAccount,
        method: hasRefreshToken ? 'oauth' : hasServiceAccount ? 'service_account' : 'none',
        calendar_id: process.env.GOOGLE_CALENDAR_ID || 'primary',
        setup_url: hasRefreshToken || hasServiceAccount ? null : '/api/calendar/authorize',
    });
});

module.exports = router;
