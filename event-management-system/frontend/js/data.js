// Mock data for the Event Management System
// This file simulates a database using localStorage

// Initialize data if it doesn't exist
function initializeData() {
  // Check if data already exists
  if (!localStorage.getItem("events")) {
    // Sample events data
    const events = [
      {
        id: 1,
        title: "Tech Conference 2023",
        description:
          "Join us for the biggest tech conference of the year. Learn from industry experts and network with professionals.",
        date: "2023-12-15",
        time: "09:00",
        location: "Convention Center, New York",
        image: "images/tech_conference_2023.jpg",
        category: "conference",
        organizer: {
          id: 1,
          name: "Tech Events Inc.",
          email: "organizer@techevents.com",
        },
        tickets: {
          general: {
            price: 50,
            capacity: 500,
            remaining: 350,
          },
          vip: {
            price: 150,
            capacity: 100,
            remaining: 75,
          },
        },
        attendees: [],
      },
      {
        id: 2,
        title: "Summer Music Festival",
        description:
          "A three-day music festival featuring top artists from around the world. Food, drinks, and camping available.",
        date: "2023-07-20",
        time: "14:00",
        location: "Central Park, New York",
        image: "images/summer_music_festival.jpg",
        category: "concert",
        organizer: {
          id: 2,
          name: "Music Festivals LLC",
          email: "info@musicfestivals.com",
        },
        tickets: {
          general: {
            price: 75,
            capacity: 2000,
            remaining: 1200,
          },
          vip: {
            price: 250,
            capacity: 300,
            remaining: 150,
          },
        },
        attendees: [],
      },
      {
        id: 3,
        title: "Business Networking Lunch",
        description:
          "Connect with local business leaders and entrepreneurs over lunch. Great opportunity for networking and collaboration.",
        date: "2023-06-10",
        time: "12:00",
        location: "Grand Hotel, Boston",
        image: "images/business_networking_lunch.jpg",
        category: "networking",
        organizer: {
          id: 3,
          name: "Business Network Association",
          email: "contact@bna.com",
        },
        tickets: {
          general: {
            price: 30,
            capacity: 100,
            remaining: 65,
          },
          vip: {
            price: 75,
            capacity: 20,
            remaining: 10,
          },
        },
        attendees: [],
      },
      {
        id: 4,
        title: "Web Development Workshop",
        description:
          "Learn the latest web development techniques and tools in this hands-on workshop. Suitable for beginners and intermediate developers.",
        date: "2023-08-05",
        time: "10:00",
        location: "Tech Hub, San Francisco",
        image: "images/web_development_workshop.jpg",
        category: "workshop",
        organizer: {
          id: 4,
          name: "Code Academy",
          email: "workshops@codeacademy.com",
        },
        tickets: {
          general: {
            price: 25,
            capacity: 50,
            remaining: 30,
          },
          vip: {
            price: 60,
            capacity: 10,
            remaining: 5,
          },
        },
        attendees: [],
      },
      {
        id: 5,
        title: "Startup Pitch Competition",
        description:
          "Watch innovative startups pitch their ideas to a panel of investors. Networking reception to follow.",
        date: "2023-09-20",
        time: "18:00",
        location: "Innovation Center, Austin",
        image: "images/startup_pitch_competition.jpg",
        category: "networking",
        organizer: {
          id: 5,
          name: "Startup Accelerator",
          email: "events@startupaccelerator.com",
        },
        tickets: {
          general: {
            price: 15,
            capacity: 200,
            remaining: 120,
          },
          vip: {
            price: 50,
            capacity: 30,
            remaining: 15,
          },
        },
        attendees: [],
      },
      {
        id: 6,
        title: "AI and Machine Learning Conference",
        description:
          "Explore the latest advancements in artificial intelligence and machine learning with leading researchers and practitioners.",
        date: "2023-11-10",
        time: "09:30",
        location: "Science Center, Seattle",
        image: "images/ai_machine_learning_conference.jpg",
        category: "conference",
        organizer: {
          id: 1,
          name: "Tech Events Inc.",
          email: "organizer@techevents.com",
        },
        tickets: {
          general: {
            price: 60,
            capacity: 300,
            remaining: 200,
          },
          vip: {
            price: 180,
            capacity: 50,
            remaining: 30,
          },
        },
        attendees: [],
      },
    ]

    // Sample organizers data
    const organizers = [
      {
        id: 1,
        name: "Tech Events Inc.",
        email: "organizer@techevents.com",
        password: "password123", // In a real app, this would be hashed
        events: [1, 6],
      },
      {
        id: 2,
        name: "Music Festivals LLC",
        email: "info@musicfestivals.com",
        password: "password123",
        events: [2],
      },
      {
        id: 3,
        name: "Business Network Association",
        email: "contact@bna.com",
        password: "password123",
        events: [3],
      },
      {
        id: 4,
        name: "Code Academy",
        email: "workshops@codeacademy.com",
        password: "password123",
        events: [4],
      },
      {
        id: 5,
        name: "Startup Accelerator",
        email: "events@startupaccelerator.com",
        password: "password123",
        events: [5],
      },
    ]

    // Sample users data
    const users = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        registrations: [],
      },
    ]

    // Sample notifications data
    const notifications = [
      {
        id: 1,
        userId: 1,
        title: "Welcome to EventHub!",
        content: "Thank you for joining EventHub. Start exploring events now!",
        date: "2023-05-01",
        read: false,
      },
    ]

    // Store data in localStorage
    localStorage.setItem("events", JSON.stringify(events))
    localStorage.setItem("organizers", JSON.stringify(organizers))
    localStorage.setItem("users", JSON.stringify(users))
    localStorage.setItem("notifications", JSON.stringify(notifications))
    localStorage.setItem("registrations", JSON.stringify([]))
    localStorage.setItem("nextEventId", "7")
    localStorage.setItem("nextOrganizerId", "6")
    localStorage.setItem("nextUserId", "2")
    localStorage.setItem("nextNotificationId", "2")
    localStorage.setItem("nextRegistrationId", "1")
  }
}

