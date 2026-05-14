const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const fs = require('fs'); // Added to check if file exists

const dbPath = path.resolve(__dirname, '..','data', 'BRIGHTDatabase.db'); //changed

// --- ADD THIS LOG TO DEBUG ---
console.log("🔍 Checking database at:", dbPath);
if (!fs.existsSync(dbPath)) {
    console.error("❌ ERROR: The file does not exist at this path! Script will create an empty one and fail.");
    process.exit(1); 
}
// -----------------------------

const db = new sqlite3.Database(dbPath);

const categoryIdToName = {
    1: 'eventsandactivities', 2: 'travelandconferences', 3: 'suppliesandmaterials',
    4: 'marketingandoutreach', 5: 'equipmentandtechnology', 6: 'emergencyfund'
};

console.log("🔗 STARTING CHAIN REBUILDER (Stitching blocks back together)...");

db.serialize(() => {
    // 1. Kuhanin lahat ng blocks, sunod-sunod
    const sql = `
      SELECT * FROM (
        SELECT allocation_id AS id, 'Allocation' AS type, name, category_id, amount, description, business_justification, submitted_by_user_id, priority, NULL as budget_allocation_id, NULL as expense_date, NULL as vendor, NULL as receipt_number, previous_hash, hash, block_number, created_at FROM BudgetAllocations
        UNION ALL
        SELECT expense_id AS id, 'Expense' AS type, name, category_id, amount, description, NULL as business_justification, submitted_by_user_id, NULL as priority, budget_allocation_id, expense_date, vendor, receipt_number, previous_hash, hash, block_number, created_at FROM Expenses
      ) ORDER BY block_number ASC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) throw err;

        // Start with Genesis Hash (Pure zeros)
        let currentPreviousHash = '0000000000000000000000000000000000000000000000000000000000000000';
        let updates = 0;

        // Gumamit tayo ng Promise-like approach para sigurado sa sequence
        const runUpdates = async () => {
            for (const row of rows) {
                
                // --- STEP 1: RECONSTRUCT DATA ---
                let dataToHash = {};

                if (row.type === 'Allocation') {
                    const catName = categoryIdToName[row.category_id] || 'unknown';
                    dataToHash = {
                        block: row.block_number, id: row.id, name: row.name, category: catName,
                        amount: row.amount, desc: row.description, justification: row.business_justification,
                        submitter: row.submitted_by_user_id, priority: row.priority || 'Normal',
                        timestamp: row.created_at, 
                        prevHash: currentPreviousHash
                    };
                } else {
                    dataToHash = {
                        block: row.block_number, id: row.id, name: row.name, budgetId: row.budget_allocation_id,
                        category: row.category_id, amount: row.amount, date: row.expense_date, vendor: row.vendor,
                        desc: row.description, receipt: row.receipt_number, submitter: row.submitted_by_user_id,
                        timestamp: row.created_at,
                        prevHash: currentPreviousHash 
                    };
                }

                // --- STEP 2: GENERATE NEW HASH ---
                const stringPayload = JSON.stringify(dataToHash);
                const newHash = crypto.createHash('sha256').update(stringPayload).digest('hex');

                // --- STEP 3: UPDATE DB (Hash AND Previous Hash) ---
                const table = row.type === 'Allocation' ? 'BudgetAllocations' : 'Expenses';
                const idCol = row.type === 'Allocation' ? 'allocation_id' : 'expense_id';

                // Update natin pati ang previous_hash column para magtugma sila
                await new Promise((resolve, reject) => {
                    db.run(`UPDATE ${table} SET hash = ?, previous_hash = ? WHERE ${idCol} = ?`, 
                        [newHash, currentPreviousHash, row.id], 
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });

                // --- STEP 4: MOVE FORWARD ---
                // Ang newHash ngayon ang magiging previousHash ng susunod na block
                currentPreviousHash = newHash;
                updates++;
                
                // Optional: Log progress every 10 blocks
                if (updates % 10 === 0) process.stdout.write('.');
            }
        };

        runUpdates().then(() => {
            console.log(`\n\n✅ CHAIN REBUILT! Successfully re-linked ${updates} blocks.`);
        }).catch(err => {
            console.error("Error updating chain:", err);
        });
    });
});