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

// Sistema de zoom
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
    
    // Color random de todos los disponibles
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Posición que considere el scroll actual y dé más espacio
    const scrollTop = board.scrollTop;
    const scrollLeft = board.scrollLeft;
    
    // Crear notas en un área mucho más grande (5000x5000)
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
        
        const x = e.clientX - boardRect.left + scrollLeft - 110;
        const y = e.clientY - boardRect.top + scrollTop - 90;
        
        const noteId = draggedNote.dataset.id;
        set(ref(database, `notes/${noteId}/x`), Math.max(0, x));
        set(ref(database, `notes/${noteId}/y`), Math.max(0, y));
    });
}

function handleDragStart(e) {
    draggedNote = e.target;
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedNote = null;
}

window.deleteNote = function(noteId) {
    if (confirm('¿Eliminar esta nota?')) {
        remove(ref(database, `notes/${noteId}`));
    }
}

window.createNote = createNote;

// Funciones de zoom
function setupZoom() {
    const boardContent = document.getElementById('boardContent');
    
    // Soporte para pinch-to-zoom en móvil
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
    // Detectar si es móvil y establecer zoom inicial reducido
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        setZoom(0.5); // Vista alejada por defecto en móvil
    }
}

function setZoom(zoom) {
    currentZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    const boardContent = document.getElementById('boardContent');
    boardContent.style.transform = `scale(${currentZoom})`;
    boardContent.style.transformOrigin = '0 0';
    
    // Ajustar el tamaño del contenedor para mantener el scroll
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
