// State Management
let checklists = [];
let activeChecklistId = null;
let currentFilter = 'all'; // 'all' | 'during' | 'complete'
let uploadingTaskId = null; // Track task receiving file upload
let zoomScale = 1.0; // Current zoom scale of the 2D Mindmap canvas (50% to 200%)
let currentTheme = 'dark'; // 'dark' | 'light'

// DOM Elements
const sidebarSearch = document.getElementById('search-checklists');
const checklistListContainer = document.getElementById('checklist-list');
const btnAddChecklist = document.getElementById('btn-add-checklist');
const btnCreateFirst = document.getElementById('btn-create-first');
const emptyState = document.getElementById('empty-state');
const activeChecklistPanel = document.getElementById('active-checklist-panel');

// Active Checklist Header Details
const checklistTitle = document.getElementById('checklist-title');
const checklistDesc = document.getElementById('checklist-desc');
const btnDeleteChecklist = document.getElementById('btn-delete-checklist');

// Progress stats
const progressPercent = document.getElementById('progress-percent');
const countDuringVal = document.getElementById('count-during-val');
const countCompleteVal = document.getElementById('count-complete-val');
const progressBarFill = document.getElementById('progress-bar-fill');

// Canvas Elements
const canvasContainer = document.getElementById('canvas-container');
const canvasSvg = document.getElementById('canvas-svg');
const mindmapCanvas = document.getElementById('mindmap-canvas');
const btnAutoLayout = document.getElementById('btn-auto-layout');

// Floating Controls
const formAddTask = document.getElementById('form-add-task');
const inputTaskName = document.getElementById('input-task-name');
const taskFileInput = document.getElementById('task-file-input');
const filterBtns = document.querySelectorAll('.filter-btn');

// Activity Log Elements
const btnToggleLog = document.getElementById('btn-toggle-log');
const logBadge = document.getElementById('log-badge');
const activityLogPanel = document.getElementById('activity-log-panel');
const logTimeline = document.getElementById('log-timeline');
const noLogState = document.getElementById('no-log-state');
const btnClearLog = document.getElementById('btn-clear-log');

// Toast notice
const toast = document.getElementById('toast');

// Log Action Types with icons and labels
const LOG_ACTIONS = {
    'add_task':       { icon: '➕', label: 'เพิ่มกระดาษโน้ต', color: 'log-add' },
    'delete_task':    { icon: '🗑️', label: 'ลบแผ่นโน้ต', color: 'log-delete' },
    'complete_task':  { icon: '✅', label: 'ทำเสร็จแล้ว', color: 'log-complete' },
    'revert_task':    { icon: '🔄', label: 'เปลี่ยนกลับเป็นกำลังทำ', color: 'log-revert' },
    'rename_task':    { icon: '✏️', label: 'แก้ไขโน้ต', color: 'log-edit' },
    'rename_checklist': { icon: '📝', label: 'แก้ไขชื่อเช็คลิสต์', color: 'log-edit' },
    'update_desc':    { icon: '📋', label: 'อัปเดตคำอธิบาย', color: 'log-edit' },
    'create_checklist': { icon: '📂', label: 'สร้างเช็คลิสต์', color: 'log-add' },
};

