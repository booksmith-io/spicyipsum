BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS 'db_patch_history' (
    db_patch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patch_name TEXT NOT NULL,
    applied_on TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX db_patch_history_patch_name_index ON db_patch_history (patch_name);

COMMIT;
