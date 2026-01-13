import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, set, remove, onDisconnect, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyDoMF-1vjmfbVZ1GMtJdYQyvo32dtMleLQ",
    authDomain: "live-sync-classroom.firebaseapp.com",
    databaseURL: "https://live-sync-classroom-default-rtdb.firebaseio.com",
    projectId: "live-sync-classroom",
    storageBucket: "live-sync-classroom.firebasestorage.app",
    messagingSenderId: "358193733860",
    appId: "1:358193733860:web:8899c2c4a21e17eacf0cf1"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const notesRef = ref(database, 'notes');
const usersRef = ref(database, 'users');

const colors = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];
let selectedColor = colors[Math.floor(Math.random() * colors.length)];
let draggedNote = null;
let userId = 'user_' + Math.random().toString(36).substr(2, 9);

let currentZoom = 1;
const minZoom = 0.3;
const maxZoom = 2;
const zoomStep = 0.1;

function init() {
    setupColorPicker();
    setupUserPresence();
    listenToNotes();
    setupBoardDragDrop();
    setupZoom();
    detectMobileAndSetZoom();
    setupBoardPanning();
}

function setupColorPicker() {
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.color-btn.active').classList.remove('active');
            btn.classList.add('active');
            selectedColor = btn.dataset.color;
        });
    });
}

function setupUserPresence() {
    const userPresenceRef = ref(database, `users/${userId}`);
    set(userPresenceRef, { online: true, timestamp: Date.now() });
    
    onDisconnect(userPresenceRef).remove();
    
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        const count = users ? Object.keys(users).length : 0;
        document.getElementById('userCount').textContent = count;
    });
}

function listenToNotes() {
    onValue(notesRef, (snapshot) => {
        const notes = snapshot.val();
        const boardContent = document.getElementById('boardContent');
        const emptyState = document.getElementById('emptyState');
        
        if (!notes || Object.keys(notes).length === 0) {
            boardContent.querySelectorAll('.sticky-note').forEach(note => note.remove());
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const existingNotes = new Set(
            Array.from(boardContent.querySelectorAll('.sticky-note')).map(el => el.dataset.id)
        );
        
        Object.entries(notes).forEach(([id, note]) => {
            if (existingNotes.has(id)) {
                updateNoteElement(id, note);
                existingNotes.delete(id);
            } else {
                createNoteElement(id, note);
            }
        });
        
        existingNotes.forEach(id => {
            const noteEl = boardContent.querySelector(`[data-id="${id}"]`);
            if (noteEl) noteEl.remove();
        });
    });
}

function updateNoteElement(id, note) {
    const noteEl = document.querySelector(`[data-id="${id}"]`);
    if (!noteEl) return;
    
    const textarea = noteEl.querySelector('.note-content');
    if (document.activeElement !== textarea && textarea.value !== note.content) {
        textarea.value = note.content || '';
    }
    
    if (noteEl.style.left !== note.x + 'px') {
        noteEl.style.left = note.x + 'px';
    }
    if (noteEl.style.top !== note.y + 'px') {
        noteEl.style.top = note.y + 'px';
    }
    
    const currentColor = Array.from(noteEl.classList).find(c => c.startsWith('note-'));
    const newColor = 'note-' + note.color;
    if (currentColor !== newColor) {
        noteEl.classList.remove(currentColor);
        noteEl.classList.add(newColor);
    }
}

function createNote() {
    const noteId = push(notesRef).key;
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const scrollTop = board.scrollTop;
    const scrollLeft = board.scrollLeft;
    
    const note = {
        content: '',
        color: randomColor,
        x: scrollLeft + Math.random() * 800,
        y: scrollTop + Math.random() * 600,
        timestamp: Date.now()
    };
    
    set(ref(database, `notes/${noteId}`), note);
}

function createNoteElement(id, note) {
    const boardContent = document.getElementById('boardContent');
    const noteEl = document.createElement('div');
    noteEl.className = `sticky-note note-${note.color}`;
    noteEl.style.left = note.x + 'px';
    noteEl.style.top = note.y + 'px';
    noteEl.dataset.id = id;
    noteEl.draggable = true;
    
    noteEl.innerHTML = `
        <div class="note-header">
            <button class="drag-btn" data-id="${id}">✋</button>
            <button class="delete-btn" onclick="deleteNote('${id}')">×</button>
        </div>
        <textarea class="note-content" placeholder="Escribe aquí...">${note.content || ''}</textarea>
    `;
    
    const textarea = noteEl.querySelector('.note-content');
    textarea.addEventListener('input', (e) => {
        set(ref(database, `notes/${id}/content`), e.target.value);
    });
    
    noteEl.addEventListener('dragstart', handleDragStart);
    noteEl.addEventListener('dragend', handleDragEnd);
    
    const dragBtn = noteEl.querySelector('.drag-btn');
    setupTouchDrag(noteEl, dragBtn, id);
    
    boardContent.appendChild(noteEl);
}

function setupBoardDragDrop() {
    const board = document.getElementById('board');
    
    board.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    board.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedNote) return;
        
        const boardRect = board.getBoundingClientRect();
        const scrollTop = board.scrollTop;
        const scrollLeft = board.scrollLeft;
        
        const x = (e.clientX - boardRect.left + scrollLeft) / currentZoom - 110;
        const y = (e.clientY - boardRect.top + scrollTop) / currentZoom - 90;
        
        const noteId = draggedNote.dataset.id;
        set(ref(database, `notes/${noteId}/x`), Math.max(0, x));
        set(ref(database, `notes/${noteId}/y`), Math.max(0, y));
    });
}