function getISO17025ChecklistData() {
    return {
        id: 'cl-iso-17025',
        title: 'ISO-17025 Document',
        description: 'รายการเอกสารระบบบริหารงานคุณภาพห้องปฏิบัติการทดสอบและสอบเทียบ (ISO/IEC 17025:2017)',
        logs: [],
        tasks: [
            // Column 1: SD (Standard / Specification) - Foundation Documents (x = 80)
            { id: 'task-sd-401', name: 'SD-401-01 จรรยาบรรณ ความเป็นกลางและรักษาความลับ', status: 'during', related_task_ids: [], files: [], x: 80, y: 50, notes: '' },
            { id: 'task-sd-503', name: 'SD-503-01 Lab Scope', status: 'during', related_task_ids: [], files: [], x: 80, y: 280, notes: '' },
            { id: 'task-sd-505', name: 'SD-505-01 ผังโครงสร้างของฝ่ายห้องปฏิบัติการ', status: 'during', related_task_ids: [], files: [], x: 80, y: 510, notes: '' },
            { id: 'task-sd-506', name: 'SD-506-01 แต่งตั้ง Lab manager', status: 'during', related_task_ids: [], files: [], x: 80, y: 740, notes: '' },
            { id: 'task-sd-802-1', name: 'SD-802-01 นโยบายห้องปฏิบัติการ (Lab Policy)', status: 'during', related_task_ids: [], files: [], x: 80, y: 970, notes: '' },
            { id: 'task-sd-802-2', name: 'SD-802-02 ตัวชี้วัดคุณภาพ- KPI', status: 'during', related_task_ids: [], files: [], x: 80, y: 1200, notes: '' },

            // Column 2: QP (Quality Procedure) - Procedures (x = 440)
            { id: 'task-qp-401', name: 'QP-401-01 ความเป็นกลาง', status: 'during', related_task_ids: ['task-sd-401'], files: [], x: 440, y: 50, notes: '' },
            { id: 'task-qp-402', name: 'QP-402-02 การรักษาความลับของลูกค้า', status: 'during', related_task_ids: ['task-sd-401'], files: [], x: 440, y: 280, notes: '' },
            { id: 'task-qp-602', name: 'QP-602-01 ความสามารถและการฝึกอบรมบุคลากร', status: 'during', related_task_ids: [], files: [], x: 440, y: 510, notes: '' },
            { id: 'task-qp-603', name: 'QP-603-01 สิ่งอำนวยความสะดวกและภาวะแวดล้อม', status: 'during', related_task_ids: [], files: [], x: 440, y: 740, notes: '' },
            { id: 'task-qp-803', name: 'QP-803-01 Rev. 00 การควบคุมเอกสาร', status: 'during', related_task_ids: [], files: [], x: 440, y: 970, notes: '' },
            { id: 'task-qp-804', name: 'QP-804-01 การควบคุมบันทึก (Pass)', status: 'during', related_task_ids: [], files: [], x: 440, y: 1200, notes: '' },

            // Column 3: FM (Form) - Operational Forms & Records (x = 800)
            { id: 'task-fm-505', name: 'FM-505-01 Job Description', status: 'during', related_task_ids: ['task-sd-505', 'task-sd-506'], files: [], x: 800, y: 50, notes: '' },
            { id: 'task-fm-602-1', name: 'FM-602-01 แผนฝึกอบรมบุคลากรประจำปี', status: 'during', related_task_ids: ['task-qp-602'], files: [], x: 800, y: 280, notes: '' },
            { id: 'task-fm-602-2', name: 'FM-602-02 แบบประเมินผลการฝึกอบรมภายใน', status: 'during', related_task_ids: ['task-qp-602'], files: [], x: 800, y: 510, notes: '' },
            { id: 'task-fm-602-3', name: 'FM-602-03 แบบประเมินผลการฝึกอบรมในงาน (OJT)', status: 'during', related_task_ids: ['task-qp-602'], files: [], x: 800, y: 740, notes: '' },
            { id: 'task-fm-602-4', name: 'FM-602-04 แบบบันทึกประวัติการฝึกอบรมบุคลากร', status: 'during', related_task_ids: ['task-qp-602'], files: [], x: 800, y: 970, notes: '' },
            { id: 'task-fm-603-1', name: 'FM-603-01 แบบบันทึกสภาวะแวดล้อมห้องปฏิบัติการ', status: 'during', related_task_ids: ['task-qp-603'], files: [], x: 800, y: 1200, notes: '' },
            { id: 'task-fm-603-2', name: 'FM-603-02 แบบบันทึกการเข้า - ออก ห้องปฏิบัติการ', status: 'during', related_task_ids: ['task-qp-603'], files: [], x: 800, y: 1430, notes: '' }
        ]
    };
}

// Default Mock Data for first-time load
const DEFAULT_DATA = [
    getISO17025ChecklistData(),
    {
        id: 'cl-2',
        title: 'เอกสารยื่นขอวีซ่าเชงเกน',
        description: 'เอกสารจำเป็นสำหรับยื่นขอวีซ่าท่องเที่ยวกลุ่มประเทศยุโรป',
        logs: [],
        tasks: [
            { id: 'task-2-1', name: 'หนังสือเดินทาง (Passport) มีอายุมากกว่า 6 เดือน', status: 'complete', related_task_ids: [], files: [], x: 60, y: 50 },
            { id: 'task-2-2', name: 'ใบคำร้องขอวีซ่าที่กรอกข้อมูลครบถ้วน', status: 'complete', related_task_ids: ['task-2-1'], files: [], x: 380, y: 50 },
            { id: 'task-2-3', name: 'รูปถ่ายขนาด 2 นิ้ว พื้นหลังสีขาว 2 ใบ', status: 'complete', related_task_ids: ['task-2-2'], files: [], x: 700, y: 50 },
            { id: 'task-2-4', name: 'หนังสือรับรองการทำงาน (ภาษาอังกฤษ)', status: 'during', related_task_ids: [], files: [], x: 60, y: 280 },
            { id: 'task-2-5', name: 'รายการเดินบัญชีย้อนหลัง 6 เดือน (Statement)', status: 'during', related_task_ids: ['task-2-4'], files: [], x: 380, y: 280 },
            { id: 'task-2-6', name: 'กรมธรรม์ประกันภัยการเดินทาง (Travel Insurance)', status: 'during', related_task_ids: [], files: [], x: 60, y: 510 },
            { id: 'task-2-7', name: 'ตั๋วเครื่องบินและใบยืนยันการจองโรงแรม', status: 'during', related_task_ids: ['task-2-6'], files: [], x: 380, y: 510 }
        ]
    }
];

// Initialize Application
function init() {
    setupEventListeners();
    
    // Load and apply saved theme
    currentTheme = localStorage.getItem('docflow_theme') || 'dark';
    applyTheme(currentTheme);
    
    loadData();
    renderChecklists();
    
    // Select first checklist if available
    if (checklists.length > 0) {
        selectChecklist(checklists[0].id);
    } else {
        showEmptyState();
    }
}

// Theme Management
function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('docflow_theme', theme);
    
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');
    if (sunIcon && moonIcon) {
        if (theme === 'light') {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }
}

function toggleTheme() {
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(targetTheme);
}

