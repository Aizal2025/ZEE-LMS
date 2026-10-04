/* ---------------- 1. firebase import ---------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



const firebaseConfig = {
  apiKey: "AIzaSyAxJe1qUJSrRzbwlNrqn-O-TsKG657Ly0M",
  authDomain: "zee-lms-bbefe.firebaseapp.com",
  projectId: "zee-lms-bbefe",
  storageBucket: "zee-lms-bbefe.firebasestorage.app",
  messagingSenderId: "1045754592352",
  appId: "1:1045754592352:web:13c74ba63bbbcdd9f5d705"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);




// user ka text safe banane ke liye
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}


function timeAgo(timestamp) {
  if (!timestamp) return 'Just now';

  const diff = Date.now() - timestamp.toDate().getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days >= 1) return days + 'd ago';
  if (hours >= 1) return hours + 'h ago';
  if (minutes >= 1) return minutes + 'm ago';
  return 'Just now';
}


function friendlyError(err) {
  const code = err.code || '';

  if (code === 'auth/email-already-in-use') return 'Ye email pehle se registered hai.';
  if (code === 'auth/invalid-credential') return 'Email ya password galat hai.';
  if (code === 'auth/invalid-email') return 'Email sahi nahi hai.';
  if (code === 'auth/weak-password') return 'Password kam se kam 6 characters ka rakho.';
  if (code === 'auth/too-many-requests') return 'Bahut zyada try ho gaye, thodi der baad try karo.';
  if (code === 'permission-denied' || code === 'firestore/permission-denied') return 'Aapko ye kaam karne ki permission nahi hai.';

  return 'Kuch gadbad ho gayi, dobara try karo.';
}


function getCurrentUser() {
  return new Promise(function (resolve) {
    const stop = onAuthStateChanged(auth, async function (firebaseUser) {
      stop();

      if (!firebaseUser) {
        resolve(null);
        return;
      }

    
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!snap.exists()) {
        resolve(null);
        return;
      }

      const data = snap.data();
      resolve({
        uid: firebaseUser.uid,
        name: data.name,
        email: data.email,
        role: data.role
      });
    });
  });
}

async function renderAuthArea() {
  const el = document.getElementById('authArea');
  if (!el) return; // is page me auth jagah nahi hai

  const user = await getCurrentUser();

  if (user) {
    el.innerHTML = `
      <span style="color:#aaa; margin-right:0.8em; font-size:0.9em;">Hi, ${escapeHtml(user.name)} (${escapeHtml(user.role)})</span>
      <button id="logoutBtn" style="background:transparent; border:1px solid rgba(255,255,255,0.2); color:#ededed; border-radius:6px; padding:0.4em 0.9em; cursor:pointer; font-weight:600;">Logout</button>
    `;

    document.getElementById('logoutBtn').addEventListener('click', async function () {
      await signOut(auth);
      window.location.href = 'index.html';
    });
  } else {
    el.innerHTML = '<a href="login.html" style="color:#2ecc71; font-weight:600; text-decoration:none;">Login</a>';
  }
}




async function getJobs() {
  const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(function (d) {
    return { id: d.id, ...d.data() };
  });
}




let allJobs = [];           
let appliedJobIds = [];      

function renderJobs() {
  const grid = document.getElementById('jobGrid');
  const countEl = document.querySelector('.listing-header .count');

  // search aur filter ki value
  const searchText = document.getElementById('searchBox').value.toLowerCase();
  const typeValue = document.getElementById('typeFilter').value;

  const list = allJobs.filter(function (job) {
    const text = [job.title, job.company, job.location].concat(job.tags || []).join(' ').toLowerCase();
    const searchOk = !searchText || text.includes(searchText);
    const typeOk = !typeValue || job.type === typeValue;
    return searchOk && typeOk;
  });

  if (list.length === 0) {
    grid.innerHTML = '<p style="color:#888;">No roles available right now.</p>';
  } else {
    grid.innerHTML = list.map(function (job) {
      const alreadyApplied = appliedJobIds.includes(job.id);

      return `
        <div class="job-card">
          <div class="job-card-top">
            <div class="job-icon">🏢</div>
            <div class="job-posted">${timeAgo(job.createdAt)}</div>
          </div>
          <div class="job-title-row">
            <h3>${escapeHtml(job.title)}</h3>
            <a href="#">→</a>
          </div>
          <div class="job-company">${escapeHtml(job.company)}</div>
          <div class="job-meta">
            <span>📍 ${escapeHtml(job.location)}</span>
            <span>🕒 ${escapeHtml(job.type)}</span>
          </div>
          <div class="job-tags">
            ${(job.tags || []).map(function (t) { return '<span>' + escapeHtml(t) + '</span>'; }).join('')}
          </div>
          <div class="job-footer-row">
            <span class="job-salary">${escapeHtml(job.salary)}</span>
            ${alreadyApplied
              ? '<button class="job-view applied" disabled>Applied ✓</button>'
              : '<button class="job-view apply-btn" data-job-id="' + job.id + '">Apply →</button>'}
          </div>
        </div>
      `;
    }).join('');
  }

  countEl.textContent = list.length + ' role' + (list.length !== 1 ? 's' : '') + ' available';
}

async function loadJobsPage() {
  const grid = document.getElementById('jobGrid');

  try {
    allJobs = await getJobs();

  
    const user = await getCurrentUser();
    appliedJobIds = [];

    if (user && user.role === 'candidate') {
      const q = query(collection(db, 'applications'), where('candidateId', '==', user.uid));
      const snapshot = await getDocs(q);
      snapshot.forEach(function (d) {
        appliedJobIds.push(d.data().jobId);
      });
    }

    renderJobs();
  } catch (err) {
    console.log(err);
    grid.innerHTML = '<p style="color:#e66;">Could not load jobs. Firebase config check karo.</p>';
  }
}

async function handleApplyClick(e) {
  const btn = e.target.closest('.apply-btn');
  if (!btn) return;

  const jobId = btn.dataset.jobId;
  const user = await getCurrentUser();

 
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  if (user.role !== 'candidate') {
    alert('Only candidate accounts can apply to roles.');
    return;
  }

  const job = allJobs.find(function (j) {
    return j.id === jobId;
  });

  btn.disabled = true;
  btn.textContent = 'Applying…';

  try {
    await setDoc(doc(db, 'applications', jobId + '_' + user.uid), {
      jobId: jobId,
      jobTitle: job.title,
      company: job.company,
      candidateId: user.uid,
      candidateName: user.name,
      candidateEmail: user.email,
      appliedAt: serverTimestamp()
    });

    appliedJobIds.push(jobId);
    btn.textContent = 'Applied ✓';
    btn.classList.add('applied');
  } catch (err) {
    console.log(err);
    alert('Application submit nahi ho payi. Ho sakta hai aap pehle hi apply kar chuke ho.');
    btn.disabled = false;
    btn.textContent = 'Apply →';
  }
}

function initFindJobPage() {
  const grid = document.getElementById('jobGrid');
  if (!grid) return; // ye page nahi hai

  loadJobsPage();
  grid.addEventListener('click', handleApplyClick);

  document.getElementById('searchBox').addEventListener('input', renderJobs);
  document.getElementById('typeFilter').addEventListener('change', renderJobs);
}


/* ----------------------- (about.html)--------------*/

