const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Set up persistent data directory (Auto-detects Render's /data persistent disk)
const DATA_DIR = fs.existsSync('/data') ? '/data' : __dirname;
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'database.sqlite');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database Initialization
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database.');
        initDatabase();
    }
});

// Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        // Safe filename with timestamp
        const safeName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, safeName);
    }
});
const upload = multer({ storage: storage });

// Express Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Fallback in case index.html was uploaded to the root of the repository
app.use('/uploads', express.static(UPLOADS_DIR));

// Database Schema Setup
function initDatabase() {
    db.serialize(() => {
        // Create Checklists table
        db.run(`CREATE TABLE IF NOT EXISTS checklists (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT
        )`);

        // Create Tasks table (supports related task reference)
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            checklist_id TEXT,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'during',
            related_task_ids TEXT, /* Stored as JSON string array */
            x INTEGER DEFAULT 0,
            y INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
        )`);

        // Create Files table
        db.run(`CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            task_id TEXT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT,
            size INTEGER,
            path TEXT NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )`);

        // Create Logs table
        db.run(`CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            checklist_id TEXT,
            action TEXT NOT NULL,
            detail TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
        )`);

        // Check if we need to migrate the tasks table schema (for old database upgrade)
        db.all("PRAGMA table_info(tasks)", (err, columns) => {
            if (err) {
                console.error("Error reading table info:", err);
                return;
            }
            
            const columnNames = columns.map(c => c.name);
            
            db.serialize(() => {
                if (!columnNames.includes('x')) {
                    console.log("Migration: Adding column x to tasks table");
                    db.run("ALTER TABLE tasks ADD COLUMN x INTEGER DEFAULT 0");
                }
                if (!columnNames.includes('y')) {
                    console.log("Migration: Adding column y to tasks table");
                    db.run("ALTER TABLE tasks ADD COLUMN y INTEGER DEFAULT 0");
                }
                if (!columnNames.includes('notes')) {
                    console.log("Migration: Adding column notes to tasks table");
                    db.run("ALTER TABLE tasks ADD COLUMN notes TEXT DEFAULT ''");
                }
                if (!columnNames.includes('related_task_ids')) {
                    console.log("Migration: Adding column related_task_ids to tasks table");
                    db.run("ALTER TABLE tasks ADD COLUMN related_task_ids TEXT DEFAULT '[]'");
                }
            });
        });

        // Check if database is empty to insert default data
        db.get("SELECT count(*) as count FROM checklists", (err, row) => {
            if (row && row.count === 0) {
                insertDefaultData();
            }
        });
    });
}

function getISO17025Tasks() {
    return [
        // Column 1: SD (Standard / Specification) - Foundation Documents (x = 80)
        { id: 'task-sd-401', name: 'SD-401-01 จรรยาบรรณ ความเป็นกลางและรักษาความลับ', status: 'during', related_task_ids: [], x: 80, y: 50, notes: '' },
        { id: 'task-sd-503', name: 'SD-503-01 Lab Scope', status: 'during', related_task_ids: [], x: 80, y: 280, notes: '' },
        { id: 'task-sd-505', name: 'SD-505-01 ผังโครงสร้างของฝ่ายห้องปฏิบัติการ', status: 'during', related_task_ids: [], x: 80, y: 510, notes: '' },
        { id: 'task-sd-506', name: 'SD-506-01 แต่งตั้ง Lab manager', status: 'during', related_task_ids: [], x: 80, y: 740, notes: '' },
        { id: 'task-sd-802-1', name: 'SD-802-01 นโยบายห้องปฏิบัติการ (Lab Policy)', status: 'during', related_task_ids: [], x: 80, y: 970, notes: '' },
        { id: 'task-sd-802-2', name: 'SD-802-02 ตัวชี้วัดคุณภาพ- KPI', status: 'during', related_task_ids: [], x: 80, y: 1200, notes: '' },

        // Column 2: QP (Quality Procedure) - Procedures (x = 440)
        { id: 'task-qp-401', name: 'QP-401-01 ความเป็นกลาง', status: 'during', related_task_ids: ['task-sd-401'], x: 440, y: 50, notes: '' },
        { id: 'task-qp-402', name: 'QP-402-02 การรักษาความลับของลูกค้า', status: 'during', related_task_ids: ['task-sd-401'], x: 440, y: 280, notes: '' },
        { id: 'task-qp-602', name: 'QP-602-01 ความสามารถและการฝึกอบรมบุคลากร', status: 'during', related_task_ids: [], x: 440, y: 510, notes: '' },
        { id: 'task-qp-603', name: 'QP-603-01 สิ่งอำนวยความสะดวกและภาวะแวดล้อม', status: 'during', related_task_ids: [], x: 440, y: 740, notes: '' },
        { id: 'task-qp-803', name: 'QP-803-01 Rev. 00 การควบคุมเอกสาร', status: 'during', related_task_ids: [], x: 440, y: 970, notes: '' },
        { id: 'task-qp-804', name: 'QP-804-01 การควบคุมบันทึก (Pass)', status: 'during', related_task_ids: [], x: 440, y: 1200, notes: '' },

        // Column 3: FM (Form) - Operational Forms & Records (x = 800)
        { id: 'task-fm-505', name: 'FM-505-01 Job Description', status: 'during', related_task_ids: ['task-sd-505', 'task-sd-506'], x: 800, y: 50, notes: '' },
        { id: 'task-fm-602-1', name: 'FM-602-01 แผนฝึกอบรมบุคลากรประจำปี', status: 'during', related_task_ids: ['task-qp-602'], x: 800, y: 280, notes: '' },
        { id: 'task-fm-602-2', name: 'FM-602-02 แบบประเมินผลการฝึกอบรมภายใน', status: 'during', related_task_ids: ['task-qp-602'], x: 800, y: 510, notes: '' },
        { id: 'task-fm-602-3', name: 'FM-602-03 แบบประเมินผลการฝึกอบรมในงาน (OJT)', status: 'during', related_task_ids: ['task-qp-602'], x: 800, y: 740, notes: '' },
        { id: 'task-fm-602-4', name: 'FM-602-04 แบบบันทึกประวัติการฝึกอบรมบุคลากร', status: 'during', related_task_ids: ['task-qp-602'], x: 800, y: 970, notes: '' },
        { id: 'task-fm-603-1', name: 'FM-603-01 แบบบันทึกสภาวะแวดล้อมห้องปฏิบัติการ', status: 'during', related_task_ids: ['task-qp-603'], x: 800, y: 1200, notes: '' },
        { id: 'task-fm-603-2', name: 'FM-603-02 แบบบันทึกการเข้า - ออก ห้องปฏิบัติการ', status: 'during', related_task_ids: ['task-qp-603'], x: 800, y: 1430, notes: '' }
    ];
}

function insertDefaultData() {
    console.log("Inserting default mock data...");
    const defaultData = [
        {
            id: 'cl-iso-17025',
            title: 'ISO-17025 Document',
            description: 'รายการเอกสารระบบบริหารงานคุณภาพห้องปฏิบัติการทดสอบและสอบเทียบ (ISO/IEC 17025:2017)',
            tasks: getISO17025Tasks()
        },
        {
            id: 'cl-2',
            title: 'เอกสารยื่นขอวีซ่าเชงเกน',
            description: 'เอกสารจำเป็นสำหรับยื่นขอวีซ่าท่องเที่ยวกลุ่มประเทศยุโรป',
            tasks: [
                { id: 'task-2-1', name: 'หนังสือเดินทาง (Passport) มีอายุมากกว่า 6 เดือน', status: 'complete', related_task_ids: [], x: 60, y: 50, notes: '' },
                { id: 'task-2-2', name: 'ใบคำร้องขอวีซ่าที่กรอกข้อมูลครบถ้วน', status: 'complete', related_task_ids: ['task-2-1'], x: 380, y: 50, notes: '' },
                { id: 'task-2-3', name: 'รูปถ่ายขนาด 2 นิ้ว พื้นหลังสีขาว 2 ใบ', status: 'complete', related_task_ids: ['task-2-2'], x: 700, y: 50, notes: '' },
                { id: 'task-2-4', name: 'หนังสือรับรองการทำงาน (ภาษาอังกฤษ)', status: 'during', related_task_ids: [], x: 60, y: 280, notes: '' },
                { id: 'task-2-5', name: 'รายการเดินบัญชีย้อนหลัง 6 เดือน (Statement)', status: 'during', related_task_ids: ['task-2-4'], x: 380, y: 280, notes: '' },
                { id: 'task-2-6', name: 'กรมธรรม์ประกันภัยการเดินทาง (Travel Insurance)', status: 'during', related_task_ids: [], x: 60, y: 510, notes: '' },
                { id: 'task-2-7', name: 'ตั๋วเครื่องบินและใบยืนยันการจองโรงแรม', status: 'during', related_task_ids: ['task-2-6'], x: 380, y: 510, notes: '' }
            ]
        }
    ];

    db.serialize(() => {
        const stmtChecklist = db.prepare("INSERT INTO checklists (id, title, description) VALUES (?, ?, ?)");
        const stmtTask = db.prepare("INSERT INTO tasks (id, checklist_id, name, status, related_task_ids, x, y, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        defaultData.forEach(cl => {
            stmtChecklist.run(cl.id, cl.title, cl.description);
            cl.tasks.forEach(t => {
                stmtTask.run(t.id, cl.id, t.name, t.status, JSON.stringify(t.related_task_ids || []), t.x || 0, t.y || 0, t.notes || '');
            });
        });
        
        stmtChecklist.finalize();
        stmtTask.finalize();
        console.log("Default mock data inserted successfully.");
    });
}

// REST API for File Uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
    const { taskId, checklistId } = req.body;
    const file = req.file;

    if (!file || !taskId || !checklistId) {
        return res.status(400).json({ error: 'Missing file, taskId, or checklistId' });
    }

    const fileId = `file-${Date.now()}`;
    const filePath = `/uploads/${file.filename}`;

    db.run(
        `INSERT INTO files (id, task_id, filename, original_name, mime_type, size, path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [fileId, taskId, file.filename, file.originalname, file.mimetype, file.size, filePath],
        function(err) {
            if (err) {
                console.error('File db insert error:', err);
                return res.status(500).json({ error: 'Database saving failed' });
            }

            // Create Log entry for file upload
            const logId = `log-${Date.now()}`;
            const timestamp = new Date().toISOString();
            const logMsg = `แนบไฟล์ "${file.originalname}"`;
            db.run(
                `INSERT INTO logs (id, checklist_id, action, detail, timestamp) VALUES (?, ?, ?, ?, ?)`,
                [logId, checklistId, 'add_task', logMsg, timestamp]
            );

            // Fetch newly created file object to return
            res.json({
                success: true,
                file: {
                    id: fileId,
                    taskId: taskId,
                    original_name: file.originalname,
                    mime_type: file.mimetype,
                    size: file.size,
                    path: filePath
                }
            });

            // Broadcast updates to all websockets
            broadcastStateUpdate();
        }
    );
});

