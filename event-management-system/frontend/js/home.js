// Home page script
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const eventsContainer = document.getElementById("events-container")
  const searchKeyword = document.getElementById("search-keyword")
  const filterCategory = document.getElementById("filter-category")
  const filterDate = document.getElementById("filter-date")
  const filterPrice = document.getElementById("filter-price")
  const searchButton = document.getElementById("search-button")
  const loadMoreButton = document.getElementById("load-more")

  // Variables for pagination
  let currentPage = 1
  const eventsPerPage = 6
  let filteredEvents = []

  // Load events on page load
  loadEvents()

  // Event listeners
  searchButton.addEventListener("click", () => {
    currentPage = 1
    loadEvents()
  })

  loadMoreButton.addEventListener("click", () => {
    currentPage++
    loadEvents(true)
  })

  // Real-time search as user types
  searchKeyword.addEventListener("input", () => {
    currentPage = 1
    loadEvents()
  })

  filterCategory.addEventListener("change", () => {
    currentPage = 1
    loadEvents()
  })

  filterDate.addEventListener("change", () => {
    currentPage = 1
    loadEvents()
  })

  filterPrice.addEventListener("change", () => {
    currentPage = 1
    loadEvents()
  })

  // Function to load events
  function loadEvents(append = false) {
    // Get all events
    const allEvents = window.dataService.getEvents()

    // Apply filters
    filteredEvents = filterEvents(allEvents)

    // Calculate pagination
    const startIndex = (currentPage - 1) * eventsPerPage
    const endIndex = startIndex + eventsPerPage
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

    // Clear container if not appending
    if (!append) {
      eventsContainer.innerHTML = ""
    }

    // Check if there are events to display
    if (paginatedEvents.length === 0 && !append) {
      eventsContainer.innerHTML = '<p class="events__no-results">No events found matching your criteria.</p>'
      loadMoreButton.style.display = "none"
      return
    }

    // Render events
    paginatedEvents.forEach((event) => {
      const eventCard = createEventCard(event)
      eventsContainer.appendChild(eventCard)
    })

    // Show/hide load more button
    if (endIndex >= filteredEvents.length) {
      loadMoreButton.style.display = "none"
    } else {
      loadMoreButton.style.display = "block"
    }
  }

  // Function to filter events based on search criteria
  function filterEvents(events) {
    return events.filter((event) => {
      // Filter by keyword
      const keyword = searchKeyword.value.toLowerCase()
      const matchesKeyword =
        event.title.toLowerCase().includes(keyword) ||
        event.description.toLowerCase().includes(keyword) ||
        event.location.toLowerCase().includes(keyword)

      // Filter by category
      const category = filterCategory.value
      const matchesCategory = category === "" || event.category === category

      // Filter by date
      const date = filterDate.value
      const matchesDate = date === "" || event.date === date

      // Filter by price
      const price = filterPrice.value
      let matchesPrice = true

      if (price === "free") {
        matchesPrice = event.tickets.general.price === 0
      } else if (price === "paid") {
        matchesPrice = event.tickets.general.price > 0 && event.tickets.general.price <= 100
      } else if (price === "premium") {
        matchesPrice = event.tickets.general.price > 100
      }

      return matchesKeyword && matchesCategory && matchesDate && matchesPrice
    })
  }

  // Function to create an event card
  function createEventCard(event) {
    const eventCard = document.createElement("div")
    eventCard.className = "event-card"
    eventCard.dataset.eventId = event.id

    // Format date
    const eventDate = new Date(event.date + "T" + event.time)
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Format price
    const generalPrice = event.tickets.general.price
    const formattedPrice = generalPrice === 0 ? "Free" : `$${generalPrice.toFixed(2)}`

    // Create card content
    eventCard.innerHTML = `
            <img src="${event.image}" alt="${event.title}" class="event-card__image" loading="lazy">
            <div class="event-card__content">
                <span class="event-card__category">${capitalizeFirstLetter(event.category)}</span>
                <h3 class="event-card__title">${event.title}</h3>
                <div class="event-card__date">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    ${formattedDate}
                </div>
                <div class="event-card__location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${event.location}
                </div>
                <div class="event-card__price">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    Starting at ${formattedPrice}
                </div>
                <button class="button button--primary event-card__button">View Details</button>
            </div>
        `

    // Add event listener to the button
    const viewButton = eventCard.querySelector(".event-card__button")
    viewButton.addEventListener("click", () => {
      window.location.href = `event-details.html?id=${event.id}`
    })

    return eventCard
  }

  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
})
