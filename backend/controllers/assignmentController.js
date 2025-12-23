
const pool = require('../config/db');

exports.assignAsset = async (req, res) => {
    const { asset_id, brand, model, employee_id, employee_name, from_date, typeName } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const [typeRow] = await connection.query('SELECT id FROM asset_types WHERE name = ?', [typeName]);
        const type_id = typeRow[0].id;
        await connection.query(
            `INSERT INTO assets (asset_id, type_id, brand, model, status) 
             VALUES (?, ?, ?, ?, 'Assigned')`,
            [asset_id, type_id, brand, model]
        );
        await connection.query(
            `INSERT INTO assignment_history (asset_id, employee_id, employee_name, from_date) 
             VALUES (?, ?, ?, ?)`,
            [asset_id, employee_id, employee_name, from_date]
        );

        await connection.commit();
        res.json({ message: "New asset created and assigned successfully" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};