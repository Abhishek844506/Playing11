// ===== IMPORT FIREBASE =====
import { auth, db } from './firebase.js'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== TOGGLE PASSWORD =====
function togglePassword(fieldId) {
  const input = document.getElementById(fieldId)
  input.type = input.type === 'password' ? 'text' : 'password'
}

// ===== SHOW MESSAGE =====
function showMsg(id, message, type) {
  const msg = document.getElementById(id)
  if (msg) {
    msg.textContent = message
    msg.className = `form-msg ${type}`
  }
}

// ===== HANDLE LOGIN =====
async function handleLogin() {
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value.trim()

  if (!email || !password) {
    alert('Please fill in all fields!')
    return
  }

  const btn = document.querySelector('.btn-primary')
  btn.textContent = '⏳ Logging in...'
  btn.disabled = true

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Check if user is admin
    const adminDoc = await getDoc(doc(db, 'admins', user.uid))
    if (adminDoc.exists()) {
      window.location.href = 'admin.html'
    } else {
      window.location.href = 'dashboard.html'
    }

  } catch (error) {
    btn.textContent = 'Login'
    btn.disabled = false

    // User friendly error messages
    switch (error.code) {
      case 'auth/user-not-found':
        alert('❌ No account found with this email!')
        break
      case 'auth/wrong-password':
        alert('❌ Incorrect password!')
        break
      case 'auth/invalid-email':
        alert('❌ Invalid email address!')
        break
      case 'auth/too-many-requests':
        alert('❌ Too many attempts. Try again later!')
        break
      default:
        alert('❌ ' + error.message)
    }
  }
}

// ===== HANDLE SIGNUP =====
async function handleSignup() {
  const fullname = document.getElementById('fullname').value.trim()
  const username = document.getElementById('username').value.trim()
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value.trim()
  const confirmPassword = document.getElementById('confirm-password').value.trim()

  if (!fullname || !username || !email || !password || !confirmPassword) {
    showMsg('msg', '❌ Please fill in all fields!', 'error')
    return
  }

  if (password.length < 6) {
    showMsg('msg', '❌ Password must be at least 6 characters!', 'error')
    return
  }

  if (password !== confirmPassword) {
    showMsg('msg', '❌ Passwords do not match!', 'error')
    return
  }

  const btn = document.querySelector('.btn-primary')
  btn.textContent = '⏳ Creating account...'
  btn.disabled = true

  try {
    // Step 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Step 2: Save profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      fullName: fullname,
      username: username,
      email: email,
      totalPoints: 0,
      createdAt: serverTimestamp()
    })

    showMsg('msg', '✅ Account created! Redirecting to login...', 'success')

    setTimeout(() => {
      window.location.href = 'login.html'
    }, 2000)

  } catch (error) {
    btn.textContent = 'Create Account'
    btn.disabled = false

    switch (error.code) {
      case 'auth/email-already-in-use':
        showMsg('msg', '❌ Email already registered!', 'error')
        break
      case 'auth/invalid-email':
        showMsg('msg', '❌ Invalid email address!', 'error')
        break
      case 'auth/weak-password':
        showMsg('msg', '❌ Password is too weak!', 'error')
        break
      default:
        showMsg('msg', '❌ ' + error.message, 'error')
    }
  }
}

// ===== HANDLE FORGOT PASSWORD =====
async function handleForgotPassword() {
  const email = document.getElementById('email').value.trim()

  if (!email) {
    showMsg('msg', '❌ Please enter your email address!', 'error')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    showMsg('msg', '❌ Please enter a valid email address!', 'error')
    return
  }

  showMsg('msg', '⏳ Sending reset link...', 'success')

  try {
    await sendPasswordResetEmail(auth, email)
    document.getElementById('sent-email').textContent = email
    document.getElementById('step-1').classList.add('hidden')
    document.getElementById('step-2').classList.remove('hidden')

  } catch (error) {
    switch (error.code) {
      case 'auth/user-not-found':
        showMsg('msg', '❌ No account found with this email!', 'error')
        break
      default:
        showMsg('msg', '❌ ' + error.message, 'error')
    }
  }
}

// ===== RESEND EMAIL =====
function resendEmail() {
  const email = document.getElementById('sent-email').textContent
  sendPasswordResetEmail(auth, email)

  const resendLink = document.querySelector('.resend-link')
  resendLink.textContent = '✅ Sent!'
  resendLink.style.color = '#43e97b'
  resendLink.style.pointerEvents = 'none'

  setTimeout(() => {
    resendLink.textContent = 'Resend Email'
    resendLink.style.color = ''
    resendLink.style.pointerEvents = ''
  }, 3000)
}

// ===== AUTH STATE LISTENER =====
// Protects pages from unauthenticated access
onAuthStateChanged(auth, (user) => {
  const publicPages = ['login.html', 'signup.html', 'forgot-password.html']
  const currentPage = window.location.pathname.split('/').pop()
  const isPublicPage = publicPages.includes(currentPage)

  if (!user && !isPublicPage) {
    // Not logged in + trying to access protected page → redirect to login
    window.location.href = 'login.html'
  }
})

// ===== LOGOUT =====
async function handleLogout() {
  await signOut(auth)
  window.location.href = 'login.html'
}

// ===== EXPOSE FUNCTIONS GLOBALLY =====
window.togglePassword = togglePassword
window.handleLogin = handleLogin
window.handleSignup = handleSignup
window.handleForgotPassword = handleForgotPassword
window.resendEmail = resendEmail
window.handleLogout = handleLogout