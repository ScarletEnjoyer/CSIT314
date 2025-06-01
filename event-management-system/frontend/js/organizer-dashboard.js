// Organizer Dashboard page script
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const organizerNameElement = document.getElementById("organizer-name")
  const totalEventsElement = document.getElementById("total-events")
  const totalAttendeesElement = document.getElementById("total-attendees")
  const totalRevenueElement = document.getElementById("total-revenue")
  const recentRegistrationsElement = document.getElementById("recent-registrations")
  const exportAttendeesButton = document.getElementById("export-attendees")

  // Get organizer ID from session storage
  const organizerId = sessionStorage.getItem("organizerId")

  // Check if organizer is logged in
  if (!organizerId) {
    window.location.href = "organizer-login.html"
    return
  }

  // Load organizer data
  loadOrganizerData()

  // Event listener for export attendees button
  exportAttendeesButton.addEventListener("click", exportAttendees)

  // Function to load organizer data
  function loadOrganizerData() {
    // Get organizer
    const organizer = window.dataService.getOrganizer(Number.parseInt(organizerId))

    if (!organizer) {
      // Handle case where organizer is not found
      alert("Organizer not found. Please log in again.")
      sessionStorage.removeItem("organizerId")
      window.location.href = "organizer-login.html"
      return
    }

    // Display organizer name
    organizerNameElement.textContent = organizer.name

    // Get organizer's events
    const allEvents = window.dataService.getEvents()
    const organizerEvents = allEvents.filter((event) => event.organizer.id === Number.parseInt(organizerId))

    // Calculate statistics
    let totalAttendees = 0
    let totalRevenue = 0
    const recentRegistrations = []

    organizerEvents.forEach((event) => {
      // Count attendees
      totalAttendees += event.attendees.length

      // Calculate revenue
      const registrations = window.dataService.getRegistrationsByEvent(event.id)
      registrations.forEach((registration) => {
        totalRevenue += registration.totalPrice

        // Add to recent registrations
        recentRegistrations.push({
          registration,
          event,
        })
      })
    })

    // Sort recent registrations by date (newest first)
    recentRegistrations.sort((a, b) => {
      return new Date(b.registration.purchaseDate) - new Date(a.registration.purchaseDate)
    })

    // Display statistics
    totalEventsElement.textContent = organizerEvents.length
    totalAttendeesElement.textContent = totalAttendees
    totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`

    // Display recent registrations
    if (recentRegistrations.length === 0) {
      recentRegistrationsElement.innerHTML = "<p>No registrations yet.</p>"
    } else {
      recentRegistrationsElement.innerHTML = ""

      // Display only the 5 most recent registrations
      const displayRegistrations = recentRegistrations.slice(0, 5)

      displayRegistrations.forEach((item) => {
        const registrationElement = createRegistrationElement(item.registration, item.event)
        recentRegistrationsElement.appendChild(registrationElement)
      })
    }
  }

  // Function to create a registration element
  function createRegistrationElement(registration, event) {
    const registrationElement = document.createElement("div")
    registrationElement.className = "dashboard__recent-item"

    // Format date
    const registrationDate = new Date(registration.purchaseDate)
    const formattedDate = registrationDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    // Create element content
    registrationElement.innerHTML = `
            <div class="dashboard__recent-info">
                <span class="dashboard__recent-name">${registration.attendeeInfo.name}</span>
                <span class="dashboard__recent-event">${event.title}</span>
            </div>
            <span class="dashboard__recent-date">${formattedDate}</span>
        `

    return registrationElement
  }

  // Function to export attendees
  function exportAttendees() {
    // Get organizer's events
    const allEvents = window.dataService.getEvents()
    const organizerEvents = allEvents.filter((event) => event.organizer.id === Number.parseInt(organizerId))

    // Prepare CSV data
    let csvContent = "Event,Attendee Name,Email,Phone,Ticket Type,Quantity,Purchase Date\n"

    organizerEvents.forEach((event) => {
      const registrations = window.dataService.getRegistrationsByEvent(event.id)

      registrations.forEach((registration) => {
        const purchaseDate = new Date(registration.purchaseDate).toLocaleDateString()

        csvContent += `"${event.title}","${registration.attendeeInfo.name}","${registration.attendeeInfo.email}","${registration.attendeeInfo.phone}","${registration.ticketType === "general" ? "General" : "VIP"}",${registration.quantity},"${purchaseDate}"\n`
      })
    })

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "attendees.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
})
