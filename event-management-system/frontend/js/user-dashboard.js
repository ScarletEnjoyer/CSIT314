// User Dashboard page script
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const upcomingEventsContainer = document.getElementById("upcoming-events-container")
  const pastEventsContainer = document.getElementById("past-events-container")
  const notificationsContainer = document.getElementById("notifications-container")
  const tabButtons = document.querySelectorAll(".dashboard__tab")
  const tabContents = document.querySelectorAll(".dashboard__content")
  const ticketModal = document.getElementById("ticket-modal")
  const modalTicket = document.getElementById("modal-ticket")
  const modalClose = document.querySelector(".modal__close")

  // Get user ID from logged in user
  let userId
  const loggedInUserJson = localStorage.getItem("loggedInUser")

  if (loggedInUserJson) {
    const loggedInUser = JSON.parse(loggedInUserJson)
    userId = loggedInUser.id
  } else {
    // For demo purposes, use a fixed user ID if not logged in
    userId = 1
  }

  // Load user data
  loadUserData()

  // Event listeners for tabs
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const tabId = this.dataset.tab

      // Update active tab button
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      this.classList.add("active")

      // Update active tab content
      tabContents.forEach((content) => content.classList.remove("active"))
      document.getElementById(tabId + "-events").classList.add("active")

      // Special case for notifications tab
      if (tabId === "notifications") {
        document.getElementById("notifications").classList.add("active")
      }
    })
  })

  // Event listener for modal close
  modalClose.addEventListener("click", () => {
    ticketModal.classList.remove("active")
  })

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === ticketModal) {
      ticketModal.classList.remove("active")
    }
  })

  // Function to load user data
  function loadUserData() {
    // Get user
    const user = window.dataService.getUser(userId)

    if (!user) {
      // Handle case where user is not found
      upcomingEventsContainer.innerHTML = "<p>User not found. Please log in again.</p>"
      return
    }

    // Get user's registrations
    const registrations = window.dataService.getRegistrationsByUser(userId)

    // Get current date for comparison
    const currentDate = new Date()

    // Filter registrations into upcoming and past events
    const upcomingRegistrations = []
    const pastRegistrations = []

    registrations.forEach((registration) => {
      const event = window.dataService.getEvent(registration.eventId)
      if (!event) return

      const eventDate = new Date(event.date + "T" + event.time)

      if (eventDate > currentDate) {
        upcomingRegistrations.push({ registration, event })
      } else {
        pastRegistrations.push({ registration, event })
      }
    })

    // Display upcoming events
    if (upcomingRegistrations.length === 0) {
      upcomingEventsContainer.innerHTML =
        '<p>You have no upcoming events. <a href="index.html">Browse events</a> to register.</p>'
    } else {
      upcomingEventsContainer.innerHTML = ""
      upcomingRegistrations.forEach((item) => {
        const eventCard = createEventCard(item.event, item.registration)
        upcomingEventsContainer.appendChild(eventCard)
      })
    }

    // Display past events
    if (pastRegistrations.length === 0) {
      pastEventsContainer.innerHTML = "<p>You have no past events.</p>"
    } else {
      pastEventsContainer.innerHTML = ""
      pastRegistrations.forEach((item) => {
        const eventCard = createEventCard(item.event, item.registration, true)
        pastEventsContainer.appendChild(eventCard)
      })
    }

    // Get and display notifications
    const notifications = window.dataService.getNotificationsByUser(userId)

    if (notifications.length === 0) {
      notificationsContainer.innerHTML = "<p>You have no notifications.</p>"
    } else {
      notificationsContainer.innerHTML = ""
      notifications.forEach((notification) => {
        const notificationElement = createNotification(notification)
        notificationsContainer.appendChild(notificationElement)
      })
    }
  }

  // Function to create an event card
  function createEventCard(event, registration, isPast = false) {
    const eventCard = document.createElement("div")
    eventCard.className = "dashboard__event-card"

    // Format date
    const eventDate = new Date(event.date + "T" + event.time)
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

    // Generate a ticket ID (in a real app, this would be stored with the registration)
    const ticketId = registration.id + "-" + Math.random().toString(36).substring(2, 6).toUpperCase()

    // Create card content
    eventCard.innerHTML = `
    <img src="${event.image}" alt="${event.title}" class="dashboard__event-image" loading="lazy">
    <div class="dashboard__event-content">
      <h3 class="dashboard__event-title">${event.title}</h3>
      <p class="dashboard__event-date">${formattedDate} at ${formattedTime}</p>
      <p class="dashboard__event-location"><strong>Location:</strong> ${event.location}</p>
      
      <div class="dashboard__event-ticket">
        <p class="dashboard__event-ticket-type">${registration.ticketType === "general" ? "General Admission" : "VIP Access"} (${registration.quantity})</p>
        <p class="dashboard__event-ticket-id">Ticket ID: ${ticketId}</p>
        <p class="dashboard__event-purchase-date"><strong>Purchased:</strong> ${new Date(registration.purchaseDate).toLocaleDateString()}</p>
        <p class="dashboard__event-price"><strong>Total Paid:</strong> $${registration.totalPrice.toFixed(2)}</p>
      </div>
      
      <div class="dashboard__event-actions">
        <button class="button button--secondary view-ticket-button">View Ticket</button>
        ${!isPast ? '<a href="event-details.html?id=' + event.id + '" class="button button--primary">Event Details</a>' : ""}
      </div>
    </div>
  `

    // Add event listener to view ticket button
    const viewTicketButton = eventCard.querySelector(".view-ticket-button")
    viewTicketButton.addEventListener("click", () => {
      showTicketModal(event, registration, ticketId)
    })

    return eventCard
  }

  // Function to create a notification element
  function createNotification(notification) {
    const notificationElement = document.createElement("div")
    notificationElement.className = "dashboard__notification"

    if (!notification.read) {
      notificationElement.classList.add("dashboard__notification--unread")
    }

    // Format date
    const notificationDate = new Date(notification.date)
    const formattedDate = notificationDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Create notification content
    notificationElement.innerHTML = `
            <h3 class="dashboard__notification-title">${notification.title}</h3>
            <p class="dashboard__notification-date">${formattedDate}</p>
            <p class="dashboard__notification-content">${notification.content}</p>
        `

    // Mark notification as read when clicked
    notificationElement.addEventListener("click", () => {
      if (!notification.read) {
        notification.read = true
        window.dataService.saveNotification(notification)
        notificationElement.classList.remove("dashboard__notification--unread")
      }
    })

    return notificationElement
  }

  // Function to show ticket modal
  function showTicketModal(event, registration, ticketId) {
    // Format date
    const eventDate = new Date(event.date + "T" + event.time)
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
    modalTicket.innerHTML = `
    <h3>${event.title}</h3>
    <p><strong>Date & Time:</strong> ${formattedDate} at ${formattedTime}</p>
    <p><strong>Location:</strong> ${event.location}</p>
    <p><strong>Ticket Type:</strong> ${registration.ticketType === "general" ? "General Admission" : "VIP Access"}</p>
    <p><strong>Quantity:</strong> ${registration.quantity}</p>
    <p><strong>Attendee:</strong> ${registration.attendeeInfo.name}</p>
    <p><strong>Email:</strong> ${registration.attendeeInfo.email}</p>
    <p><strong>Phone:</strong> ${registration.attendeeInfo.phone}</p>
    <p><strong>Total Paid:</strong> $${registration.totalPrice.toFixed(2)}</p>
    <div class="modal__ticket-qr">
      [QR CODE PLACEHOLDER]
    </div>
    <div class="registration__ticket-id">
      Ticket ID: ${ticketId}
    </div>
    <p>Please present this ticket at the event entrance.</p>
  `

    // Show modal
    ticketModal.classList.add("active")
  }
})