// REST API for File Deletion
app.post('/api/delete-file', (req, res) => {
    const { fileId, checklistId } = req.body;

    if (!fileId || !checklistId) {
        return res.status(400).json({ error: 'Missing fileId or checklistId' });
    }

    db.get("SELECT filename, original_name FROM files WHERE id = ?", [fileId], (err, fileRow) => {
        if (err || !fileRow) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete physical file
        const physicalPath = path.join(UPLOADS_DIR, fileRow.filename);
        if (fs.existsSync(physicalPath)) {
            fs.unlinkSync(physicalPath);
        }

        // Delete database record
        db.run("DELETE FROM files WHERE id = ?", [fileId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database deletion failed' });
            }

            // Log action
            const logId = `log-${Date.now()}`;
            const timestamp = new Date().toISOString();
            const logMsg = `ลบไฟล์แนบ "${fileRow.original_name}"`;
            db.run(
                `INSERT INTO logs (id, checklist_id, action, detail, timestamp) VALUES (?, ?, ?, ?, ?)`,
                [logId, checklistId, 'delete_task', logMsg, timestamp]
            );

            res.json({ success: true });
            broadcastStateUpdate();
        });
    });
});

// Broadcast Database State to all Connected Clients
function broadcastStateUpdate() {
    getAllChecklistsData((err, checklistsData) => {
        if (err) return;
        const msg = JSON.stringify({ type: 'sync', checklists: checklistsData });
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        });
    });
}

