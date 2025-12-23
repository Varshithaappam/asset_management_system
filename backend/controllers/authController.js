const pool = require('../config/db');
const client = require('../config/oauth');

exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email } = ticket.getPayload();
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) return res.status(403).json({ error: "Access denied." });

        res.cookie('session_token', token, {
            httpOnly: true,
            secure: false, 
            sameSite: 'lax',
            maxAge: 3600000 
        });
        res.json({ message: "Login successful", user: { name, email } });
    } catch (err) {
        res.status(401).json({ error: "Invalid Google authentication." });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('session_token');
    res.json({ message: "Logged out successfully" });
};