// Load from LocalStorage
function loadData() {
    const savedData = localStorage.getItem('docflow_checklists');
    if (savedData) {
        try {
            checklists = JSON.parse(savedData);
            
            // Check if ISO-17025 checklist is present and complete
            const isoIdx = checklists.findIndex(c => c.id === 'cl-iso-17025' || c.title === 'ISO-17025 Document');
            if (isoIdx === -1) {
                // Not found at all, insert at the beginning
                checklists.unshift(getISO17025ChecklistData());
                saveData();
            } else if (checklists[isoIdx].tasks.length < 19) {
                // Found but incomplete, replace it
                checklists[isoIdx] = getISO17025ChecklistData();
                saveData();
            }

            // Schema migration and verification
            checklists.forEach(c => {
                if (!Array.isArray(c.logs)) c.logs = [];
                if (!Array.isArray(c.tasks)) c.tasks = [];
                c.tasks.forEach((t, idx) => {
                    if (!Array.isArray(t.files)) t.files = [];
                    if (!Array.isArray(t.related_task_ids)) t.related_task_ids = [];
                    if (t.notes === undefined) t.notes = '';
                    
                    // Migration: convert legacy single relation to multiple relation array
                    if (t.related_task_id) {
                        if (!t.related_task_ids.includes(t.related_task_id)) {
                            t.related_task_ids.push(t.related_task_id);
                        }
                        delete t.related_task_id;
                    }
                    if (t.related_task_id === null) {
                        delete t.related_task_id;
                    }
                    
                    // Ensure coordinates exist
                    if (t.x === undefined || t.y === undefined) {
                        t.x = 60 + (idx % 3) * 320;
                        t.y = 50 + Math.floor(idx / 3) * 230;
                    }
                });
            });
        } catch (e) {
            console.error('Error parsing local storage data', e);
            checklists = DEFAULT_DATA;
        }
    } else {
        // Migration logic for default mock data relationships
        DEFAULT_DATA.forEach(c => {
            c.tasks.forEach(t => {
                t.related_task_ids = [];
                if (t.related_task_id) {
                    t.related_task_ids.push(t.related_task_id);
                    delete t.related_task_id;
                }
            });
        });
        checklists = DEFAULT_DATA;
        saveData();
    }
}

// Save to LocalStorage
function saveData() {
    localStorage.setItem('docflow_checklists', JSON.stringify(checklists));
}

