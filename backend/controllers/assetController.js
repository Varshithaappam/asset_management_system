const pool = require('../config/db');

// asset-types
exports.getAllAssetTypes = async (req, res) => {
    try {
        const query = `
            SELECT 
                at.id, 
                at.name, 
                (SELECT COUNT(*) FROM assets a WHERE a.type_id = at.id AND a.status = 'Inventory') AS inventory_count,
                (SELECT COUNT(*) FROM assets a WHERE a.type_id = at.id AND a.status = 'Assigned') AS assigned_count,
                (SELECT COUNT(*) FROM assets a WHERE a.type_id = at.id AND a.status = 'Repairs') AS repair_count,
                (SELECT COUNT(*) FROM assets a WHERE a.type_id = at.id AND a.status = 'Retired') AS retired_count
            FROM asset_types at
            WHERE at.delete_stat = 0
            ORDER BY at.name ASC
        `;

        const [rows] = await pool.query(query);

        // Map the rows to match the frontend expectation
        const formattedRows = rows.map(row => ({
            id: row.id,
            name: row.name,
            inventory_count: row.inventory_count || 0,
            assigned_count: row.assigned_count || 0,
            repair_count: row.repair_count || 0,
            retired_count: row.retired_count || 0
        }));

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

exports.retireAsset = async (req, res) => {
    const { assetId } = req.params;
    try {
        const query = "UPDATE assets SET status = 'Retired' WHERE asset_id = ?";
        const [result] = await pool.query(query, [assetId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Asset not found" });
        }
        
        res.json({ message: "Asset moved to Retired status" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 1. Get Assets by Category and Status (For the 4-tab slider)
exports.getAssetsByStatus = async (req, res) => {
    const { typeName, status } = req.params;
    try {
        let query;
        let params = [typeName];

        if (status === 'Inventory') {
            query = `
                SELECT a.* FROM assets a
                JOIN asset_types at ON a.type_id = at.id
                WHERE at.name = ? AND a.status IN ('Inventory', 'Repairs')
                AND a.status != 'Deleted'
            `;
        } else if (status === 'Repairs') {
            query = `
                SELECT a.*, rh.issue_reported, rh.amount 
                FROM assets a
                JOIN asset_types at ON a.type_id = at.id
                LEFT JOIN repair_history rh ON a.asset_id = rh.asset_id AND rh.status = 'Pending'
                WHERE at.name = ? AND a.status = 'Repairs'
            `;
        } else {
            query = `
                SELECT a.*, ah.employee_id, ah.employee_name, 
                       DATE_FORMAT(ah.from_date, '%Y-%m-%d') as assign_date
                FROM assets a
                JOIN asset_types at ON a.type_id = at.id
                LEFT JOIN assignment_history ah ON a.asset_id = ah.asset_id AND ah.to_date IS NULL
                WHERE at.name = ? AND a.status = ?
            `;
            params.push(status);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.solveRepair = async (req, res) => {
    const { asset_id } = req.params;
    const { main_issue, cost, solved_date } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query("UPDATE assets SET status = 'Inventory' WHERE asset_id = ?", [asset_id]);
        
        const updateHistoryQuery = `
            UPDATE repair_history 
            SET status = 'Fixed', 
                issue_reported = ?, 
                amount = ?, 
                date_resolved = ? 
            WHERE asset_id = ? AND status = 'Pending'
        `;
        await connection.query(updateHistoryQuery, [main_issue, cost, solved_date, asset_id]);
        
        await connection.commit();
        res.status(200).json({ message: "Repair records updated successfully" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: "Failed to save resolution details" });
    } finally { connection.release(); }
};
// 2. Assign an existing asset from Inventory
exports.assignExistingAsset = async (req, res) => {
    const { asset_id, employee_id, employee_name, from_date } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            "UPDATE assets SET status = 'Assigned' WHERE asset_id = ?",
            [asset_id]
        );
        await connection.query(
            "INSERT INTO assignment_history (asset_id, employee_id, employee_name, from_date) VALUES (?, ?, ?, ?)",
            [asset_id, employee_id, employee_name, from_date]
        );

        await connection.commit();
        res.json({ message: "Asset assigned successfully" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

exports.moveToRepair = async (req, res) => {
    const { asset_id, issue, date } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const closeAssignmentQuery = `
            UPDATE assignment_history 
            SET to_date = ?, remarks = 'Moved to Repair' 
            WHERE asset_id = ? AND to_date IS NULL
        `;
        await connection.query(closeAssignmentQuery, [date, asset_id]);
        await connection.query("UPDATE assets SET status = 'Repairs' WHERE asset_id = ?", [asset_id]);
        const historyQuery = `
            INSERT INTO repair_history (asset_id, issue_reported, date_reported, status) 
            VALUES (?, ?, ?, 'Pending')
        `;
        await connection.query(historyQuery, [asset_id, issue, date]);

        await connection.commit();
        res.status(200).json({ message: "Asset moved to repairs and assignment ended." });
    } catch (err) {
        await connection.rollback();
        console.error("Repair Error:", err);
        res.status(500).json({ error: "Failed to process repair request" });
    } finally {
        connection.release();
    }
};

exports.moveToRepair = async (req, res) => {
    const { asset_id, issue, date } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const closeAssignmentQuery = `
            UPDATE assignment_history 
            SET to_date = ?, remarks = 'Moved to Repair' 
            WHERE asset_id = ? AND to_date IS NULL
        `;
        await connection.query(closeAssignmentQuery, [date, asset_id]);
        const updateAssetQuery = "UPDATE assets SET status = 'Repairs' WHERE asset_id = ?";
        await connection.query(updateAssetQuery, [asset_id]);
        const historyQuery = `
            INSERT INTO repair_history 
            (asset_id, issue_reported, date_reported, status) 
            VALUES (?, ?, ?, 'Pending')
        `;
        await connection.query(historyQuery, [asset_id, issue, date]);

        await connection.commit();
        res.status(200).json({ message: "Asset moved to repairs and current assignment ended." });
    } catch (err) {
        await connection.rollback();
        console.error("Repair Error:", err);
        res.status(500).json({ error: "Failed to process repair request" });
    } finally {
        connection.release();
    }
};

exports.unassignAsset = async (req, res) => {
    const { asset_id } = req.params;
    const { remarks } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const closeHistoryQuery = `
            UPDATE assignment_history 
            SET to_date = CURDATE(), 
                remarks = ? 
            WHERE asset_id = ? AND to_date IS NULL
        `;
        await connection.query(closeHistoryQuery, [remarks || 'Returned to Inventory', asset_id]);
        const updateAssetQuery = "UPDATE assets SET status = 'Inventory' WHERE asset_id = ?";
        await connection.query(updateAssetQuery, [asset_id]);

        await connection.commit();
        res.status(200).json({ message: "Assignment ended and asset returned to Inventory" });
    } catch (err) {
        await connection.rollback();
        console.error("Unassign Error:", err);
        res.status(500).json({ error: "Failed to process asset return" });
    } finally {
        connection.release();
    }
};

exports.retireAsset = async (req, res) => {
    const { assetId } = req.params;
    const newStatus = req.body.status || 'Retired'; 

    try {
        const query = "UPDATE assets SET status = ? WHERE asset_id = ?";
        const [result] = await pool.query(query, [newStatus, assetId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Asset not found" });
        }
        
        res.json({ message: `Asset moved to ${newStatus} status` });
    } catch (err) {
        console.error("Update Status Error:", err.message);
        res.status(500).json({ error: err.message });
    }
}; 

exports.softDeleteAssetData = async (req, res) => {
    const { assetId } = req.params; 
    
    try {
        const query = "UPDATE assets SET status = 'Deleted' WHERE asset_id = ?";
        const [result] = await pool.query(query, [assetId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Asset not found in database" });
        }

        res.json({ message: "Asset soft-deleted successfully" });
    } catch (err) {
        console.error("Soft Delete Error:", err.message);
        res.status(500).json({ error: "Server error during soft delete" });
    }
};
exports.updateAssetDetails = async (req, res) => {
    const { assetId } = req.params;
    const { 
        brand, model, processor, ram, 
        storage_capacity, os, screen_size, bought_on 
    } = req.body;

    try {
        const query = `
            UPDATE assets 
            SET brand = ?, 
                model = ?, 
                processor = ?, 
                ram = ?, 
                storage_capacity = ?, 
                os = ?, 
                screen_size = ?, 
                bought_on = ? 
            WHERE asset_id = ?`;

        const [result] = await pool.query(query, [
            brand, 
            model, 
            processor || null, 
            ram || null, 
            storage_capacity || null, 
            os || null, 
            screen_size || null, 
            bought_on || null, 
            assetId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Asset not found" });
        }

        res.json({ message: "Asset details updated successfully" });
    } catch (err) {
        console.error("Update Error:", err.message);
        res.status(500).json({ error: "Database update failed" });
    }
};

exports.restoreAssetToInventory = async (req, res) => {
    const { assetId } = req.params;
    try {
        const query = "UPDATE assets SET status = 'Inventory' WHERE asset_id = ?";
        const [result] = await pool.query(query, [assetId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Asset not found" });
        }

        res.json({ message: "Asset restored to Inventory successfully" });
    } catch (err) {
        console.error("Restore Error:", err.message);
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
        asset_id, typeName, brand, model, bought_on,
        ram, processor, screen_size, os, storage_capacity
    } = req.body;

    try {
        const [typeRows] = await pool.query('SELECT id FROM asset_types WHERE name = ?', [typeName]);
        
        if (typeRows.length === 0) {
            return res.status(400).json({ error: `The category '${typeName}' does not exist. Please create the category first.` });
        }
        
        const type_id = typeRows[0].id; 
        const query = `
            INSERT INTO assets 
            (asset_id, type_id, brand, model, bought_on, ram, processor, screen_size, os, storage_capacity, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Inventory')
        `;

        await pool.query(query, [
            asset_id, type_id, brand, model, 
            bought_on || null,
            ram || null, 
            processor || null, 
            screen_size || null, 
            os || null, 
            storage_capacity || null
        ]);

        res.status(201).json({ message: "Asset registered successfully to Inventory" });
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
                DATE_FORMAT(rh.date_resolved, '%d-%m-%Y') as date_resolved, 
                rh.issue_reported, 
                rh.amount, 
                rh.status,
                COALESCE(ah.employee_name, 'System/Inventory') as employee_name
            FROM repair_history rh
            LEFT JOIN assignment_history ah ON rh.asset_id = ah.asset_id 
                AND ah.from_date <= rh.date_reported
            WHERE rh.asset_id = ? 
            ORDER BY rh.id DESC 
            LIMIT 100`; 

        const [rows] = await pool.query(query, [assetId]);
        const uniqueRepairs = Array.from(new Map(rows.map(item => [item['id'], item])).values());
        
        res.json(uniqueRepairs);
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