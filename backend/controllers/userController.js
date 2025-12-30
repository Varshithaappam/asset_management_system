const pool = require('../config/db');
const db = require('../config/db');

exports.getAllUsers = async (req, res) => {
    try {
        const query = "SELECT * FROM users ORDER BY id DESC";
        const [rows] = await pool.query(query);
        const usersWithRoles = rows.map(user => {
            let displayRole = user.role;
            if (user.status === 'Inactive') {
                displayRole = 'Inactive';
            }

            return {
                ...user,
                role: displayRole
            };
        });

        res.json(usersWithRoles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createUser = async (req, res) => {
    const { employee_id, name, email, role } = req.body;
    try {
        // Default role is 'Employee' if not provided
        await pool.query(
            'INSERT INTO users (employee_id, name, email, role) VALUES (?, ?, ?, ?)',
            [employee_id, name, email, role || 'Employee']
        );
        res.status(201).json({ message: "User added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { employee_id, name, email, role } = req.body; 

    try {
        const query = `
            UPDATE users 
            SET employee_id = ?, name = ?, email = ?, role = ? 
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [employee_id, name, email, role, id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update user" });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const query = "UPDATE users SET status = 'Inactive' WHERE id = ?";
        const [result] = await pool.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User deactivated successfully" });
    } catch (err) {
        console.error("Soft Delete Error:", err.message);
        res.status(500).json({ error: "Database update failed: " + err.message });
    }
};

exports.bulkInsertUsers = async (req, res) => {
    const { users } = req.body;
    if (!users || !Array.isArray(users)) return res.status(400).json({ error: "Invalid format." });

    try {
        const emails = users.map(u => u.email);
        const [existing] = await db.query('SELECT email FROM users WHERE email IN (?)', [emails]);
        const existingEmails = existing.map(u => u.email);
        const newUsers = users.filter(u => !existingEmails.includes(u.email));

        if (newUsers.length === 0) return res.status(200).json({ message: "All users already exist." });

        const values = newUsers.map(u => [u.employee_id, u.name, u.email, 'Employee']);
        await db.query('INSERT INTO users (employee_id, name, email, role) VALUES ?', [values]);
        res.status(201).json({ message: `${newUsers.length} users imported.` });
    } catch (err) {
        res.status(500).json({ error: "Server error during import." });
    }
};

exports.getEmployeeAssetProfile = async (req, res) => {
    const { employeeId } = req.params;
    try {
        const [currentAssets] = await pool.query(`
            SELECT a.asset_id, at.name as type, a.brand, a.model, ah.from_date
            FROM assets a
            JOIN asset_types at ON a.type_id = at.id
            JOIN assignment_history ah ON a.asset_id = ah.asset_id
            WHERE ah.employee_id = ? AND ah.to_date IS NULL AND a.status = 'Assigned'
        `, [employeeId]);

        const [history] = await pool.query(`
    SELECT 
        a.asset_id, 
        at.name as type, 
        a.brand, 
        a.model, 
        DATE_FORMAT(ah.from_date, '%d-%m-%Y') as from_date, 
        DATE_FORMAT(ah.to_date, '%d-%m-%Y') as to_date, 
        ah.remarks,
        rh.issue_reported 
    FROM assignment_history ah
    JOIN assets a ON ah.asset_id = a.asset_id
    JOIN asset_types at ON a.type_id = at.id
    LEFT JOIN repair_history rh ON ah.asset_id = rh.asset_id AND rh.date_reported = ah.to_date -- Match by return date
    WHERE ah.employee_id = ? 
      AND ah.to_date IS NOT NULL
    ORDER BY ah.to_date DESC
`, [employeeId]);

        res.json({ currentAssets, history });
    } catch (err) {
        res.status(500).json({ error: "Database query failed" });
    }
};