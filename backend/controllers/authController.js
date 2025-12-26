const client = require('../config/oauth');
require('dotenv').config();

exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        if (email === process.env.ADMIN_EMAIL) {
            const adminUser = {
                name: payload.name,
                email: payload.email,
                role: 'admin'
            };
            res.cookie('admin_session', JSON.stringify(adminUser), {
                httpOnly: true,
                secure: false,
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.json({ user: adminUser });
        } else {
            return res.status(403).json({ error: "Access Denied: Admin only." });
        }
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
};

exports.getMe = (req, res) => {
    const session = req.cookies.admin_session;
    if (session) {
        res.status(200).json({ user: JSON.parse(session) });
    } else {
        res.status(401).json({ error: "Not authenticated" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('admin_session');
    res.json({ message: "Logged out successfully" });
};