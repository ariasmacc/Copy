-- Add these to the top if you want a clean reset script
DROP TABLE IF EXISTS "Validations";
DROP TABLE IF EXISTS "Expenses";
DROP TABLE IF EXISTS "Documents";
DROP TABLE IF EXISTS "BudgetAllocations";
DROP TABLE IF EXISTS "Categories";
DROP TABLE IF EXISTS "Users";
--pwede itong tanggalin later, para lang sa testing.--

CREATE TABLE "BudgetAllocations" (
	"allocation_id"	TEXT,
	"name"	TEXT NOT NULL,
	"category_id"	INTEGER NOT NULL,
	"amount"	DECIMAL(10, 2) NOT NULL,
	"description"	TEXT,
	"business_justification"	TEXT,
	"submitted_by_user_id"	INTEGER NOT NULL,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"status"	TEXT NOT NULL CHECK("status" IN ('Pending', 'Approved', 'Rejected', 'Draft')),
	"priority"	TEXT DEFAULT 'Normal' CHECK("priority" IN ('Normal', 'High')),
	"block_number"	INTEGER,
	"hash"	TEXT UNIQUE,
	"previous_hash"	TEXT,
	PRIMARY KEY("allocation_id"),
	FOREIGN KEY("category_id") REFERENCES "Categories"("category_id"),
	FOREIGN KEY("submitted_by_user_id") REFERENCES "Users"("user_id")
);

CREATE TABLE "Categories" (
	"category_id"	INTEGER,
	"name"	TEXT NOT NULL UNIQUE,
	"description"	TEXT,
	PRIMARY KEY("category_id" AUTOINCREMENT)
);

CREATE TABLE "Documents" (
	"document_id"	INTEGER,
	"file_name"	TEXT NOT NULL,
	"description"	TEXT,
	"file_type"	TEXT,
	"file_size_kb"	REAL,
	"file_path"	TEXT NOT NULL,
	"file_hash"	TEXT,
	"related_item_id"	TEXT NOT NULL,
	"related_item_type"	TEXT NOT NULL,
	"uploaded_by_user_id"	INTEGER,
	"uploaded_at"	TEXT DEFAULT CURRENT_TIMESTAMP,
	"status"	TEXT NOT NULL DEFAULT 'Pending Review' CHECK("status" IN ('Pending Review', 'Rejected', 'Approved')),
	PRIMARY KEY("document_id" AUTOINCREMENT),
	FOREIGN KEY("uploaded_by_user_id") REFERENCES "Users"("user_id")
);

CREATE TABLE "Expenses" (
	"expense_id"	TEXT,
	"budget_allocation_id"	TEXT NOT NULL,
	"category_id"	INTEGER NOT NULL,
	"amount"	DECIMAL(10, 2) NOT NULL,
	"expense_date"	DATE NOT NULL,
	"vendor"	TEXT NOT NULL,
	"description"	TEXT NOT NULL,
	"receipt_number"	TEXT,
	"submitted_by_user_id"	INTEGER NOT NULL,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"status"	TEXT NOT NULL CHECK("status" IN ('Pending', 'Approved', 'Rejected')),
	"block_number"	INTEGER,
	"hash"	TEXT UNIQUE,
	"previous_hash"	TEXT,
	"name"	TEXT,
	PRIMARY KEY("expense_id"),
	FOREIGN KEY("budget_allocation_id") REFERENCES "BudgetAllocations"("allocation_id"),
	FOREIGN KEY("category_id") REFERENCES "Categories"("category_id"),
	FOREIGN KEY("submitted_by_user_id") REFERENCES "Users"("user_id")
);

CREATE TABLE "Users" (
	"user_id"	INTEGER,
	"username"	TEXT NOT NULL UNIQUE,
	"full_name"	TEXT NOT NULL,
	"role"	TEXT NOT NULL CHECK("role" IN ('Admin', 'Validator')),
	"password_hash"	TEXT NOT NULL DEFAULT 'temp-please-change',
	"email"	TEXT NOT NULL UNIQUE,
	"position"	TEXT,
	"reset_token"	VARCHAR(255),
	"reset_token_expires"	DATETIME,
	"status"	TEXT NOT NULL DEFAULT 'pending',
	"department"	TEXT,
	"created_at"	DATETIME,
	PRIMARY KEY("user_id" AUTOINCREMENT)
);

CREATE TABLE "Validations" (
	"validation_id"	INTEGER,
	"item_id"	TEXT NOT NULL,
	"item_type"	TEXT NOT NULL CHECK("item_type" IN ('expense', 'allocation')),
	"validator_user_id"	INTEGER NOT NULL,
	"decision"	TEXT NOT NULL CHECK("decision" IN ('Pending', 'Approved', 'Rejected')),
	"comments"	TEXT,
	"validated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE("item_id","item_type","validator_user_id"),
	PRIMARY KEY("validation_id" AUTOINCREMENT),
	FOREIGN KEY("validator_user_id") REFERENCES "Users"("user_id")
);