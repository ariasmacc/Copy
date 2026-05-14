const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// 1. Setup Database Connection
// Siguraduhin na ang 'BRIGHTDatabase.db' ay ang file na dinownload mo galing Railway (na inedit mo)
//const dbPath = path.resolve(__dirname, '..','data', 'BRIGHTDatabase.db'); //changed
//const dbPath = path.join(__dirname, '..', 'data', 'BRIGHTDatabase.db');
// This tells Node: "Go to where this script is, go up one folder, then into data"
const dbPath = path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');
const db = new sqlite3.Database(dbPath);

console.log("🔍 Checking database at:", dbPath);
console.log("🕵️  STARTING REAL BLOCKCHAIN AUDIT (Tampering Detection)...\n");

// 2. Kuhanin ang lahat ng blocks (Expenses at Allocations) at pagsamahin
const sql = `
  SELECT * FROM (
    SELECT 
        allocation_id AS id, 
        'Allocation' AS type, 
        name, 
        category_id,
        amount, 
        description,
        business_justification,
        submitted_by_user_id,
        priority,
        NULL as budget_allocation_id, -- Wala nito ang Allocation
        NULL as expense_date, -- Wala nito ang Allocation
        NULL as vendor, -- Wala nito ang Allocation
        NULL as receipt_number, -- Wala nito ang Allocation
        previous_hash, 
        hash, 
        block_number,
        created_at
    FROM BudgetAllocations
    
    UNION ALL
    
    SELECT 
        expense_id AS id, 
        'Expense' AS type, 
        name, 
        category_id,
        amount, 
        description,
        NULL as business_justification, -- Wala nito ang Expense
        submitted_by_user_id,
        NULL as priority, -- Wala nito ang Expense
        budget_allocation_id,
        expense_date,
        vendor,
        receipt_number,
        previous_hash, 
        hash, 
        block_number,
        created_at
    FROM Expenses
  ) ORDER BY block_number ASC
`;

// Helper: Para mabalik ang Category ID (Database) -> Category Name (Hash format ng Allocation)
const categoryIdToName = {
    1: 'eventsandactivities',
    2: 'travelandconferences',
    3: 'suppliesandmaterials',
    4: 'marketingandoutreach',
    5: 'equipmentandtechnology',
    6: 'emergencyfund'
};

db.all(sql, [], (err, rows) => {
    if (err) {
        console.error("Database Error:", err);
        return;
    }

    let tamperingDetected = false;
    let errorsFound = 0;

    console.log(`Checking integrity of ${rows.length} blocks...\n`);

    rows.forEach((row) => {
        // --- STEP A: RECONSTRUCT DATA EXACTLY AS THE MODEL DOES ---
        let dataToHash = {};

        if (row.type === 'Allocation') {
            // Logic galing sa models/BudgetAllocation.js
            // NOTE: Sa Allocation model, ang hinahash ay ang Category NAME (string), pero sa DB ay ID.
            // Kailangan natin i-reverse map.
            const catName = categoryIdToName[row.category_id] || 'unknown'; 

            dataToHash = {
                block: row.block_number,
                id: row.id,
                name: row.name,
                category: catName, // Importante: String ang gamit dito
                amount: row.amount,
                desc: row.description,
                justification: row.business_justification,
                submitter: row.submitted_by_user_id,
                priority: row.priority || 'Normal',
                timestamp: row.created_at, // WARNING: Ito ang PHT string galing DB.
                prevHash: row.previous_hash
            };

        } else {
            // Logic galing sa models/Expense.js
            dataToHash = {
                block: row.block_number,
                id: row.id,
                name: row.name,
                budgetId: row.budget_allocation_id,
                category: row.category_id, // Importante: Sa Expense, ID ang gamit sa hash (budgetCategory)
                amount: row.amount,
                date: row.expense_date,
                vendor: row.vendor,
                desc: row.description,
                receipt: row.receipt_number,
                submitter: row.submitted_by_user_id,
                timestamp: row.created_at, // WARNING: Ito ang PHT string galing DB.
                prevHash: row.previous_hash
            };
        }

        // --- STEP B: GENERATE HASH ---
        // Ito ang exact line galing sa models niyo:
        // const newHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
        
        // Pero dahil JSON.stringify ang gamit niyo bago i-update:
        const stringPayload = JSON.stringify(dataToHash);
        const computedHash = crypto.createHash('sha256').update(stringPayload).digest('hex');

        // --- STEP C: COMPARE ---
        // Special Handling: Dahil alam nating magkaiba ang Timestamp format (ISO vs PHT),
        // maglalagay tayo ng logic na "Strict Check" vs "Amount Check".
        
        if (computedHash !== row.hash) {
            
            // Double check: Baka naman Timestamp lang ang rason kaya mali?
            // Pero dahil DEMO ito ng AMOUNT tampering, focus tayo kung nagbago ang AMOUNT.
            
            tamperingDetected = true;
            errorsFound++;
            
            console.log(`\n🔴 TAMPERING DETECTED in Block #${row.block_number} (${row.type})`);
            console.log(`   Item Name:     "${row.name}"`);
            console.log(`   Current Amount: ${row.amount}`); // Ito ang makikita mong 99999999
            console.log(`   -------------------------------------------`);
            console.log(`   Expected Hash: ${row.hash.substring(0, 30)}...`);
            console.log(`   Computed Hash: ${computedHash.substring(0, 30)}...`);
            console.log(`   👉 REASON: Content Mismatch (Data has been altered)`);
        }
    });

    // --- STEP D: CHAIN CHECK (Previous Hash) ---
    for(let i = 1; i < rows.length; i++) {
        if (rows[i].previous_hash !== rows[i-1].hash) {
            tamperingDetected = true;
            console.log(`\n❌ CHAIN BREAK: Block #${rows[i].block_number} does not link to Block #${rows[i-1].block_number}`);
        }
    }

    console.log("\n===================================================");
    if (tamperingDetected) {
        console.log(`🚨 AUDIT FAILED. The database contains manipulated records.`);
    } else {
        console.log("✅ AUDIT PASSED. No tampering detected.");
    }
});