function handleDragStart(e) {
    draggedNote = e.target;
    e.target.classList.add('dragging');
    const ghost = e.target.cloneNode(true);
    ghost.style.transform = `scale(${1/currentZoom})`;
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 110, 90);
    setTimeout(() => ghost.remove(), 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedNote = null;
}

function setupTouchDrag(noteEl, dragBtn, noteId) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    dragBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDragging = true;
        noteEl.classList.add('dragging');
        
        const touch = e.touches[0];
        const board = document.getElementById('board');
        const boardRect = board.getBoundingClientRect();
        
        startX = touch.clientX;
        startY = touch.clientY;
        
        const noteRect = noteEl.getBoundingClientRect();
        initialX = (noteRect.left - boardRect.left + board.scrollLeft) / currentZoom;
        initialY = (noteRect.top - boardRect.top + board.scrollTop) / currentZoom;
    });
    
    dragBtn.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const deltaX = (touch.clientX - startX) / currentZoom;
        const deltaY = (touch.clientY - startY) / currentZoom;
        
        const newX = Math.max(0, initialX + deltaX);
        const newY = Math.max(0, initialY + deltaY);
        
        noteEl.style.left = newX + 'px';
        noteEl.style.top = newY + 'px';
    });
    
    dragBtn.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        isDragging = false;
        noteEl.classList.remove('dragging');
        
        const x = parseFloat(noteEl.style.left);
        const y = parseFloat(noteEl.style.top);
        
        set(ref(database, `notes/${noteId}/x`), x);
        set(ref(database, `notes/${noteId}/y`), y);
    });
}

window.deleteNote = function(noteId) {
    if (confirm('¿Eliminar esta nota?')) {
        remove(ref(database, `notes/${noteId}`));
    }
}

window.createNote = createNote;

function setupBoardPanning() {
    const board = document.getElementById('board');
    let isPanning = false;
    let startX, startY, scrollLeft, scrollTop;
    
    board.addEventListener('mousedown', (e) => {
        if (e.target === board || e.target.id === 'boardContent' || e.target.classList.contains('empty-state')) {
            isPanning = true;
            board.style.cursor = 'grabbing';
            startX = e.pageX - board.offsetLeft;
            startY = e.pageY - board.offsetTop;
            scrollLeft = board.scrollLeft;
            scrollTop = board.scrollTop;
        }
    });
    
    board.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - board.offsetLeft;
        const y = e.pageY - board.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        board.scrollLeft = scrollLeft - walkX;
        board.scrollTop = scrollTop - walkY;
    });
    
    board.addEventListener('mouseup', () => {
        isPanning = false;
        board.style.cursor = 'grab';
    });
    
    board.addEventListener('mouseleave', () => {
        isPanning = false;
        board.style.cursor = 'grab';
    });
}

function setupZoom() {
    const boardContent = document.getElementById('boardContent');
    
    let initialDistance = 0;
    let initialZoom = 1;
    
    boardContent.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches[0], e.touches[1]);
            initialZoom = currentZoom;
        }
    });
    
    boardContent.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const distance = getDistance(e.touches[0], e.touches[1]);
            const scale = distance / initialDistance;
            setZoom(initialZoom * scale);
        }
    }, { passive: false });
}

function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function detectMobileAndSetZoom() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        setZoom(0.5);
    }
}

function setZoom(zoom) {
    currentZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    const boardContent = document.getElementById('boardContent');
    boardContent.style.transform = `scale(${currentZoom})`;
    boardContent.style.transformOrigin = '0 0';
    
    boardContent.style.width = `${100 / currentZoom}%`;
    boardContent.style.height = `${100 / currentZoom}%`;
    
    updateZoomDisplay();
}

function updateZoomDisplay() {
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
    }
}

window.zoomIn = function() {
    setZoom(currentZoom + zoomStep);
}

window.zoomOut = function() {
    setZoom(currentZoom - zoomStep);
}

window.resetZoom = function() {
    setZoom(1);
}

init();
