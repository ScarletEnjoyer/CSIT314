// Organizer Login page script
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const loginForm = document.getElementById("login-form")
  const emailInput = document.getElementById("email")
  const passwordInput = document.getElementById("password")
  const loginError = document.getElementById("login-error")

  // Event listener for form submission
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Get input values
    const email = emailInput.value.trim()
    const password = passwordInput.value

    // Validate inputs
    if (!email || !password) {
      loginError.textContent = "Please enter both email and password."
      return
    }

    // Attempt login
    attemptLogin(email, password)
  })

  // Function to attempt login
  function attemptLogin(email, password) {
    // Get organizer by email
    const organizer = window.dataService.getOrganizerByEmail(email)

    if (!organizer) {
      loginError.textContent = "No account found with this email."
      return
    }

    // Check password (in a real app, this would use proper authentication)
    if (organizer.password !== password) {
      loginError.textContent = "Incorrect password."
      return
    }

    // Login successful
    // Store organizer ID in sessionStorage (in a real app, this would use proper auth tokens)
    sessionStorage.setItem("organizerId", organizer.id)

    // Redirect to organizer dashboard
    window.location.href = "organizer-dashboard.html"
  }
})