async function initAboutPage() {
  const liveCount = document.getElementById('liveCount');
  if (!liveCount) return; // ye page nahi hai

  try {
    const jobs = await getJobs();
    liveCount.textContent = '🟢 ' + jobs.length + ' role' + (jobs.length !== 1 ? 's' : '') + ' currently open on Zee';
    liveCount.style.opacity = 1;
    liveCount.style.transition = 'opacity 0.6s ease';
  } catch (err) {
    // ye sirf decoration hai, error ignore
  }
}



function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return; 

  const signupForm = document.getElementById('signupForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const roleCandidate = document.getElementById('roleCandidate');
  const roleAdmin = document.getElementById('roleAdmin');
  const msg = document.getElementById('authMsg');
  const hint = document.getElementById('hintText');
  const signupBtn = document.getElementById('signupBtn');

  let selectedRole = 'candidate';   // candidate ya admin

  function showMsg(text, isError) {
    msg.textContent = text;
    msg.className = 'auth-msg ' + (isError ? 'error' : 'success');
  }

  function updateRoleText() {
    if (selectedRole === 'admin') {
      signupBtn.textContent = 'Request admin access';
      hint.innerHTML = 'Admin signup ek <strong>request</strong> hoti hai.<br>Existing admin approve kare tabhi admin access milega.';
    } else {
      signupBtn.textContent = 'Create candidate account';
      hint.innerHTML = 'Candidate account se roles pe apply kar sakte ho.';
    }
  }

  updateRoleText();

  roleCandidate.addEventListener('click', function () {
    selectedRole = 'candidate';
    roleCandidate.classList.add('active');
    roleAdmin.classList.remove('active');
    msg.textContent = '';
    updateRoleText();
  });

  roleAdmin.addEventListener('click', function () {
    selectedRole = 'admin';
    roleAdmin.classList.add('active');
    roleCandidate.classList.remove('active');
    msg.textContent = '';
    updateRoleText();
  });

  function showLoginTab() {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  }

  tabLogin.addEventListener('click', function () {
    showLoginTab();
    msg.textContent = '';
  });

  tabSignup.addEventListener('click', function () {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
    msg.textContent = '';
  });

  /* ---------- login ---------- */
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'users', result.user.uid));

      if (!snap.exists()) {
        await signOut(auth);
        showMsg('Is account ka data nahi mila.', true);
        return;
      }

      const data = snap.data();

      if (selectedRole === 'admin' && data.role !== 'admin') {
        await signOut(auth);

        if (data.adminRequest === 'pending') {
          showMsg('Aapki admin request abhi pending hai. Approval ka wait karo.', true);
        } else if (data.adminRequest === 'rejected') {
          showMsg('Aapki admin request reject ho gayi hai.', true);
        } else {
          showMsg('Ye candidate account hai, upar Candidate select karo.', true);
        }
        return;
      }

      // candidate tab me admin account se login kiya
      if (selectedRole === 'candidate' && data.role === 'admin') {
        await signOut(auth);
        showMsg('Ye admin account hai, upar Admin select karo.', true);
        return;
      }

      window.location.href = data.role === 'admin' ? 'admin.html' : 'index.html';
    } catch (err) {
      console.log(err);
      showMsg(friendlyError(err), true);
    }
  });

  /* ---------- signup ---------- */
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('suName').value.trim();
    const email = document.getElementById('suEmail').value.trim();
    const password = document.getElementById('suPassword').value;

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'users', result.user.uid), {
        name: name,
        email: email,
        role: 'candidate',
        adminRequest: selectedRole === 'admin' ? 'pending' : 'none',
        createdAt: serverTimestamp()
      });

      if (selectedRole === 'admin') {
        await signOut(auth);
        signupForm.reset();
        showLoginTab();
        showMsg('Admin request bhej di gayi ✓ Approve hone ke baad admin login karo.', false);
        return;
      }

      window.location.href = 'index.html';
    } catch (err) {
      console.log(err);
      showMsg(friendlyError(err), true);
    }
  });
}


