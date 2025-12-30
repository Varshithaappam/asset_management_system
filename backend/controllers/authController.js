const client = require('../config/oauth');
const pool = require('../config/db');
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
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            const dbUser = rows[0];
            const userSession = {
                name: payload.name,
                email: payload.email,
                role: dbUser.role 
            };
            res.cookie('admin_session', JSON.stringify(userSession), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 
            });

            return res.json({ user: userSession });
        } else {
            return res.status(403).json({ 
                error: "Access Denied: You are not registered in the employee directory." 
            });
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