// Show Toast Alert
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Render Sidebar Checklist Cards
function renderChecklists(searchTerm = '') {
    checklistListContainer.innerHTML = '';
    
    const filtered = checklists.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filtered.length === 0) {
        checklistListContainer.innerHTML = '<div class="no-tasks-state" style="padding: 20px 0;">ไม่พบเช็คลิสต์</div>';
        return;
    }

    filtered.forEach(item => {
        const totalTasks = item.tasks.length;
        const completedTasks = item.tasks.filter(t => t.status === 'complete').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const itemEl = document.createElement('div');
        itemEl.className = `checklist-item ${item.id === activeChecklistId ? 'active' : ''}`;
        itemEl.dataset.id = item.id;
        
        itemEl.innerHTML = `
            <div class="checklist-item-title">${escapeHTML(item.title)}</div>
            <div class="checklist-item-meta">
                <span>${completedTasks}/${totalTasks} โน้ต</span>
                <div class="checklist-item-progress-bar">
                    <div class="checklist-item-progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
        
        itemEl.addEventListener('click', () => selectChecklist(item.id));
        checklistListContainer.appendChild(itemEl);
    });
}

// Select active checklist
function selectChecklist(id) {
    activeChecklistId = id;
    
    // Reset filters
    currentFilter = 'all';
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
    
    // Reset zoom scale to 100%
    zoomReset();
    
    renderActiveChecklistData();
    
    // Close log panel in sidebar
    activityLogPanel.classList.remove('open');
    btnToggleLog.classList.remove('active');
    
    // Scroll canvas to top-left on load
    canvasContainer.scrollLeft = 0;
    canvasContainer.scrollTop = 0;
}

// Renders workspace data
function renderActiveChecklistData() {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    
    if (!checklist) {
        showEmptyState();
        return;
    }
    
    emptyState.classList.add('hidden');
    activeChecklistPanel.classList.remove('hidden');
    
    // Update active highlight in sidebar list
    document.querySelectorAll('.checklist-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === activeChecklistId);
    });
    
    // Header details
    if (document.activeElement !== checklistTitle) {
        checklistTitle.textContent = checklist.title;
    }
    const collapsedTitleEl = document.getElementById('collapsed-active-title');
    if (collapsedTitleEl) {
        collapsedTitleEl.textContent = checklist.title;
    }
    if (document.activeElement !== checklistDesc) {
        checklistDesc.textContent = checklist.description || 'ไม่มีคำอธิบาย';
    }
    
    renderTasks();
    
    if (activityLogPanel.classList.contains('open')) {
        renderActivityLog();
    }
    updateLogBadge();
}

// Show Empty State UI
function showEmptyState() {
    activeChecklistId = null;
    activeChecklistPanel.classList.add('hidden');
    emptyState.classList.remove('hidden');
    renderChecklists();
}

// Render Tasks as Notepad cards
function renderTasks() {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    if (!checklist) return;
    
    mindmapCanvas.innerHTML = '';
    
    const tasks = checklist.tasks;
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'complete').length;
    const during = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Update statistics header
    progressPercent.textContent = `${progress}% สำเร็จ`;
    countDuringVal.textContent = during;
    countCompleteVal.textContent = completed;
    progressBarFill.style.width = `${progress}%`;
    
    // Filter Tasks
    let filteredTasks = tasks;
    if (currentFilter === 'during') {
        filteredTasks = tasks.filter(t => t.status === 'during');
    } else if (currentFilter === 'complete') {
        filteredTasks = tasks.filter(t => t.status === 'complete');
    }
    
    filteredTasks.forEach(task => {
        const cardEl = document.createElement('div');
        cardEl.className = `notepad-card ${task.status === 'complete' ? 'is-complete' : ''}`;
        cardEl.id = task.id;
        cardEl.style.left = `${task.x}px`;
        cardEl.style.top = `${task.y}px`;
        
        // Give notes a slight random rotation based on their ID hash
        const hash = task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const rotation = ((hash % 30) - 15) / 10; // -1.5deg to +1.5deg
        cardEl.style.transform = `rotate(${rotation}deg)`;
        
        const isComplete = task.status === 'complete';
        const toggleClass = isComplete ? 'complete' : 'during';
        const statusLabel = isComplete ? 'Complete' : 'During';
        
        const checkIcon = isComplete ? `
            <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        ` : `
            <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <circle cx="12" cy="12" r="10"></circle>
            </svg>
        `;
        
        // Files attachments list
        let filesHTML = '';
        if (task.files && task.files.length > 0) {
            filesHTML = `
                <div class="notepad-files-list">
                    ${task.files.map(file => `
                        <div class="notepad-file-item">
                            <a href="${file.path}" download="${escapeHTML(file.original_name)}" class="notepad-file-link" title="ดาวน์โหลดไฟล์: ${escapeHTML(file.original_name)}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                </svg>
                                <span class="file-pill-name">${escapeHTML(file.original_name)}</span>
                            </a>
                            <button class="btn-file-delete" data-file-id="${file.id}" title="ลบไฟล์">✕</button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Build multiple related document checklist selector
        const otherTasks = tasks.filter(t => t.id !== task.id);
        const isLinked = (id) => task.related_task_ids && task.related_task_ids.includes(id);
        const optionsHTML = otherTasks.length === 0
            ? `<div style="padding: 6px; font-size: 11px; color: var(--text-muted);">ไม่มีเอกสารอื่นๆ เพื่อเชื่อมโยง</div>`
            : otherTasks.map(ot => `
                <label class="multi-select-option-item">
                    <input type="checkbox" value="${ot.id}" ${isLinked(ot.id) ? 'checked' : ''}>
                    <span>${escapeHTML(ot.name)}</span>
                </label>
            `).join('');
            
        const activeLinkCount = task.related_task_ids ? task.related_task_ids.length : 0;

        cardEl.innerHTML = `
            <!-- Drag Handle Area -->
            <div class="notepad-drag-handle" title="คลิกลากเพื่อย้ายการ์ดกระดาษโน้ต">
                <div class="drag-dots"></div>
            </div>
            
            <div class="notepad-body">
                <!-- Notepad Header Row -->
                <div class="notepad-header-row">
                    <div class="notepad-status-btn ${toggleClass}" title="คลิกเพื่อสลับสถานะ">
                        ${checkIcon}
                        <span>${statusLabel}</span>
                    </div>
                    <button class="btn-notepad-delete" title="ลบกระดาษโน้ตนี้">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- Title text -->
                <div class="notepad-title-text" contenteditable="true" title="คลิกเพื่อแก้ไขข้อความ">${escapeHTML(task.name)}</div>
                
                <!-- Notes text area -->
                <div class="notepad-note-text" contenteditable="true" placeholder="เขียนบันทึกย่อเพิ่มเติม..." title="คลิกเพื่อแก้ไขบันทึกข้อความ">${escapeHTML(task.notes || '')}</div>
                
                <div class="notepad-divider"></div>
                
                <!-- References Linkage Dropdown (Multi-select) -->
                <div class="notepad-ref-area">
                    <span class="notepad-ref-label">🔗 เส้นโยงอ้างอิงเอกสาร:</span>
                    <div class="multi-select-dropdown-wrapper">
                        <button class="multi-select-trigger-btn">เชื่อมโยงเอกสาร (${activeLinkCount})</button>
                        <div class="multi-select-options hidden">
                            ${optionsHTML}
                        </div>
                    </div>
                </div>
                
                <div class="notepad-divider"></div>
                
                <!-- File Attachments Area -->
                <div class="notepad-files-area">
                    <div class="notepad-files-header">
                        <span>📎 ไฟล์แนบ:</span>
                        <button class="btn-notepad-attach" title="แนบไฟล์เข้าแผ่นโน้ต">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>เพิ่มไฟล์</span>
                        </button>
                    </div>
                    ${filesHTML}
                </div>
            </div>
        `;
        
        // --- Notepad Card Event Listeners ---
        
        // Drag Setup
        const dragHandle = cardEl.querySelector('.notepad-drag-handle');
        dragHandle.addEventListener('mousedown', (e) => startDrag(e, task, cardEl));
        
        // Click to toggle status
        const statusBtn = cardEl.querySelector('.notepad-status-btn');
        statusBtn.addEventListener('click', () => toggleTaskStatus(task.id));
        
        // Delete notepad card click
        const btnDelete = cardEl.querySelector('.btn-notepad-delete');
        btnDelete.addEventListener('click', () => {
            if (confirm(`คุณต้องการลบกระดาษโน้ต "${task.name}" หรือไม่?`)) {
                checklist.tasks = checklist.tasks.filter(t => t.id !== task.id);
                // Reset links referencing this note
                checklist.tasks.forEach(t => {
                    if (Array.isArray(t.related_task_ids)) {
                        t.related_task_ids = t.related_task_ids.filter(id => id !== task.id);
                    }
                });
                addLogEntry('delete_task', `"${task.name}"`);
                saveData();
                renderActiveChecklistData();
                renderChecklists(sidebarSearch.value);
                showToast('ลบกระดาษโน้ตเรียบร้อยแล้ว');
            }
        });
        
        // Edit task name
        const titleText = cardEl.querySelector('.notepad-title-text');
        titleText.addEventListener('blur', (e) => {
            const cleaned = e.target.textContent.trim();
            if (cleaned && cleaned !== task.name) {
                const oldName = task.name;
                task.name = cleaned;
                addLogEntry('rename_task', `"${oldName}" → "${cleaned}"`);
                saveData();
                drawConnections(); // Redraw in case layout sizes shifted slightly
                showToast('แก้ไขข้อความโน้ตแล้ว');
            } else {
                e.target.textContent = task.name;
            }
        });
        titleText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleText.blur();
            }
        });
        
        // Edit task notes (multiline supported)
        const noteText = cardEl.querySelector('.notepad-note-text');
        noteText.addEventListener('blur', (e) => {
            const cleaned = e.target.innerText.trim();
            if (cleaned !== (task.notes || '')) {
                task.notes = cleaned;
                addLogEntry('rename_task', `อัปเดตบันทึกของ "${task.name}"`);
                saveData();
                showToast('อัปเดตบันทึกโน้ตย่อแล้ว');
            }
        });
        
        // Reference dropdown multi-select toggle
        const triggerBtn = cardEl.querySelector('.multi-select-trigger-btn');
        const optionsContainer = cardEl.querySelector('.multi-select-options');
        
        triggerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid triggering card selection click
            // Close other open multi-selects first to stay clean
            document.querySelectorAll('.multi-select-options').forEach(el => {
                if (el !== optionsContainer) el.classList.add('hidden');
            });
            optionsContainer.classList.toggle('hidden');
        });
        
        // Prevent click inside options container from closing it or dragging the card
        optionsContainer.addEventListener('mousedown', (e) => e.stopPropagation());
        optionsContainer.addEventListener('click', (e) => e.stopPropagation());
        
        // Document click listener to close open option dropdowns
        const closeDropdowns = () => optionsContainer.classList.add('hidden');
        document.addEventListener('click', closeDropdowns);
        
        // Bind change listeners to checkboxes
        optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const val = e.target.value;
                if (!task.related_task_ids) task.related_task_ids = [];
                
                if (e.target.checked) {
                    if (!task.related_task_ids.includes(val)) {
                        task.related_task_ids.push(val);
                    }
                    const ot = otherTasks.find(o => o.id === val);
                    addLogEntry('rename_task', `ลากเส้นเชื่อมโยง: "${task.name}" → "${ot.name}"`);
                } else {
                    task.related_task_ids = task.related_task_ids.filter(id => id !== val);
                    const ot = otherTasks.find(o => o.id === val);
                    addLogEntry('rename_task', `ยกเลิกการเชื่อมโยง: "${task.name}" → "${ot.name}"`);
                }
                
                triggerBtn.textContent = `เชื่อมโยงเอกสาร (${task.related_task_ids.length})`;
                saveData();
                drawConnections();
            });
        });
        
        // Attach File click trigger
        const btnAttach = cardEl.querySelector('.btn-notepad-attach');
        btnAttach.addEventListener('click', () => {
            uploadingTaskId = task.id;
            taskFileInput.click();
        });
        
        // Delete attached file
        cardEl.querySelectorAll('.btn-file-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.target.dataset.fileId;
                if (confirm('คุณต้องการลบไฟล์แนบนี้ออกหรือไม่?')) {
                    deleteAttachedFile(task.id, fileId);
                }
            });
        });
        
        mindmapCanvas.appendChild(cardEl);
    });

    // Draw SVG connections between notes
    setTimeout(drawConnections, 50); // Timeout allows cards to render in DOM to read layout dimensions
}

// --- Drag & Drop Core Logic ---
function startDrag(e, task, cardEl) {
    if (e.button !== 0) return; // Only drag with left click
    
    // Prevent default selection text behavior during dragging
    e.preventDefault();
    
    cardEl.classList.add('dragging');
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = task.x;
    const startTop = task.y;
    
    function mouseMoveHandler(e) {
        const dx = (e.clientX - startX) / zoomScale;
        const dy = (e.clientY - startY) / zoomScale;
        
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        
        // Clamp bounds relative to the 3000px canvas size
        newLeft = Math.max(0, Math.min(2740, newLeft));
        newTop = Math.max(0, Math.min(2740, newTop));
        
        task.x = newLeft;
        task.y = newTop;
        
        cardEl.style.left = `${newLeft}px`;
        cardEl.style.top = `${newTop}px`;
        
        // Instantly update SVG connections while dragging
        drawConnections();
    }
    
    function mouseUpHandler() {
        cardEl.classList.remove('dragging');
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
        
        saveData();
    }
    
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
}

// --- SVG Connection Lines Drawing ---
function drawConnections() {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    if (!checklist) return;
    
    // Clear old lines
    const oldPaths = canvasSvg.querySelectorAll('.connection-path');
    oldPaths.forEach(p => p.remove());
    
    const tasks = checklist.tasks;
    const cardWidth = 260; // Fixed width from CSS (.notepad-card)
    
    tasks.forEach(task => {
        if (!task.related_task_ids || task.related_task_ids.length === 0) return;
        
        task.related_task_ids.forEach(targetId => {
            const targetTask = tasks.find(t => t.id === targetId);
            if (!targetTask) return;
            
            // Locate elements in DOM to read actual heights
            const sourceEl = document.getElementById(task.id);
            const targetEl = document.getElementById(targetTask.id);
            if (!sourceEl || !targetEl) return;
            
            const h1 = sourceEl.offsetHeight || 160;
            const h2 = targetEl.offsetHeight || 160;
            
            let x1, y1, x2, y2;
            
            // Smart docking calculation: Connect borders based on relative positions
            if (targetTask.x > task.x + cardWidth + 20) {
                // Target note is on the right
                x1 = task.x + cardWidth;
                y1 = task.y + h1 / 2;
                x2 = targetTask.x;
                y2 = targetTask.y + h2 / 2;
            } else if (targetTask.x + cardWidth + 20 < task.x) {
                // Target note is on the left
                x1 = task.x;
                y1 = task.y + h1 / 2;
                x2 = targetTask.x + cardWidth;
                y2 = targetTask.y + h2 / 2;
            } else if (targetTask.y > task.y + h1) {
                // Target note is below
                x1 = task.x + cardWidth / 2;
                y1 = task.y + h1;
                x2 = targetTask.x + cardWidth / 2;
                y2 = targetTask.y;
            } else {
                // Target note is above
                x1 = task.x + cardWidth / 2;
                y1 = task.y;
                x2 = targetTask.x + cardWidth / 2;
                y2 = targetTask.y + h2;
            }
            
            // Create SVG path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const isComplete = targetTask.status === 'complete';
            const colorClass = isComplete ? 'complete' : 'during';
            
            path.setAttribute('class', `connection-path ${colorClass}`);
            path.setAttribute('marker-end', `url(#arrow-${colorClass})`);
            
            // Draw smooth Bezier curve
            const dx = x2 - x1;
            const cp1_x = x1 + dx / 2;
            const cp1_y = y1;
            const cp2_x = x1 + dx / 2;
            const cp2_y = y2;
            
            path.setAttribute('d', `M ${x1} ${y1} C ${cp1_x} ${cp1_y}, ${cp2_x} ${cp2_y}, ${x2} ${y2}`);
            canvasSvg.appendChild(path);
        });
    });
}