/*----------------- (admin.html)------------------------*/

let adminJobs = [];  

async function renderRoles() {
  const list = document.getElementById('roleList');
  const statOpen = document.getElementById('statOpenRoles');

  try {
    adminJobs = await getJobs();
  } catch (err) {
    console.log(err);
    list.innerHTML = '<p style="color:#e66; padding:1.5em 0;">Could not load roles.</p>';
    return;
  }

  statOpen.textContent = adminJobs.length;

  if (adminJobs.length === 0) {
    list.innerHTML = '<p style="color:#888; padding:1.5em 0;">No roles yet. "Add a role" dabake create karo.</p>';
    return;
  }

  list.innerHTML = adminJobs.map(function (job) {
    return `
      <div class="role-row">
        <div class="role-icon">🏢</div>
        <div class="role-info">
          <div class="title">${escapeHtml(job.title)}</div>
          <div class="meta">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</div>
        </div>
        <div class="role-actions">
          <button title="Edit" data-action="edit" data-id="${job.id}">✎</button>
          <button title="Delete" data-action="delete" data-id="${job.id}">🗑</button>
        </div>
      </div>
    `;
  }).join('');
}

async function renderApplications() {
  const container = document.getElementById('applicationsList');
  const statApps = document.getElementById('statApplications');
  const statNew = document.getElementById('statNew');

  try {
    const q = query(collection(db, 'applications'), orderBy('appliedAt', 'desc'));
    const snapshot = await getDocs(q);
    const apps = snapshot.docs.map(function (d) {
      return { id: d.id, ...d.data() };
    });

    statApps.textContent = apps.length;
    statNew.textContent = apps.length;

    if (apps.length === 0) {
      container.innerHTML = `
        <div class="empty-box">
          <span style="font-size:1.6em;">📄</span>
          <span>No applications yet.</span>
        </div>`;
      return;
    }

    container.innerHTML = apps.map(function (a) {
      const date = a.appliedAt ? a.appliedAt.toDate().toLocaleDateString() : '';
      return `
        <div class="role-row">
          <div class="role-icon">🧑</div>
          <div class="role-info">
            <div class="title">${escapeHtml(a.candidateName)} → ${escapeHtml(a.jobTitle)}</div>
            <div class="meta">${escapeHtml(a.candidateEmail)} · ${escapeHtml(a.company)} · ${date}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.log(err);
    container.innerHTML = '<p style="color:#e66;">Could not load applications.</p>';
  }
}

// jin users ne admin access maangi hai unki list
async function renderAdminRequests() {
  const container = document.getElementById('requestsList');

  try {
    const q = query(collection(db, 'users'), where('adminRequest', '==', 'pending'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-box"><span>No pending requests.</span></div>';
      return;
    }

    container.innerHTML = snapshot.docs.map(function (d) {
      const u = d.data();
      return `
        <div class="role-row">
          <div class="role-icon">🛡</div>
          <div class="role-info">
            <div class="title">${escapeHtml(u.name)}</div>
            <div class="meta">${escapeHtml(u.email)} · wants admin access</div>
          </div>
          <div class="role-actions">
            <button title="Approve" data-action="approve" data-id="${d.id}">✓</button>
            <button title="Reject" data-action="reject" data-id="${d.id}">✕</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.log(err);
    container.innerHTML = '<p style="color:#e66;">Could not load requests.</p>';
  }
}

/* ----------(add / edit role) ---------- */

function openModal(job) {
  document.getElementById('modalTitle').textContent = job ? 'Edit role' : 'Add a role';
  document.getElementById('roleId').value = job ? job.id : '';
  document.getElementById('fTitle').value = job ? job.title : '';
  document.getElementById('fCompany').value = job ? job.company : '';
  document.getElementById('fLocation').value = job ? job.location : '';
  document.getElementById('fType').value = job ? job.type : 'Full-time';
  document.getElementById('fTags').value = job ? (job.tags || []).join(', ') : '';
  document.getElementById('fSalary').value = job ? job.salary : '';
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('fTitle').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

async function deleteRole(id) {
  if (!confirm('Delete this role?')) return;

  try {
    await deleteDoc(doc(db, 'jobs', id));

    // is job ki saari applications bhi hata do
    const q = query(collection(db, 'applications'), where('jobId', '==', id));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      await deleteDoc(d.ref);
    }

    await renderRoles();
    await renderApplications();
  } catch (err) {
    console.log(err);
    alert('Role delete nahi ho paya.');
  }
}

// admin approve ya reject kare
async function decideRequest(userId, approve) {
  try {
    if (approve) {
      await updateDoc(doc(db, 'users', userId), { role: 'admin', adminRequest: 'approved' });
    } else {
      await updateDoc(doc(db, 'users', userId), { adminRequest: 'rejected' });
    }
    await renderAdminRequests();
  } catch (err) {
    console.log(err);
    alert('Request update nahi ho payi.');
  }
}

async function initAdminPage() {
  const addBtn = document.getElementById('addRoleBtn');
  if (!addBtn) return; // ye page nahi hai

  // sirf admin hi andar aa sakta hai
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  renderRoles();
  renderApplications();
  renderAdminRequests();

  addBtn.addEventListener('click', function (e) {
    e.preventDefault();
    openModal(null);
  });

  document.getElementById('cancelBtn').addEventListener('click', closeModal);

  const overlay = document.getElementById('modalOverlay');
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  // roles list ke edit / delete buttons
  document.getElementById('roleList').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;

    if (btn.dataset.action === 'edit') {
      const job = adminJobs.find(function (j) {
        return j.id === id;
      });
      if (job) openModal(job);
    }

    if (btn.dataset.action === 'delete') {
      deleteRole(id);
    }
  });

  // admin requests ke approve / reject buttons
  document.getElementById('requestsList').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    decideRequest(btn.dataset.id, btn.dataset.action === 'approve');
  });

  // role save (add ya edit)
  document.getElementById('roleForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const idField = document.getElementById('roleId').value;

    const data = {
      title: document.getElementById('fTitle').value.trim(),
      company: document.getElementById('fCompany').value.trim(),
      location: document.getElementById('fLocation').value.trim(),
      type: document.getElementById('fType').value,
      salary: document.getElementById('fSalary').value.trim(),
      tags: document.getElementById('fTags').value
        .split(',')
        .map(function (t) { return t.trim(); })
        .filter(Boolean)
    };

    if (!data.title || !data.company || !data.location || !data.salary) {
      alert('Please fill in role title, company, location and salary.');
      return;
    }

    try {
      if (idField) {
        await updateDoc(doc(db, 'jobs', idField), data);
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, 'jobs'), data);
      }

      closeModal();
      await renderRoles();
    } catch (err) {
      console.log(err);
      alert('Role save nahi ho paya.');
    }
  });
}
*/

renderAuthArea();
initFindJobPage();
initAboutPage();
initLoginPage();
initAdminPage();