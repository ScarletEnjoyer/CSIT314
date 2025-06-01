// Organizer Create Event page script
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const createEventForm = document.getElementById('create-event-form');
    const cancelButton = document.getElementById('cancel-button');
    
    // Get organizer ID from session storage
    const organizerId = sessionStorage.getItem('organizerId');
    
    // Check if organizer is logged in
    if (!organizerId) {
        window.location.href = 'organizer-login.html';
        return;
    }
    
    // Check if we're editing an existing event
    const editEventId = sessionStorage.getItem('editEventId');
    let isEditing = false;
    let currentEvent = null;
    
    if (editEventId) {
        isEditing = true;
        currentEvent = window.dataService.getEvent(Number.parseInt(editEventId));
        
        if (currentEvent) {
            // Populate form with event data
            populateForm(currentEvent);
            
            // Update page title and button text
            document.querySelector('.create-event__title').textContent = 'Edit Event';
            document.querySelector('button[type="submit"]').textContent = 'Update Event';
        }
    }
    
    // Event listeners
    cancelButton.addEventListener('click', () => {
        // Clear edit event ID if it exists
        sessionStorage.removeItem('editEventId');
        
        // Go back to events page
        window.location.href = 'organizer-events.html';
    });
    
    createEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(createEventForm);
        
        // Validate form data
        if (!validateForm(formData)) {
            return;
        }
        
        // Get organizer information
        const organizer = window.dataService.getOrganizer(Number.parseInt(organizerId));
        
        if (!organizer) {
            alert('Organizer not found. Please log in again.');
            window.location.href = 'organizer-login.html';
            return;
        }
        
        // Create event object
        const event = {
            title: formData.get('eventName').trim(),
            description: formData.get('eventDescription').trim(),
            date: formData.get('eventDate'),
            time: formData.get('eventTime'),
            location: formData.get('eventLocation').trim(),
            category: formData.get('eventCategory'),
            image: generateEventImage(formData.get('eventCategory')),
            organizer: {
                id: organizer.id,
                name: organizer.name,
                email: organizer.email
            },
            tickets: {
                general: {
                    price: Number.parseFloat(formData.get('generalPrice')),
                    capacity: Number.parseInt(formData.get('generalCapacity')),
                    remaining: Number.parseInt(formData.get('generalCapacity'))
                },
                vip: {
                    price: Number.parseFloat(formData.get('vipPrice')),
                    capacity: Number.parseInt(formData.get('vipCapacity')),
                    remaining: Number.parseInt(formData.get('vipCapacity'))
                }
            },
            attendees: currentEvent ? currentEvent.attendees : []
        };
        
        // If editing, preserve the original ID
        if (isEditing && currentEvent) {
            event.id = currentEvent.id;
            
            // Preserve remaining ticket counts if there are existing registrations
            if (currentEvent.attendees.length > 0) {
                event.tickets.general.remaining = currentEvent.tickets.general.remaining;
                event.tickets.vip.remaining = currentEvent.tickets.vip.remaining;
            }
        }
        
        try {
            // Save event
            const savedEvent = window.dataService.saveEvent(event);
            
            // Update organizer's events list if creating new event
            if (!isEditing) {
                if (!organizer.events) {
                    organizer.events = [];
                }
                organizer.events.push(savedEvent.id);
                window.dataService.saveOrganizer(organizer);
            }
            
            // Clear edit event ID
            sessionStorage.removeItem('editEventId');
            
            // Show success message
            alert(isEditing ? 'Event updated successfully!' : 'Event created successfully!');
            
            // Redirect to events page
            window.location.href = 'organizer-events.html';
            
        } catch (error) {
            console.error('Error saving event:', error);
            alert('An error occurred while saving the event. Please try again.');
        }
    });
    
    // Function to populate form with event data (for editing)
    function populateForm(event) {
        document.getElementById('event-name').value = event.title;
        document.getElementById('event-category').value = event.category;
        document.getElementById('event-description').value = event.description;
        document.getElementById('event-date').value = event.date;
        document.getElementById('event-time').value = event.time;
        document.getElementById('event-location').value = event.location;
        document.getElementById('general-price').value = event.tickets.general.price;
        document.getElementById('general-capacity').value = event.tickets.general.capacity;
        document.getElementById('vip-price').value = event.tickets.vip.price;
        document.getElementById('vip-capacity').value = event.tickets.vip.capacity;
    }
    
    // Function to validate form data
    function validateForm(formData) {
        const requiredFields = [
            'eventName',
            'eventCategory', 
            'eventDescription',
            'eventDate',
            'eventTime',
            'eventLocation',
            'generalPrice',
            'generalCapacity',
            'vipPrice',
            'vipCapacity'
        ];
        
        // Check required fields
        for (const field of requiredFields) {
            const value = formData.get(field);
            if (!value || value.toString().trim() === '') {
                alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
                return false;
            }
        }
        
        // Validate date is not in the past
        const eventDate = new Date(formData.get('eventDate') + 'T' + formData.get('eventTime'));
        const now = new Date();
        
        if (eventDate <= now) {
            alert('Event date and time must be in the future.');
            return false;
        }
        
        // Validate prices are non-negative
        const generalPrice = Number.parseFloat(formData.get('generalPrice'));
        const vipPrice = Number.parseFloat(formData.get('vipPrice'));
        
        if (generalPrice < 0 || vipPrice < 0) {
            alert('Ticket prices cannot be negative.');
            return false;
        }
        
        // Validate capacities are positive
        const generalCapacity = Number.parseInt(formData.get('generalCapacity'));
        const vipCapacity = Number.parseInt(formData.get('vipCapacity'));
        
        if (generalCapacity <= 0) {
            alert('General admission capacity must be at least 1.');
            return false;
        }
        
        if (vipCapacity < 0) {
            alert('VIP capacity cannot be negative.');
            return false;
        }
        
        // Validate VIP price is not less than general price (optional business rule)
        if (vipPrice > 0 && vipPrice < generalPrice) {
            const confirmContinue = confirm('VIP price is lower than general price. Do you want to continue?');
            if (!confirmContinue) {
                return false;
            }
        }
        
        return true;
    }
    
    // Function to generate event image based on category
    function generateEventImage(category) {
        const imageMap = {
            'conference': 'images/tech_conference_2023.jpg',
            'concert': 'images/summer_music_festival.jpg',
            'networking': 'images/business_networking_lunch.jpg',
            'workshop': 'images/web_development_workshop.jpg'
        };
        
        return imageMap[category] || 'images/tech_conference_2023.jpg';
    }
    
    // Set minimum date to today
    const eventDateInput = document.getElementById('event-date');
    const today = new Date().toISOString().split('T')[0];
    eventDateInput.min = today;
    
    // Set minimum time if date is today
    const eventTimeInput = document.getElementById('event-time');
    
    eventDateInput.addEventListener('change', () => {
        const selectedDate = new Date(eventDateInput.value);
        const todayDate = new Date();
        
        // Reset time constraints
        eventTimeInput.min = '';
        
        // If selected date is today, set minimum time to current time
        if (selectedDate.toDateString() === todayDate.toDateString()) {
            const currentTime = todayDate.toTimeString().slice(0, 5);
            eventTimeInput.min = currentTime;
            
            // If current time value is less than minimum, clear it
            if (eventTimeInput.value && eventTimeInput.value < currentTime) {
                eventTimeInput.value = '';
            }
        }
    });
    
    // Real-time form validation feedback
    const form = document.getElementById('create-event-form');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateField(input);
        });
        
        input.addEventListener('input', () => {
            // Clear any previous error styling
            input.classList.remove('error');
        });
    });
    
    // Function to validate individual field
    function validateField(field) {
        let isValid = true;
        let errorMessage = '';
        
        // Remove existing error styling
        field.classList.remove('error');
        
        // Check if field is required and empty
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'This field is required.';
        }
        
        // Specific validations
        switch (field.type) {
            case 'email':
                if (field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address.';
                }
                break;
                
            case 'number':
                if (field.value && Number.parseFloat(field.value) < 0) {
                    isValid = false;
                    errorMessage = 'Value cannot be negative.';
                }
                break;
                
            case 'date':
                if (field.value) {
                    const selectedDate = new Date(field.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDate < today) {
                        isValid = false;
                        errorMessage = 'Date cannot be in the past.';
                    }
                }
                break;
        }
        
        // Apply error styling if needed
        if (!isValid) {
            field.classList.add('error');
            
            // You could also show error message in a tooltip or dedicated error element
            field.title = errorMessage;
        } else {
            field.title = '';
        }
        
        return isValid;
    }
});