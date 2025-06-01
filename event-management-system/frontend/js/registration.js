// Registration page script
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const eventSummary = document.getElementById("event-summary")
  const registrationForm = document.getElementById("registration-form")
  const eventNameElement = document.getElementById("event-name")
  const ticketTypeElement = document.getElementById("ticket-type-display")
  const ticketQuantityElement = document.getElementById("ticket-quantity-display")
  const totalPriceElement = document.getElementById("total-price-display")
  const emailInput = document.getElementById("email")
  const emailError = document.getElementById("email-error")
  const backButton = document.getElementById("back-button")
  const payButton = document.getElementById("pay-button")
  const ticketContainer = document.getElementById("ticket-container")

  // Get stored data from session storage
  const selectedEvent = JSON.parse(sessionStorage.getItem("selectedEvent"))
  const selectedTicketType = sessionStorage.getItem("selectedTicketType")
  const selectedQuantity = sessionStorage.getItem("selectedQuantity")
  const totalPrice = sessionStorage.getItem("totalPrice")

  // Check if we have the necessary data
  if (!selectedEvent || !selectedTicketType || !selectedQuantity || !totalPrice) {
    window.location.href = "index.html"
    return
  }

  // Display event summary
  displayEventSummary()

  // Display ticket information
  eventNameElement.textContent = selectedEvent.title
  ticketTypeElement.textContent = selectedTicketType === "general" ? "General Admission" : "VIP Access"
  ticketQuantityElement.textContent = selectedQuantity
  totalPriceElement.textContent = totalPrice

  // Event listeners
  backButton.addEventListener("click", () => {
    window.history.back()
  })

  emailInput.addEventListener("blur", validateEmail)

  registrationForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Validate email
    if (!validateEmail()) {
      return
    }

    // Simulate payment processing
    simulatePayment()
  })

  // Function to display event summary
  function displayEventSummary() {
    // Format date
    const eventDate = new Date(selectedEvent.date + "T" + selectedEvent.time)
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const formattedTime = eventDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // Create summary HTML
    eventSummary.innerHTML = `
            <h3 class="registration__summary-title">${selectedEvent.title}</h3>
            <div class="registration__summary-details">
                <div class="registration__summary-item">
                    <span class="registration__summary-label">Date & Time</span>
                    <span class="registration__summary-value">${formattedDate} at ${formattedTime}</span>
                </div>
                <div class="registration__summary-item">
                    <span class="registration__summary-label">Location</span>
                    <span class="registration__summary-value">${selectedEvent.location}</span>
                </div>
                <div class="registration__summary-item">
                    <span class="registration__summary-label">Ticket Type</span>
                    <span class="registration__summary-value">${selectedTicketType === "general" ? "General Admission" : "VIP Access"}</span>
                </div>
                <div class="registration__summary-item">
                    <span class="registration__summary-label">Quantity</span>
                    <span class="registration__summary-value">${selectedQuantity}</span>
                </div>
                <div class="registration__summary-item">
                    <span class="registration__summary-label">Total Price</span>
                    <span class="registration__summary-value">${totalPrice}</span>
                </div>
            </div>
        `
  }

  // Function to validate email
  function validateEmail() {
    const email = emailInput.value.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      emailError.textContent = "Please enter a valid email address."
      return false
    }

    emailError.textContent = ""
    return true
  }

  // Function to simulate payment processing
  function simulatePayment() {
    // Disable form elements during "processing"
    const formElements = registrationForm.elements
    for (let i = 0; i < formElements.length; i++) {
      formElements[i].disabled = true
    }

    payButton.textContent = "Processing..."

    // Simulate a delay for payment processing
    setTimeout(() => {
      // Create registration in the system
      createRegistration()

      // Hide form and show ticket
      registrationForm.classList.add("hidden")
      ticketContainer.classList.remove("hidden")

      // Generate and display e-ticket
      displayETicket()
    }, 1500)
  }

  // Function to create registration in the system
  function createRegistration() {
    // Get form data
    const fullName = document.getElementById("full-name").value.trim()
    const email = emailInput.value.trim()
    const phone = document.getElementById("phone").value.trim()

    // Check if user is logged in
    const loggedInUserJson = localStorage.getItem("loggedInUser")
    let user

    if (loggedInUserJson) {
      // Use logged in user
      user = JSON.parse(loggedInUserJson)
    } else {
      // Check if user exists or create new user
      user = window.dataService.getUserByEmail(email)

      if (!user) {
        user = window.dataService.saveUser({
          name: fullName,
          email: email,
          registrations: [],
        })
      }
    }

    // Create registration
    const registration = {
      userId: user.id,
      eventId: selectedEvent.id,
      ticketType: selectedTicketType,
      quantity: Number.parseInt(selectedQuantity),
      purchaseDate: new Date().toISOString(),
      totalPrice: Number.parseFloat(totalPrice.replace("$", "")),
      attendeeInfo: {
        name: fullName,
        email: email,
        phone: phone,
      },
    }

    // Save registration
    window.dataService.saveRegistration(registration)

    // Create notification for user
    const notification = {
      userId: user.id,
      title: "Registration Confirmed",
      content: `Your registration for ${selectedEvent.title} has been confirmed. Check your tickets in the dashboard.`,
      date: new Date().toISOString(),
      read: false,
    }

    window.dataService.saveNotification(notification)
  }

  // Function to display e-ticket
  function displayETicket() {
    // Generate a random ticket ID
    const ticketId = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Format date
    const eventDate = new Date(selectedEvent.date + "T" + selectedEvent.time)
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const formattedTime = eventDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // Create ticket HTML
    ticketContainer.innerHTML = `
            <h3 class="registration__ticket-title">Your E-Ticket</h3>
            <div class="registration__ticket-details">
                <p><strong>Event:</strong> ${selectedEvent.title}</p>
                <p><strong>Date & Time:</strong> ${formattedDate} at ${formattedTime}</p>
                <p><strong>Location:</strong> ${selectedEvent.location}</p>
                <p><strong>Ticket Type:</strong> ${selectedTicketType === "general" ? "General Admission" : "VIP Access"}</p>
                <p><strong>Quantity:</strong> ${selectedQuantity}</p>
                <p><strong>Attendee:</strong> ${document.getElementById("full-name").value.trim()}</p>
            </div>
            <div class="registration__ticket-qr">
                [QR CODE PLACEHOLDER]
            </div>
            <div class="registration__ticket-id">
                Ticket ID: ${ticketId}
            </div>
            <p>Please present this ticket at the event entrance.</p>
            <div class="registration__actions">
                <a href="user-dashboard.html" class="button button--primary">Go to My Events</a>
            </div>
        `
  }
})