// --- Canvas Zoom Management ---
function setZoom(scale) {
    zoomScale = Math.max(0.5, Math.min(2.0, scale));
    const zoomWrapper = document.getElementById('canvas-zoom-wrapper');
    if (zoomWrapper) {
        zoomWrapper.style.transform = `scale(${zoomScale})`;
    }
    const zoomText = document.getElementById('zoom-text');
    if (zoomText) {
        zoomText.textContent = `${Math.round(zoomScale * 100)}%`;
    }
    // Redraw connections immediately after transform to fix scaling visual offsets
    drawConnections();
}

function zoomIn() {
    setZoom(zoomScale + 0.1);
}

function zoomOut() {
    setZoom(zoomScale - 0.1);
}

function zoomReset() {
    setZoom(1.0);
}

// --- Auto Grid Layout helper ---
function applyAutoLayout() {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    if (!checklist || checklist.tasks.length === 0) return;
    
    if (confirm('คุณแน่ใจไหมว่าต้องการจัดวางกระดาษโน้ตทั้งหมดใหม่เป็นแบบกริด?')) {
        const tasks = checklist.tasks;
        tasks.forEach((task, idx) => {
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            task.x = 60 + col * 320;
            task.y = 50 + row * 240;
        });
        
        saveData();
        renderActiveChecklistData();
        showToast('จัดวางกระดาษโน้ตใหม่แบบกริดแล้ว');
    }
}

