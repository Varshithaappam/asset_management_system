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
            asset_id, type_id, brand, model, ram, processor, screen_size, os, storage_capacity
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