// Call the initialization function
initializeData()

// Data access functions
function getEvents() {
  return JSON.parse(localStorage.getItem("events") || "[]")
}

function getEvent(id) {
  const events = getEvents()
  return events.find((event) => event.id === Number.parseInt(id))
}

function saveEvent(event) {
  const events = getEvents()
  const index = events.findIndex((e) => e.id === event.id)

  if (index !== -1) {
    // Update existing event
    events[index] = event
  } else {
    // Add new event
    const nextId = Number.parseInt(localStorage.getItem("nextEventId") || "1")
    event.id = nextId
    events.push(event)
    localStorage.setItem("nextEventId", (nextId + 1).toString())
  }

  localStorage.setItem("events", JSON.stringify(events))
  return event
}

function deleteEvent(id) {
  const events = getEvents()
  const filteredEvents = events.filter((event) => event.id !== Number.parseInt(id))
  localStorage.setItem("events", JSON.stringify(filteredEvents))
}

function getOrganizers() {
  return JSON.parse(localStorage.getItem("organizers") || "[]")
}

function getOrganizer(id) {
  const organizers = getOrganizers()
  return organizers.find((organizer) => organizer.id === Number.parseInt(id))
}

function getOrganizerByEmail(email) {
  const organizers = getOrganizers()
  return organizers.find((organizer) => organizer.email === email)
}

function saveOrganizer(organizer) {
  const organizers = getOrganizers()
  const index = organizers.findIndex((o) => o.id === organizer.id)

  if (index !== -1) {
    // Update existing organizer
    organizers[index] = organizer
  } else {
    // Add new organizer
    const nextId = Number.parseInt(localStorage.getItem("nextOrganizerId") || "1")
    organizer.id = nextId
    organizers.push(organizer)
    localStorage.setItem("nextOrganizerId", (nextId + 1).toString())
  }

  localStorage.setItem("organizers", JSON.stringify(organizers))
  return organizer
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]")
}

function getUser(id) {
  const users = getUsers()
  return users.find((user) => user.id === Number.parseInt(id))
}

function getUserByEmail(email) {
  const users = getUsers()
  return users.find((user) => user.email === email)
}

function saveUser(user) {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === user.id)

  if (index !== -1) {
    // Update existing user
    users[index] = user
  } else {
    // Add new user
    const nextId = Number.parseInt(localStorage.getItem("nextUserId") || "1")
    user.id = nextId
    users.push(user)
    localStorage.setItem("nextUserId", (nextId + 1).toString())
  }

  localStorage.setItem("users", JSON.stringify(users))
  return user
}

function getNotifications() {
  return JSON.parse(localStorage.getItem("notifications") || "[]")
}

function getNotificationsByUser(userId) {
  const notifications = getNotifications()
  return notifications.filter((notification) => notification.userId === Number.parseInt(userId))
}

function saveNotification(notification) {
  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === notification.id)

  if (index !== -1) {
    // Update existing notification
    notifications[index] = notification
  } else {
    // Add new notification
    const nextId = Number.parseInt(localStorage.getItem("nextNotificationId") || "1")
    notification.id = nextId
    notifications.push(notification)
    localStorage.setItem("nextNotificationId", (nextId + 1).toString())
  }

  localStorage.setItem("notifications", JSON.stringify(notifications))
  return notification
}

function getRegistrations() {
  return JSON.parse(localStorage.getItem("registrations") || "[]")
}

function getRegistrationsByUser(userId) {
  const registrations = getRegistrations()
  return registrations.filter((registration) => registration.userId === Number.parseInt(userId))
}

function getRegistrationsByEvent(eventId) {
  const registrations = getRegistrations()
  return registrations.filter((registration) => registration.eventId === Number.parseInt(eventId))
}

function saveRegistration(registration) {
  const registrations = getRegistrations()
  const index = registrations.findIndex((r) => r.id === registration.id)

  if (index !== -1) {
    // Update existing registration
    registrations[index] = registration
  } else {
    // Add new registration
    const nextId = Number.parseInt(localStorage.getItem("nextRegistrationId") || "1")
    registration.id = nextId
    registrations.push(registration)
    localStorage.setItem("nextRegistrationId", (nextId + 1).toString())

    // Update event attendees
    const event = getEvent(registration.eventId)
    if (event) {
      event.attendees.push({
        userId: registration.userId,
        registrationId: registration.id,
      })
      saveEvent(event)

      // Update ticket count
      if (registration.ticketType === "general") {
        event.tickets.general.remaining -= registration.quantity
      } else if (registration.ticketType === "vip") {
        event.tickets.vip.remaining -= registration.quantity
      }
      saveEvent(event)
    }

    // Update user registrations
    const user = getUser(registration.userId)
    if (user) {
      user.registrations.push(registration.id)
      saveUser(user)
    }
  }

  localStorage.setItem("registrations", JSON.stringify(registrations))
  return registration
}

// Export functions for use in other scripts
window.dataService = {
  getEvents,
  getEvent,
  saveEvent,
  deleteEvent,
  getOrganizers,
  getOrganizer,
  getOrganizerByEmail,
  saveOrganizer,
  getUsers,
  getUser,
  getUserByEmail,
  saveUser,
  getNotifications,
  getNotificationsByUser,
  saveNotification,
  getRegistrations,
  getRegistrationsByUser,
  getRegistrationsByEvent,
  saveRegistration,
}