// Upload file: FileReader Base64 Offline API
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !uploadingTaskId || !activeChecklistId) return;

    // Check size limit (1.5MB = 1572864 bytes)
    if (file.size > 1.5 * 1024 * 1024) {
        showToast('ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 1.5MB สำหรับรุ่นออฟไลน์เดโม)');
        taskFileInput.value = '';
        uploadingTaskId = null;
        return;
    }

    showToast('กำลังแนบไฟล์ออฟไลน์...');

    const reader = new FileReader();
    reader.onload = function(evt) {
        const base64Data = evt.target.result;
        
        const checklist = checklists.find(c => c.id === activeChecklistId);
        if (!checklist) return;
        
        const task = checklist.tasks.find(t => t.id === uploadingTaskId);
        if (!task) return;
        
        if (!task.files) task.files = [];
        
        const fileId = `file-${Date.now()}`;
        task.files.push({
            id: fileId,
            original_name: file.name,
            size: file.size,
            mime_type: file.type,
            path: base64Data
        });
        
        addLogEntry('add_task', `แนบไฟล์ "${file.name}"`);
        
        saveData();
        renderActiveChecklistData();
        
        showToast('แนบไฟล์เอกสารสำเร็จแล้ว');
        
        // Reset file input
        taskFileInput.value = '';
        uploadingTaskId = null;
    };
    
    reader.onerror = function() {
        showToast('ไม่สามารถแนบไฟล์นี้ได้');
        taskFileInput.value = '';
        uploadingTaskId = null;
    };
    
    reader.readAsDataURL(file);
}

