// ============================================================
// 1. FIREBASE CONNECTION  (BACKEND SETUP)
// ============================================================
 const firebaseConfig = {
  apiKey: "AIzaSyBiu9OlyN8YydDdeE_OG3Pl-sPU5cj5z-8",
  authDomain: "skill-share-hackathon.firebaseapp.com",
  databaseURL: "https://skill-share-hackathon-default-rtdb.firebaseio.com",
  projectId: "skill-share-hackathon",
  storageBucket: "skill-share-hackathon.firebasestorage.app",
  messagingSenderId: "412904907671",
  appId: "1:412904907671:web:edce5d59e6699000badad2",
  measurementId: "G-GPLYRJYR8L"
};

const statusEl = document.getElementById('status');
let db = null;
let allPosts = [];          // every post pulled from Firebase
let currentFilter = 'all';  // 'all' | 'offer' | 'request'
let selectedType = 'offer'; // which toggle button is active in the form

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  statusEl.textContent = '🟢 Connected — posts are live for everyone';
  statusEl.classList.add('connected');
} catch (err) {
  statusEl.textContent = '⚠️ Firebase not configured — check firebaseConfig';
  statusEl.classList.add('error');
  console.error(err);
}

// ============================================================
// 2. OFFER / REQUEST TOGGLE  (frontend)
// ============================================================
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.dataset.type;
  });
});

// ============================================================
// 3. FILTER BUTTONS  (frontend)
// ============================================================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderPosts();
  });
});

// ============================================================
// 4. WRITE TO FIREBASE  (BACKEND WRITE)
// ============================================================
document.getElementById('postForm').addEventListener('submit', function (e) {
  e.preventDefault();

  if (!db) {
    alert('Firebase is not connected — check your config.');
    return;
  }

  const post = {
    type: selectedType,
    name: document.getElementById('nameInput').value.trim(),
    skill: document.getElementById('skillInput').value.trim(),
    description: document.getElementById('descInput').value.trim(),
    contact: document.getElementById('contactInput').value.trim(),
    timestamp: Date.now()
  };

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Posting...';

  // >>> THIS is the line that saves data to the backend <<<
  db.ref('posts').push(post)
    .then(() => {
      document.getElementById('postForm').reset();
      selectedType = 'offer';
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.type-btn[data-type="offer"]').classList.add('active');
    })
    .catch(err => {
      alert('Could not save post: ' + err.message);
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post to Board';
    });
});

// ============================================================
// 5. READ FROM FIREBASE  (BACKEND READ — live updates)
// ============================================================
function listenForPosts() {
  if (!db) return;

  // >>> THIS is the line that reads data from the backend <<<
  db.ref('posts').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    allPosts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
    renderPosts();
  });
}

// ============================================================
// 6. SHOW POSTS ON THE PAGE  (frontend)
// ============================================================
function renderPosts() {
  const boardEl = document.getElementById('board');

  const filtered = currentFilter === 'all'
    ? allPosts
    : allPosts.filter(p => p.type === currentFilter);

  if (filtered.length === 0) {
    boardEl.innerHTML = '<div class="empty-note">No posts yet — be the first!</div>';
    return;
  }

  boardEl.innerHTML = filtered.map(post => `
    <div class="post-card">
      <div class="post-top">
        <span class="post-name">${escapeHtml(post.name)}</span>
        <span class="post-badge ${post.type}">${post.type === 'offer' ? '🟢 Offer' : '🟠 Request'}</span>
      </div>
      <div class="post-skill">${escapeHtml(post.skill)}</div>
      <div class="post-desc">${escapeHtml(post.description)}</div>
      <div class="post-contact">📩 ${escapeHtml(post.contact)}</div>
    </div>
  `).join('');
}

// Stops people from injecting HTML/scripts through the form
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Start listening as soon as the page loads
listenForPosts();