// Fetch all database tables and map to deep nested JSON object
function getAllChecklistsData(callback) {
    db.all("SELECT * FROM checklists", (err, checklists) => {
        if (err) return callback(err);

        db.all("SELECT * FROM tasks", (err, tasks) => {
            if (err) return callback(err);

            db.all("SELECT * FROM files", (err, files) => {
                if (err) return callback(err);

                db.all("SELECT * FROM logs ORDER BY timestamp DESC", (err, logs) => {
                    if (err) return callback(err);

                    // Nesting logic
                    const mapped = checklists.map(cl => {
                        const clTasks = tasks
                            .filter(t => t.checklist_id === cl.id)
                            .map(t => {
                                const tFiles = files.filter(f => f.task_id === t.id);
                                return {
                                    id: t.id,
                                    name: t.name,
                                    status: t.status,
                                    related_task_id: t.related_task_id,
                                    files: tFiles.map(f => ({
                                        id: f.id,
                                        original_name: f.original_name,
                                        path: f.path,
                                        mime_type: f.mime_type,
                                        size: f.size
                                    }))
                                };
                            });

                        const clLogs = logs.filter(l => l.checklist_id === cl.id).map(l => ({
                            id: l.id,
                            action: l.action,
                            detail: l.detail,
                            timestamp: l.timestamp
                        }));

                        return {
                            id: cl.id,
                            title: cl.title,
                            description: cl.description,
                            tasks: clTasks,
                            logs: clLogs
                        };
                    });

                    callback(null, mapped);
                });
            });
        });
    });
}