// Delete attached file offline
function deleteAttachedFile(taskId, fileId) {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    if (!checklist) return;
    
    const task = checklist.tasks.find(t => t.id === taskId);
    if (!task || !task.files) return;
    
    const file = task.files.find(f => f.id === fileId);
    const filename = file ? file.original_name : 'ไม่ทราบชื่อ';
    
    task.files = task.files.filter(f => f.id !== fileId);
    
    addLogEntry('delete_task', `ลบไฟล์แนบ "${filename}"`);
    
    saveData();
    renderActiveChecklistData();
    showToast('ลบไฟล์แนบเรียบร้อย');
}

// Toggle Task Status
function toggleTaskStatus(taskId) {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    if (!checklist) return;
    
    const task = checklist.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.status = task.status === 'during' ? 'complete' : 'during';
    
    // Log status change
    if (task.status === 'complete') {
        addLogEntry('complete_task', `"${task.name}" → เสร็จสิ้น`);
    } else {
        addLogEntry('revert_task', `"${task.name}" → กำลังทำ`);
    }

    saveData();
    renderActiveChecklistData();
    renderChecklists(sidebarSearch.value);
}

// Add Checklist
function addNewChecklist() {
    const newId = `cl-${Date.now()}`;
    const newChecklist = {
        id: newId,
        title: 'เช็คลิสต์ใหม่ที่ไม่มีชื่อ',
        description: 'คำอธิบายสั้นๆ เกี่ยวกับเอกสารชุดนี้',
        logs: [],
        tasks: []
    };
    
    checklists.unshift(newChecklist);
    activeChecklistId = newId;
    
    addLogEntry('create_checklist', 'สร้างเช็คลิสต์ใหม่');
    saveData();
    renderChecklists(sidebarSearch.value);
    renderActiveChecklistData();
    
    showToast('สร้างเช็คลิสต์ใหม่แล้ว');
    
    // Focus title for direct editing
    setTimeout(() => {
        checklistTitle.focus();
        const range = document.createRange();
        range.selectNodeContents(checklistTitle);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }, 100);
}

// Delete Checklist
function deleteChecklist() {
    if (!activeChecklistId) return;
    
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเช็คลิสต์นี้? เอกสารและไฟล์แนบย่อยทั้งหมดจะถูกลบออกถาวร')) {
        checklists = checklists.filter(c => c.id !== activeChecklistId);
        saveData();
        showToast('ลบเช็คลิสต์เรียบร้อยแล้ว');
        
        if (checklists.length > 0) {
            selectChecklist(checklists[0].id);
        } else {
            showEmptyState();
        }
    }
}

// Activity Log: Add Log entry helper
function addLogEntry(action, detail) {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    if (!checklist) return;
    
    if (!checklist.logs) checklist.logs = [];
    
    const entry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        action: action,
        detail: detail,
        timestamp: new Date().toISOString()
    };
    
    checklist.logs.unshift(entry);
    if (checklist.logs.length > 100) {
        checklist.logs = checklist.logs.slice(0, 100);
    }
    
    updateLogBadge();
}

// Activity Log: Format relative time
function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'เมื่อสักครู่';
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Activity Log: Update badge count
function updateLogBadge() {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    if (!checklist || !checklist.logs) {
        logBadge.textContent = '0';
        logBadge.classList.remove('has-items');
        return;
    }

    const count = checklist.logs.length;
    logBadge.textContent = count > 99 ? '99+' : count;
    logBadge.classList.toggle('has-items', count > 0);
}

// Activity Log: Render log timeline panel
function renderActivityLog() {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    if (!checklist) return;

    logTimeline.innerHTML = '';

    if (!checklist.logs || checklist.logs.length === 0) {
        noLogState.classList.remove('hidden');
        logTimeline.classList.add('hidden');
        return;
    }

    noLogState.classList.add('hidden');
    logTimeline.classList.remove('hidden');

    // Group logs by date
    const groups = {};
    checklist.logs.forEach(entry => {
        const dateKey = new Date(entry.timestamp).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(entry);
    });

    Object.entries(groups).forEach(([dateLabel, entries]) => {
        const groupHeader = document.createElement('div');
        groupHeader.className = 'log-date-group';
        groupHeader.innerHTML = `<span class="log-date-label">${dateLabel}</span>`;
        logTimeline.appendChild(groupHeader);

        entries.forEach((entry, idx) => {
            const actionInfo = LOG_ACTIONS[entry.action] || { icon: '📌', label: entry.action, color: 'log-edit' };
            const entryEl = document.createElement('div');
            entryEl.className = `log-entry ${actionInfo.color}`;
            entryEl.style.animationDelay = `${idx * 0.04}s`;

            const time = new Date(entry.timestamp).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
            });

            entryEl.innerHTML = `
                <div class="log-entry-icon">${actionInfo.icon}</div>
                <div class="log-entry-content">
                    <div class="log-entry-action">${actionInfo.label}</div>
                    <div class="log-entry-detail">${escapeHTML(entry.detail)}</div>
                </div>
                <div class="log-entry-time">${time}</div>
            `;

            logTimeline.appendChild(entryEl);
        });
    });

    updateLogBadge();
}

// Toggle activity log panel inside the sidebar
function toggleLogPanel() {
    const isOpen = activityLogPanel.classList.contains('open');
    activityLogPanel.classList.toggle('open', !isOpen);
    btnToggleLog.classList.toggle('active', !isOpen);

    if (!isOpen) {
        renderActivityLog();
    }
}

