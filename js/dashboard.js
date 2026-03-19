// ===== IMPORT FIREBASE =====
import { auth, db } from './firebase.js'
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"

// ===== AUTH GUARD =====
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html'
    return
  }

  // Load user profile
  loadUserProfile(user.uid)

  // Load predictions
  loadPredictions(user.uid)
})

// ===== LOAD USER PROFILE =====
async function loadUserProfile(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid))

  if (userDoc.exists()) {
    const data = userDoc.data()

    document.getElementById('user-fullname').textContent = data.fullName || 'Player'
    document.getElementById('nav-username').textContent = '👤 ' + (data.username || 'Player')
    document.getElementById('user-points').textContent = data.totalPoints || 0
  }
}

// ===== LOAD PREDICTIONS (Realtime) =====
function loadPredictions(uid) {
  const q = query(
    collection(db, 'predictions'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  )

  // Realtime listener
  onSnapshot(q, (snapshot) => {
    const total = snapshot.size
    let correct = 0

    document.getElementById('total-predictions').textContent = total

    const list = document.getElementById('predictions-list')

    if (total === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <span>🎯</span>
          <p>No predictions yet!</p>
          <a href="predict.html" class="btn-primary">Make Your First Prediction</a>
        </div>`
      return
    }

    let html = ''
    snapshot.forEach((docSnap) => {
      const p = docSnap.data()
      if (p.isCorrect) correct++

      const date = p.createdAt?.toDate().toLocaleDateString() || 'Today'
      const statusClass = p.isCorrect ? 'correct' : p.isCorrect === false ? 'wrong' : 'pending'
      const statusText = p.isCorrect ? '✅ Correct' : p.isCorrect === false ? '❌ Wrong' : '⏳ Pending'

      html += `
        <div class="prediction-item">
          <div class="prediction-match">
            <span class="match-teams-text">${p.team1} vs ${p.team2}</span>
            <span class="prediction-date">${date}</span>
          </div>
          <div class="prediction-pick">
            Predicted: <strong>${p.predictedWinner}</strong>
          </div>
          <span class="prediction-status ${statusClass}">${statusText}</span>
        </div>`
    })

    list.innerHTML = html

    // Update stats
    document.getElementById('correct-predictions').textContent = correct
    const winRate = total > 0 ? Math.round((correct / total) * 100) : 0
    document.getElementById('win-rate').textContent = winRate + '%'
  })
}

// ===== LOGOUT =====
async function handleLogout() {
  await signOut(auth)
  window.location.href = 'login.html'
}

window.handleLogout = handleLogout