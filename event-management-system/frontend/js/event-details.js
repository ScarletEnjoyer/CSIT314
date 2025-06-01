// Event Details page script
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const eventDetailsContainer = document.getElementById("event-details-container")
  const ticketTypeSelect = document.getElementById("ticket-type")
  const ticketQuantitySelect = document.getElementById("ticket-quantity")
  const totalPriceElement = document.getElementById("total-price")
  const registerButton = document.getElementById("register-button")

  // Get event ID from URL
  const urlParams = new URLSearchParams(window.location.search)
  const eventId = urlParams.get("id")

  // Variables to store event data
  let currentEvent = null

  // Load event details
  loadEventDetails()

  // Event listeners
  ticketTypeSelect.addEventListener("change", updateTotalPrice)
  ticketQuantitySelect.addEventListener("change", updateTotalPrice)

  registerButton.addEventListener("click", () => {
    // Store selected options in sessionStorage for the registration page
    sessionStorage.setItem("selectedEvent", JSON.stringify(currentEvent))
    sessionStorage.setItem("selectedTicketType", ticketTypeSelect.value)
    sessionStorage.setItem("selectedQuantity", ticketQuantitySelect.value)
    sessionStorage.setItem("totalPrice", totalPriceElement.textContent)

    // Redirect to registration page
    window.location.href = "registration.html"
  })

  // Function to load event details
  function loadEventDetails() {
    if (!eventId) {
      eventDetailsContainer.innerHTML = '<p class="error">Event not found.</p>'
      return
    }

    // Get event data
    currentEvent = window.dataService.getEvent(Number.parseInt(eventId))

    if (!currentEvent) {
      eventDetailsContainer.innerHTML = '<p class="error">Event not found.</p>'
      return
    }

    // Format date
    const eventDate = new Date(currentEvent.date + "T" + currentEvent.time)
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

    // Render event details
    eventDetailsContainer.innerHTML = `
            <img src="${currentEvent.image}" alt="${currentEvent.title}" class="event-details__image">
            <div class="event-details__content">
                <h2 class="event-details__title">${currentEvent.title}</h2>
                
                <div class="event-details__meta">
                    <div class="event-details__meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${formattedDate} at ${formattedTime}
                    </div>
                    
                    <div class="event-details__meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        ${currentEvent.location}
                    </div>
                    
                    <div class="event-details__meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                            <path d="M18 12a2 2 0 0 0 0 4h4v-4z"></path>
                        </svg>
                        General: $${currentEvent.tickets.general.price.toFixed(2)} | VIP: $${currentEvent.tickets.vip.price.toFixed(2)}
                    </div>
                </div>
                
                <div class="event-details__description">
                    ${currentEvent.description}
                </div>
                
                <div class="event-details__organizer">
                    <img src="images/organizer.png" alt="${currentEvent.organizer.name}" class="event-details__organizer-avatar">
                    <div>
                        <p class="event-details__organizer-name">Organized by ${currentEvent.organizer.name}</p>
                        <p class="event-details__organizer-contact">Contact: ${currentEvent.organizer.email}</p>
                    </div>
                </div>
            </div>
        `

    // Update total price
    updateTotalPrice()
  }

  // Function to update total price
  function updateTotalPrice() {
    if (!currentEvent) return

    const ticketType = ticketTypeSelect.value
    const quantity = Number.parseInt(ticketQuantitySelect.value)

    let price = 0
    if (ticketType === "general") {
      price = currentEvent.tickets.general.price
    } else if (ticketType === "vip") {
      price = currentEvent.tickets.vip.price
    }

    const totalPrice = price * quantity
    totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`
  }
})
