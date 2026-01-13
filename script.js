import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, set, remove, onDisconnect, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const notesRef = ref(database, 'notes');
const usersRef = ref(database, 'users');

let selectedColor = 'purple';
let draggedNote = null;
let userId = 'user_' + Math.random().toString(36).substr(2, 9);

function init() {
    setupColorPicker();
    setupUserPresence();
    listenToNotes();
    setupBoardDragDrop();
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
        const board = document.getElementById('board');
        const emptyState = document.getElementById('emptyState');
        
        if (!notes || Object.keys(notes).length === 0) {
            board.querySelectorAll('.sticky-note').forEach(note => note.remove());
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const existingNotes = new Set(
            Array.from(board.querySelectorAll('.sticky-note')).map(el => el.dataset.id)
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
            const noteEl = board.querySelector(`[data-id="${id}"]`);
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
    const boardRect = document.getElementById('board').getBoundingClientRect();
    
    const note = {
        content: '',
        color: selectedColor,
        x: Math.random() * (boardRect.width - 220),
        y: Math.random() * (boardRect.height - 170),
        timestamp: Date.now()
    };
    
    set(ref(database, `notes/${noteId}`), note);
}

function createNoteElement(id, note) {
    const board = document.getElementById('board');
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
    
    board.appendChild(noteEl);
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
        const x = e.clientX - boardRect.left - 100;
        const y = e.clientY - boardRect.top - 75;
        
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

window.clearAllNotes = function() {
    if (confirm('¿Eliminar todas las notas? Esta acción no se puede deshacer.')) {
        remove(notesRef);
    }
}

window.createNote = createNote;

init();