// Clear all logs on local checklist
function clearLog() {
    const checklist = checklists.find(c => c.id === activeChecklistId);
    if (!checklist) return;

    if (confirm('คุณแน่ใจหรือว่าต้องการล้างประวัติการแก้ไขทั้งหมดสำหรับเช็คลิสต์นี้?')) {
        checklist.logs = [];
        saveData();
        renderActivityLog();
        updateLogBadge();
        showToast('ล้างประวัติการแก้ไขแล้ว');
    }
}

// Event Listeners setup
function setupEventListeners() {
    // Add checklist button
    btnAddChecklist.addEventListener('click', addNewChecklist);
    btnCreateFirst.addEventListener('click', addNewChecklist);
    
    // Delete checklist button
    btnDeleteChecklist.addEventListener('click', deleteChecklist);
    
    // Search checklists input
    sidebarSearch.addEventListener('input', (e) => {
        renderChecklists(e.target.value);
    });
    
    // Edit Checklist Title in header
    checklistTitle.addEventListener('blur', (e) => {
        const checklist = checklists.find(c => c.id === activeChecklistId);
        if (!checklist) return;
        
        const newTitle = e.target.textContent.trim();
        if (newTitle && newTitle !== checklist.title) {
            const oldTitle = checklist.title;
            checklist.title = newTitle;
            addLogEntry('rename_checklist', `"${oldTitle}" → "${newTitle}"`);
            saveData();
            renderChecklists(sidebarSearch.value);
            renderActiveChecklistData();
            showToast('อัปเดตชื่อเช็คลิสต์แล้ว');
        } else {
            e.target.textContent = checklist.title;
        }
    });
    
    checklistTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            checklistTitle.blur();
        }
    });
    
    // Edit Checklist Description in header
    checklistDesc.addEventListener('blur', (e) => {
        const checklist = checklists.find(c => c.id === activeChecklistId);
        if (!checklist) return;
        
        const newDesc = e.target.textContent.trim();
        if (newDesc !== checklist.description) {
            checklist.description = newDesc;
            addLogEntry('update_desc', `คำอธิบายถูกอัปเดต`);
            saveData();
            renderActiveChecklistData();
            showToast('อัปเดตคำอธิบายแล้ว');
        }
    });
    
    checklistDesc.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            checklistDesc.blur();
        }
    });
    
    // Add Task Form submission
    formAddTask.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const checklist = checklists.find(c => c.id === activeChecklistId);
        if (!checklist) return;
        
        const taskName = inputTaskName.value.trim();
        if (!taskName) return;
        
        // Random layout position inside center-ish of current viewport container
        const currentScrollLeft = canvasContainer.scrollLeft;
        const currentScrollTop = canvasContainer.scrollTop;
        const center_x = currentScrollLeft + (canvasContainer.offsetWidth / 2) - 130 + (Math.random() * 40 - 20);
        const center_y = currentScrollTop + (canvasContainer.offsetHeight / 2) - 100 + (Math.random() * 40 - 20);
        
        const newTask = {
            id: `task-${Date.now()}`,
            name: taskName,
            status: 'during',
            related_task_id: null,
            files: [],
            x: Math.max(50, Math.min(2700, center_x)),
            y: Math.max(50, Math.min(2700, center_y))
        };
        
        checklist.tasks.push(newTask);
        
        addLogEntry('add_task', `"${taskName}"`);
        saveData();
        
        inputTaskName.value = '';
        renderActiveChecklistData();
        renderChecklists(sidebarSearch.value);
        showToast('เพิ่มแผ่นโน้ตใหม่แล้ว');
    });

    // File input change (triggers upload)
    taskFileInput.addEventListener('change', handleFileUpload);
    
    // Filter tabs click handlers
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    // Auto layout button click
    btnAutoLayout.addEventListener('click', applyAutoLayout);
    
    // Log timeline toggle and clear handlers
    btnToggleLog.addEventListener('click', toggleLogPanel);
    btnClearLog.addEventListener('click', clearLog);

    // Sidebar collapse/expand toggle
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            const container = document.querySelector('.app-container');
            container.classList.toggle('sidebar-collapsed');
            // Redraw connections after sidebar sliding transition completes
            setTimeout(drawConnections, 350);
        });
    }

    const btnSidebarExpand = document.getElementById('btn-sidebar-expand');
    if (btnSidebarExpand) {
        btnSidebarExpand.addEventListener('click', () => {
            const container = document.querySelector('.app-container');
            container.classList.remove('sidebar-collapsed');
            setTimeout(drawConnections, 350);
        });
    }

    const collapsedActiveTitle = document.getElementById('collapsed-active-title');
    if (collapsedActiveTitle) {
        collapsedActiveTitle.addEventListener('click', () => {
            const container = document.querySelector('.app-container');
            container.classList.remove('sidebar-collapsed');
            setTimeout(drawConnections, 350);
        });
    }

    // Zoom Buttons Click Listeners
    document.getElementById('btn-zoom-in').addEventListener('click', zoomIn);
    document.getElementById('btn-zoom-out').addEventListener('click', zoomOut);
    document.getElementById('btn-zoom-reset').addEventListener('click', zoomReset);

    // Zoom on Ctrl + Mouse Wheel Scroll
    canvasContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault(); // Stop native page scaling
            if (e.deltaY < 0) {
                setZoom(zoomScale + 0.05); // Zoom In
            } else {
                setZoom(zoomScale - 0.05); // Zoom Out
            }
        }
    }, { passive: false });

    // Theme Toggle Click Listener
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', toggleTheme);
    }
}

// XSS Escape Helper
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Start application on page load
window.addEventListener('DOMContentLoaded', init);
