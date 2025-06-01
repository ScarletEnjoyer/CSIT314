// Organizer Events page script
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const eventsTableBody = document.getElementById("events-table-body")
  const statusFilter = document.getElementById("status-filter")
  const eventSearch = document.getElementById("event-search")

  // Get organizer ID from session storage
  const organizerId = sessionStorage.getItem("organizerId")

  // Check if organizer is logged in
  if (!organizerId) {
    window.location.href = "organizer-login.html"
    return
  }

  // Load events
  loadEvents()

  // Event listeners
  statusFilter.addEventListener("change", loadEvents)
  eventSearch.addEventListener("input", loadEvents)

  // Function to load events
  function loadEvents() {
    // Get organizer
    const organizer = window.dataService.getOrganizer(Number.parseInt(organizerId))

    if (!organizer) {
      // Handle case where organizer is not found
      alert("Organizer not found. Please log in again.")
      sessionStorage.removeItem("organizerId")
      window.location.href = "organizer-login.html"
      return
    }

    // Get organizer's events
    const allEvents = window.dataService.getEvents()
    let organizerEvents = allEvents.filter((event) => event.organizer.id === Number.parseInt(organizerId))

    // Apply filters
    organizerEvents = filterEvents(organizerEvents)

    // Display events
    displayEvents(organizerEvents)
  }

  // Function to filter events
  function filterEvents(events) {
    const status = statusFilter.value
    const searchTerm = eventSearch.value.toLowerCase()
    const currentDate = new Date()

    return events.filter((event) => {
      // Filter by status
      const eventDate = new Date(event.date + "T" + event.time)
      let statusMatch = true

      if (status === "upcoming") {
        statusMatch = eventDate > currentDate
      } else if (status === "ongoing") {
        // For simplicity, consider an event "ongoing" if it's today
        const today = new Date()
        statusMatch = eventDate.toDateString() === today.toDateString()
      } else if (status === "past") {
        statusMatch = eventDate < currentDate
      }

      // Filter by search term
      const searchMatch =
        event.title.toLowerCase().includes(searchTerm) || event.location.toLowerCase().includes(searchTerm)

      return statusMatch && searchMatch
    })
  }

  // Function to display events
  function displayEvents(events) {
    // Clear table
    eventsTableBody.innerHTML = ""

    if (events.length === 0) {
      const row = document.createElement("tr")
      row.innerHTML = '<td colspan="6">No events found.</td>'
      eventsTableBody.appendChild(row)
      return
    }

    // Sort events by date (newest first)
    events.sort((a, b) => {
      return new Date(b.date + "T" + b.time) - new Date(a.date + "T" + a.time)
    })

    // Create table rows
    events.forEach((event) => {
      const row = createEventRow(event)
      eventsTableBody.appendChild(row)
    })
  }

  // Function to create an event row
  function createEventRow(event) {
    const row = document.createElement("tr")

    // Format date
    const eventDate = new Date(event.date + "T" + event.time)
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

    // Determine event status
    const currentDate = new Date()
    let status = ""
    let statusClass = ""

    if (eventDate > currentDate) {
      status = "Upcoming"
      statusClass = "events-management__status--upcoming"
    } else if (eventDate.toDateString() === currentDate.toDateString()) {
      status = "Ongoing"
      statusClass = "events-management__status--ongoing"
    } else {
      status = "Past"
      statusClass = "events-management__status--past"
    }

    // Get registrations count
    const registrations = window.dataService.getRegistrationsByEvent(event.id)
    const registrationsCount = registrations.length

    // Create row content
    row.innerHTML = `
            <td>${event.title}</td>
            <td>${formattedDate}</td>
            <td>${event.location}</td>
            <td>${registrationsCount}</td>
            <td><span class="events-management__status ${statusClass}">${status}</span></td>
            <td class="events-management__actions">
                <button class="events-management__action-button events-management__action-button--view" data-event-id="${event.id}">View</button>
                <button class="events-management__action-button events-management__action-button--edit" data-event-id="${event.id}">Edit</button>
                <button class="events-management__action-button events-management__action-button--delete" data-event-id="${event.id}">Delete</button>
            </td>
        `

    // Add event listeners to buttons
    const viewButton = row.querySelector(".events-management__action-button--view")
    const editButton = row.querySelector(".events-management__action-button--edit")
    const deleteButton = row.querySelector(".events-management__action-button--delete")

    viewButton.addEventListener("click", () => {
      window.open(`event-details.html?id=${event.id}`, "_blank")
    })

    editButton.addEventListener("click", () => {
      // Store event ID for editing
      sessionStorage.setItem("editEventId", event.id)
      window.location.href = "organizer-create-event.html"
    })

    deleteButton.addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
        // Delete event
        window.dataService.deleteEvent(event.id)

        // Reload events
        loadEvents()
      }
    })

    return row
  }
})