// WebSocket Event Listeners
wss.on('connection', (ws) => {
    console.log('Client connected.');

    // Send initial sync payload
    getAllChecklistsData((err, checklistsData) => {
        if (!err) {
            ws.send(JSON.stringify({ type: 'init', checklists: checklistsData }));
        }
    });

    // Handle messages from clients
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('WS Message received:', data.type);

            switch (data.type) {
                case 'create_checklist':
                    db.run(
                        "INSERT INTO checklists (id, title, description) VALUES (?, ?, ?)",
                        [data.id, data.title, data.description],
                        () => {
                            insertLog(data.id, 'create_checklist', 'สร้างเช็คลิสต์ใหม่');
                        }
                    );
                    break;

                case 'delete_checklist':
                    // Delete any physical files associated first
                    db.all("SELECT filename FROM files WHERE task_id IN (SELECT id FROM tasks WHERE checklist_id = ?)", [data.id], (err, rows) => {
                        if (!err && rows) {
                            rows.forEach(r => {
                                const pPath = path.join(UPLOADS_DIR, r.filename);
                                if (fs.existsSync(pPath)) fs.unlinkSync(pPath);
                            });
                        }
                        
                        db.run("DELETE FROM checklists WHERE id = ?", [data.id], () => {
                            broadcastStateUpdate();
                        });
                    });
                    return; // Skip normal broadcast because we wait for db file cleanup above

                case 'rename_checklist':
                    db.run(
                        "UPDATE checklists SET title = ? WHERE id = ?",
                        [data.title, data.id],
                        () => {
                            insertLog(data.id, 'rename_checklist', `"${data.oldTitle}" → "${data.title}"`);
                        }
                    );
                    break;

                case 'update_desc':
                    db.run(
                        "UPDATE checklists SET description = ? WHERE id = ?",
                        [data.description, data.id],
                        () => {
                            insertLog(data.id, 'update_desc', `คำอธิบายถูกอัปเดต`);
                        }
                    );
                    break;

                case 'add_task':
                    db.run(
                        "INSERT INTO tasks (id, checklist_id, name, status, related_task_ids, x, y, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [data.task.id, data.checklistId, data.task.name, data.task.status, '[]', data.task.x || 60, data.task.y || 50, ''],
                        () => {
                            insertLog(data.checklistId, 'add_task', `"${data.task.name}"`);
                        }
                    );
                    break;

                case 'delete_task':
                    // Delete physical files
                    db.all("SELECT filename FROM files WHERE task_id = ?", [data.taskId], (err, rows) => {
                        if (!err && rows) {
                            rows.forEach(r => {
                                const pPath = path.join(UPLOADS_DIR, r.filename);
                                if (fs.existsSync(pPath)) fs.unlinkSync(pPath);
                            });
                        }
                        
                        db.run("DELETE FROM tasks WHERE id = ?", [data.taskId], () => {
                            insertLog(data.checklistId, 'delete_task', `"${data.taskName}"`);
                        });
                    });
                    break;

                case 'toggle_task_status':
                    db.run(
                        "UPDATE tasks SET status = ? WHERE id = ?",
                        [data.status, data.taskId],
                        () => {
                            const action = data.status === 'complete' ? 'complete_task' : 'revert_task';
                            const detail = data.status === 'complete' ? `"${data.taskName}" → เสร็จสิ้น` : `"${data.taskName}" → กำลังทำ`;
                            insertLog(data.checklistId, action, detail);
                        }
                    );
                    break;

                case 'rename_task':
                    db.run(
                        "UPDATE tasks SET name = ? WHERE id = ?",
                        [data.name, data.taskId],
                        () => {
                            insertLog(data.checklistId, 'rename_task', `"${data.oldName}" → "${data.name}"`);
                        }
                    );
                    break;

                case 'move_task':
                    db.run(
                        "UPDATE tasks SET x = ?, y = ? WHERE id = ?",
                        [data.x, data.y, data.taskId],
                        () => {
                            // Silently broadcast the new state to keep all clients updated
                            broadcastStateUpdate();
                        }
                    );
                    break;

                case 'update_notes':
                    db.run(
                        "UPDATE tasks SET notes = ? WHERE id = ?",
                        [data.notes, data.taskId],
                        () => {
                            insertLog(data.checklistId, 'rename_task', `อัปเดตบันทึกของ "${data.taskName}"`);
                        }
                    );
                    break;

                case 'link_related_tasks':
                    db.run(
                        "UPDATE tasks SET related_task_ids = ? WHERE id = ?",
                        [JSON.stringify(data.relatedTaskIds), data.taskId],
                        () => {
                            insertLog(data.checklistId, 'rename_task', `อัปเดตการเชื่อมโยงของ "${data.taskName}"`);
                        }
                    );
                    break;

                case 'clear_log':
                    db.run(
                        "DELETE FROM logs WHERE checklist_id = ?",
                        [data.checklistId],
                        () => {
                            broadcastStateUpdate();
                        }
                    );
                    return; // Skip normal broadcast as this doesn't log anything else

                case 'import_data':
                    console.log("Importing checklists from backup...");
                    db.serialize(() => {
                        db.run("DELETE FROM files");
                        db.run("DELETE FROM logs");
                        db.run("DELETE FROM tasks");
                        db.run("DELETE FROM checklists", (err) => {
                            if (err) {
                                console.error("Truncate error on import:", err);
                                return;
                            }
                            
                            const stmtChecklist = db.prepare("INSERT INTO checklists (id, title, description) VALUES (?, ?, ?)");
                            const stmtTask = db.prepare("INSERT INTO tasks (id, checklist_id, name, status, related_task_ids, x, y, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                            
                            data.checklists.forEach(cl => {
                                stmtChecklist.run(cl.id, cl.title, cl.description || '');
                                
                                if (Array.isArray(cl.tasks)) {
                                    cl.tasks.forEach(t => {
                                        stmtTask.run(
                                            t.id, 
                                            cl.id, 
                                            t.name, 
                                            t.status || 'during', 
                                            JSON.stringify(t.related_task_ids || []), 
                                            t.x || 0, 
                                            t.y || 0, 
                                            t.notes || ''
                                        );
                                    });
                                }
                                
                                if (Array.isArray(cl.logs)) {
                                    const stmtLog = db.prepare("INSERT INTO logs (id, checklist_id, action, detail, timestamp) VALUES (?, ?, ?, ?, ?)");
                                    cl.logs.forEach(l => {
                                        stmtLog.run(l.id, cl.id, l.action, l.detail, l.timestamp);
                                    });
                                    stmtLog.finalize();
                                }
                            });
                            
                            stmtChecklist.finalize();
                            stmtTask.finalize();
                            console.log("Backup checklists imported successfully.");
                            broadcastStateUpdate();
                        });
                    });
                    return; // Skip normal broadcast since serialize is async and calls broadcast itself
            }
        } catch (e) {
            console.error('Error handling WebSocket message:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected.');
    });
});

// Helper to insert Log & Broadcast Updates
function insertLog(checklistId, action, detail) {
    const logId = `log-${Date.now()}`;
    const timestamp = new Date().toISOString();
    db.run(
        "INSERT INTO logs (id, checklist_id, action, detail, timestamp) VALUES (?, ?, ?, ?, ?)",
        [logId, checklistId, action, detail, timestamp],
        () => {
            broadcastStateUpdate();
        }
    );
}

// Start HTTP & WebSocket server
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
