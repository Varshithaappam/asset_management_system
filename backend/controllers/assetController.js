const pool = require('../config/db');

// asset-types
exports.getAllAssetTypes = async (req, res) => {
    try {
        const query = `
            SELECT 
                at.id, 
                at.name, 
                at.total_limit,
                (SELECT COUNT(*) 
                 FROM assignment_history ah 
                 WHERE ah.asset_id IN (SELECT a.asset_id FROM assets a WHERE a.type_id = at.id)
                 AND ah.to_date IS NULL) AS assigned_count,
                (SELECT COUNT(*) 
                 FROM assets a 
                 WHERE a.type_id = at.id) AS total_registered,
                (SELECT COUNT(*) 
                 FROM repair_history rh 
                 WHERE rh.asset_id IN (SELECT a.asset_id FROM assets a WHERE a.type_id = at.id)) AS repair_count
            FROM asset_types at
            WHERE at.delete_stat = 0
            ORDER BY at.name ASC
        `;

        const [rows] = await pool.query(query);

        const formattedRows = rows.map(row => {
            const assigned = row.assigned_count || 0;
            const total = row.total_limit || 20;

            return {
                id: row.id,
                name: row.name,
                total_limit: total,
                assigned_count: assigned,
                inventory_count: total - assigned,
                repair_count: row.repair_count || 0
            };
        });

        res.json(formattedRows);
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

// ----------------------------------------------

// assets
exports.getAssetDetailsByCategory = async (req, res) => {
    const { typeName } = req.params;
    try {
        const query = `
            SELECT 
                a.asset_id, 
                a.brand, 
                a.model, 
                a.ram,              
                a.processor,        
                a.os,               
                a.storage_capacity, 
                a.screen_size,      
                ah.employee_id, 
                ah.employee_name, 
                DATE_FORMAT(ah.from_date, '%Y-%m-%d') as assign_date
            FROM assets a
            JOIN asset_types at ON a.type_id = at.id
            LEFT JOIN assignment_history ah ON a.asset_id = ah.asset_id AND ah.to_date IS NULL
            WHERE at.name = ?
        `;
        const [rows] = await pool.query(query, [typeName]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: "Database query failed" });
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

exports.getAssetDetails = async (req, res) => {
    const { assetId } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT asset_id, brand, model, ram, processor, os, storage_capacity, screen_size FROM assets WHERE asset_id = ?',
            [assetId]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Asset not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.getAssetHistory = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                employee_id, 
                employee_name, 
                DATE_FORMAT(from_date, '%d-%m-%Y') as from_date, 
                DATE_FORMAT(to_date, '%d-%m-%Y') as to_date, 
                remarks 
             FROM assignment_history 
             WHERE asset_id = ? 
             ORDER BY 
                CASE WHEN to_date IS NULL THEN 0 ELSE 1 END, 
                from_date DESC,                             
                id DESC`,
            [req.params.assetId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
// --------------------------------------

exports.getAssetsByTypeName = async (req, res) => {
    const { typeName } = req.params;
    try {
        const query = `
            SELECT 
                a.asset_id, 
                at.name as asset_type, 
                ah.employee_id, 
                ah.employee_name, 
                DATE_FORMAT(ah.from_date, '%Y-%m-%d') as assign_date
            FROM assets a
            JOIN asset_types at ON a.type_id = at.id
            LEFT JOIN assignment_history ah ON a.asset_id = ah.asset_id AND ah.to_date IS NULL
            WHERE at.name = ?
        `;
        const [rows] = await pool.query(query, [typeName]);
        res.json(rows);
    } catch (err) {
        console.error("SQL Error:", err.message);
        res.status(500).json({ error: "Database query failed" });
    }
};

// 2. Updated getAssetDetailsByCategory (Cleaned and Fixed)


exports.assignNewAsset = async (req, res) => {
    const {
        asset_id, brand, model, typeName,
        ram, processor, screen_size, os, storage_capacity,
        employee_id, employee_name, from_date
    } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [typeRow] = await connection.query('SELECT id FROM asset_types WHERE name = ?', [typeName]);
        if (typeRow.length === 0) throw new Error("Category not found");
        const type_id = typeRow[0].id;
        const assetQuery = `
            INSERT INTO assets 
            (asset_id, type_id, brand, model, ram, processor, screen_size, os, storage_capacity) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await connection.query(assetQuery, [
            asset_id, type_id, brand, model,
            ram || null,
            processor || null,
            screen_size || null,
            os || null,
            storage_capacity || null
        ]);
        const historyQuery = `
            INSERT INTO assignment_history (asset_id, employee_id, employee_name, from_date, to_date) 
            VALUES (?, ?, ?, ?, NULL)`;

        await connection.query(historyQuery, [asset_id, employee_id, employee_name, from_date]);

        await connection.commit();
        res.status(201).json({ message: "Asset successfully registered and assigned" });
    } catch (err) {
        await connection.rollback();
        console.error("SQL Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

// ----------------------------------------

exports.getAssetRepairs = async (req, res) => {
    const { assetId } = req.params;
    try {
        const query = `
            SELECT 
                rh.id, 
                DATE_FORMAT(rh.date_reported, '%d-%m-%Y') as date_reported, 
                rh.issue_reported, 
                rh.amount, 
                rh.resolver_comments,
                COALESCE(ah.employee_name, 'System/Unassigned') as employee_name
            FROM repair_history rh
            LEFT JOIN assignment_history ah ON rh.asset_id = ah.asset_id 
                AND rh.date_reported BETWEEN ah.from_date AND COALESCE(ah.to_date, CURDATE())
            WHERE rh.asset_id = ? 
            ORDER BY rh.date_reported DESC`;

        const [rows] = await pool.query(query, [assetId]);
        res.json(rows);
    } catch (err) {
        console.error("Fetch repairs error:", err.message);
        res.status(500).json({ error: err.message });
    }
};


// 2. Add Repair
exports.addRepair = async (req, res) => {
    const { asset_id, date_reported, issue_reported, amount, resolver_comments } = req.body;
    try {
        const query = `
            INSERT INTO repair_history 
            (asset_id, date_reported, issue_reported, amount, resolver_comments) 
            VALUES (?, ?, ?, ?, ?)`;
        await pool.query(query, [asset_id, date_reported, issue_reported, amount, resolver_comments]);
        res.status(201).json({ message: "Repair record added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. End Current Assignment
exports.endAssignment = async (req, res) => {
    const { asset_id, employee_id, remarks } = req.body;
    try {
        const query = `
            UPDATE assignment_history 
            SET to_date = CURDATE(), remarks = ? 
            WHERE asset_id = ? AND employee_id = ? AND to_date IS NULL`;
        await pool.query(query, [remarks, asset_id, employee_id]);
        res.json({ message: "Assignment closed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
//additional 
exports.softDeleteAsset = async (req, res) => {
    const { typeName } = req.params;
    try {
        const [result] = await pool.query(
            "UPDATE asset_types SET delete_stat = 1 WHERE name = ?",
            [typeName]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Asset type not found" });
        }
        res.json({ message: `${typeName} deleted successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};