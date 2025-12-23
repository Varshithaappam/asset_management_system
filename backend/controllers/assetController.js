const pool = require('../config/db');


exports.getAllAssetTypes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM asset_types ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createAssetType = async (req, res) => {
    const { name } = req.body;
    try {
        await pool.query('INSERT INTO asset_types (name) VALUES (?)', [name]);
        res.status(201).json({ message: "Asset type added successfully" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "This asset type already exists." });
        }
        res.status(500).json({ error: err.message });
    }
};


exports.getAssetDetails = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM assets WHERE asset_id = ?', [req.params.assetId]);
        if (rows.length === 0) return res.status(404).json({ error: "Asset not found" });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAssetHistory = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT employee_id, employee_name, DATE_FORMAT(from_date, '%Y-%m-%d') as from_date, 
             DATE_FORMAT(to_date, '%Y-%m-%d') as to_date, remarks 
             FROM assignment_history WHERE asset_id = ? ORDER BY id DESC`, [req.params.assetId]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.reassignAsset = async (req, res) => {
    const { asset_id, new_employee_id, new_employee_name, old_employee_id, remarks } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE assignment_history SET to_date = CURDATE(), remarks = ? WHERE asset_id = ? AND employee_id = ? AND to_date IS NULL',
            [remarks, asset_id, old_employee_id]
        );
        await connection.query(
            'INSERT INTO assignment_history (asset_id, employee_id, employee_name, from_date) VALUES (?, ?, ?, CURDATE())',
            [asset_id, new_employee_id, new_employee_name]
        );
        await connection.commit();
        res.json({ message: "Asset reassigned successfully" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: "Reassignment failed" });
    } finally { connection.release(); }
};