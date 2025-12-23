const pool = require('../config/db');


exports.getAllAssetTypes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM asset_types ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.addAsset = async (req, res) => {
    const { 
        asset_id, type_id, brand, model, bought_on, 
        ram, processor, screen_size, os, storage_capacity 
    } = req.body;
    
    try {
        const query = `
            INSERT INTO assets 
            (asset_id, type_id, brand, model, bought_on, ram, processor, screen_size, os, storage_capacity) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(query, [
            asset_id, type_id, brand, model, bought_on, 
            ram, processor, screen_size, os, storage_capacity
        ]);
        
        res.status(201).json({ message: "Asset registered successfully" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Asset ID already exists!" });
        }
        res.status(500).json({ error: err.message });
    }
};
exports.getAssetsByType = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM assets WHERE type_id = ? ORDER BY asset_id ASC', 
            [req.params.typeId]
        );
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
//----------------------
exports.getAssetsByTypeName = async (req, res) => {
    const { typeName } = req.params;
    try {
        const query = `
            SELECT 
                a.asset_id, 
                at.name as asset_type, 
                ah.employee_id, 
                ah.employee_name, 
                DATE_FORMAT(ah.from_date, '%Y-%m-%d') as assign_date,
                a.status
            FROM assets a
            JOIN asset_types at ON a.type_id = at.id
            LEFT JOIN assignment_history ah ON a.asset_id = ah.asset_id AND ah.to_date IS NULL
            WHERE at.name = ?
        `;
        const [rows] = await pool.query(query, [typeName]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAssetDetailsByCategory = async (req, res) => {
    const { typeName } = req.params;
    try {
        const query = `
            SELECT 
                a.asset_id, a.brand, a.model, a.ram, a.processor, a.status,
                ah.employee_id, ah.employee_name, 
                DATE_FORMAT(ah.from_date, '%Y-%m-%d') as assign_date
            FROM assets a
            JOIN asset_types at ON a.type_id = at.id
            LEFT JOIN assignment_history ah ON a.asset_id = ah.asset_id AND ah.to_date IS NULL
            WHERE at.name = ?
        `;
        const [rows] = await pool.query(query, [typeName]);
        res.status(200).json(rows);
    } catch (err) {
        console.error("Backend Error:", err);
        res.status(500).json({ error: "Database query failed" });
    }
};

// Add this to your controller file
exports.assignNewAsset = async (req, res) => {
    const { 
        asset_id, brand, model, typeName, 
        employee_id, employee_name, from_date 
    } = req.body;

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Get the type_id based on the category name (e.g., 'Laptop')
        const [typeRow] = await connection.query('SELECT id FROM asset_types WHERE name = ?', [typeName]);
        if (typeRow.length === 0) throw new Error("Category not found");
        const type_id = typeRow[0].id;

        // 2. Insert the new device into 'assets' table
        // Status is set to 'Assigned' by default here
        await connection.query(
            `INSERT INTO assets (asset_id, type_id, brand, model, status) 
             VALUES (?, ?, ?, ?, 'Assigned')`,
            [asset_id, type_id, brand, model]
        );

        // 3. Insert the assignment record into 'assignment_history'
        await connection.query(
            `INSERT INTO assignment_history (asset_id, employee_id, employee_name, from_date) 
             VALUES (?, ?, ?, ?)`,
            [asset_id, employee_id, employee_name, from_date]
        );

        await connection.commit();
        res.status(201).json({ message: "New asset registered and assigned!" });
    } catch (err) {
        await connection.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Asset ID already exists!" });
        }
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};