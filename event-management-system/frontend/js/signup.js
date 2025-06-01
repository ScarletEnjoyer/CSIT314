// User Signup page script
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const signupForm = document.getElementById('signup-form');
    const signupBtn = document.getElementById('signup-btn');
    const loginLink = document.getElementById('login-link');
    const loginModal = document.getElementById('login-modal');
    const accountTypeRadios = document.querySelectorAll('input[name="accountType"]');
    
    // Error display elements
    const errorElements = {
        name: document.getElementById('name-error'),
        email: document.getElementById('email-error'),
        password: document.getElementById('password-error'),
        confirmPassword: document.getElementById('confirm-password-error'),
        phone: document.getElementById('phone-error'),
        terms: document.getElementById('terms-error'),
        accountType: document.getElementById('account-type-error'),
        general: document.getElementById('signup-error')
    };
    
    const successElement = document.getElementById('signup-success');
    
    // Event listeners
    signupForm.addEventListener('submit', handleSignup);
    loginLink.addEventListener('click', showLoginModal);
    
    // Account type change listener
    accountTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleAccountTypeChange);
    });
    
    // Real-time validation
    document.getElementById('full-name').addEventListener('blur', () => validateField('name'));
    document.getElementById('email').addEventListener('blur', () => validateField('email'));
    document.getElementById('password').addEventListener('blur', () => validateField('password'));
    document.getElementById('confirm-password').addEventListener('blur', () => validateField('confirmPassword'));
    document.getElementById('phone').addEventListener('blur', () => validateField('phone'));
    document.getElementById('terms').addEventListener('change', () => validateField('terms'));
    
    // Clear errors on input
    Object.keys(errorElements).forEach(field => {
        const input = document.getElementById(field === 'confirmPassword' ? 'confirm-password' : 
                                           field === 'name' ? 'full-name' : field);
        if (input) {
            input.addEventListener('input', () => clearError(field));
        }
    });
    
    // Handle account type change
    function handleAccountTypeChange() {
        const selectedType = document.querySelector('input[name="accountType"]:checked')?.value;
        const organizerFields = document.getElementById('organizer-fields');
        
        if (selectedType === 'organizer') {
            organizerFields.style.display = 'block';
            // Make organizer fields required
            document.getElementById('company-name').required = true;
            document.getElementById('business-email').required = true;
        } else {
            organizerFields.style.display = 'none';
            // Remove required attribute from organizer fields
            document.getElementById('company-name').required = false;
            document.getElementById('business-email').required = false;
        }
        clearError('accountType');
    }
    
    // Main signup handler
    async function handleSignup(e) {
        e.preventDefault();
        
        // Clear previous messages
        clearAllErrors();
        successElement.textContent = '';
        
        // Validate all fields
        const isValid = validateAllFields();
        if (!isValid) {
            return;
        }
        
        // Get form data
        const formData = new FormData(signupForm);
        const accountType = formData.get('accountType');
        
        const userData = {
            name: formData.get('fullName').trim(),
            email: formData.get('email').trim().toLowerCase(),
            password: formData.get('password'),
            phone: formData.get('phone').trim() || null,
            accountType: accountType
        };
        
        // Add organizer-specific fields if needed
        if (accountType === 'organizer') {
            userData.companyName = formData.get('companyName').trim();
            userData.businessEmail = formData.get('businessEmail').trim().toLowerCase();
        }
        
        try {
            // Disable form during submission
            setFormLoading(true);
            
            let result;
            
            if (accountType === 'organizer') {
                // Register as organizer
                result = await registerOrganizer(userData);
            } else {
                // Register as regular user
                result = await registerUser(userData);
            }
            
            if (result && result.success) {
                // Show success message
                successElement.textContent = `${accountType === 'organizer' ? 'Organizer' : 'User'} account created successfully! Redirecting...`;
                successElement.style.color = 'var(--color-success)';
                
                // Redirect based on account type
                setTimeout(() => {
                    if (accountType === 'organizer') {
                        window.location.href = 'organizer-login.html';
                    } else {
                        // Store user session and redirect to home
                        localStorage.setItem('loggedInUser', JSON.stringify(result.user));
                        window.location.href = 'index.html';
                    }
                }, 1500);
            } else {
                showError('general', result.message || 'Failed to create account. Please try again.');
            }
            
        } catch (error) {
            console.error('Signup error:', error);
            showError('general', error.message || 'An error occurred during signup. Please try again.');
        } finally {
            setFormLoading(false);
        }
    }
    
    // Register regular user
    async function registerUser(userData) {
        try {
            // Check if user already exists
            const existingUser = window.dataService.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('An account with this email already exists.');
            }
            
            // Create new user using API service
            const newUser = await window.API.register(userData);
            
            if (newUser && newUser.user) {
                // Create welcome notification
                const notification = {
                    userId: newUser.user.id,
                    title: 'Welcome to EventHub!',
                    content: 'Your account has been created successfully. Start exploring amazing events!',
                    date: new Date().toISOString(),
                    read: false
                };
                window.dataService.saveNotification(notification);
                
                return { success: true, user: newUser.user };
            } else {
                return { success: false, message: 'Failed to create user account.' };
            }
        } catch (error) {
            throw error;
        }
    }
    
    // Register organizer
    async function registerOrganizer(userData) {
        try {
            // Check if organizer already exists
            const existingOrganizer = window.dataService.getOrganizerByEmail(userData.businessEmail);
            if (existingOrganizer) {
                throw new Error('An organizer account with this business email already exists.');
            }
            
            // Check if regular user with same email exists
            const existingUser = window.dataService.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('An account with this personal email already exists.');
            }
            
            // Create organizer object
            const organizerData = {
                name: userData.companyName,
                email: userData.businessEmail,
                password: userData.password, // In real app, this would be hashed
                contactPerson: userData.name,
                contactPhone: userData.phone,
                events: []
            };
            
            // Save organizer using data service
            const savedOrganizer = window.dataService.saveOrganizer(organizerData);
            
            return { 
                success: true, 
                organizer: savedOrganizer,
                message: 'Organizer account created successfully!' 
            };
            
        } catch (error) {
            throw error;
        }
    }
    
    // Validation functions
    function validateAllFields() {
        const selectedType = document.querySelector('input[name="accountType"]:checked')?.value;
        
        const basicValidations = [
            validateField('accountType'),
            validateField('name'),
            validateField('email'),
            validateField('password'),
            validateField('confirmPassword'),
            validateField('phone'),
            validateField('terms')
        ];
        
        // Add organizer-specific validations
        let organizerValidations = [];
        if (selectedType === 'organizer') {
            organizerValidations = [
                validateField('companyName'),
                validateField('businessEmail')
            ];
        }
        
        const allValidations = [...basicValidations, ...organizerValidations];
        return allValidations.every(isValid => isValid);
    }
    
    function validateField(fieldName) {
        clearError(fieldName);
        
        const value = getFieldValue(fieldName);
        let isValid = true;
        let errorMessage = '';
        
        switch (fieldName) {
            case 'accountType':
                const selectedType = document.querySelector('input[name="accountType"]:checked');
                if (!selectedType) {
                    errorMessage = 'Please select an account type.';
                    isValid = false;
                }
                break;
                
            case 'name':
                if (!value || value.length < 2) {
                    errorMessage = 'Full name must be at least 2 characters long.';
                    isValid = false;
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    errorMessage = 'Full name can only contain letters and spaces.';
                    isValid = false;
                }
                break;
                
            case 'email':
                if (!value) {
                    errorMessage = 'Email address is required.';
                    isValid = false;
                } else if (!isValidEmail(value)) {
                    errorMessage = 'Please enter a valid email address.';
                    isValid = false;
                }
                break;
                
            case 'password':
                if (!value) {
                    errorMessage = 'Password is required.';
                    isValid = false;
                } else if (value.length < 8) {
                    errorMessage = 'Password must be at least 8 characters long.';
                    isValid = false;
                } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                    errorMessage = 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
                    isValid = false;
                }
                break;
                
            case 'confirmPassword':
                const password = getFieldValue('password');
                if (!value) {
                    errorMessage = 'Please confirm your password.';
                    isValid = false;
                } else if (value !== password) {
                    errorMessage = 'Passwords do not match.';
                    isValid = false;
                }
                break;
                
            case 'phone':
                // Phone is optional, but if provided, validate format
                if (value && !isValidPhone(value)) {
                    errorMessage = 'Please enter a valid phone number.';
                    isValid = false;
                }
                break;
                
            case 'companyName':
                if (!value || value.length < 2) {
                    errorMessage = 'Company name must be at least 2 characters long.';
                    isValid = false;
                }
                break;
                
            case 'businessEmail':
                if (!value) {
                    errorMessage = 'Business email is required for organizers.';
                    isValid = false;
                } else if (!isValidEmail(value)) {
                    errorMessage = 'Please enter a valid business email address.';
                    isValid = false;
                }
                break;
                
            case 'terms':
                const termsChecked = document.getElementById('terms').checked;
                if (!termsChecked) {
                    errorMessage = 'You must agree to the Terms of Service and Privacy Policy.';
                    isValid = false;
                }
                break;
        }
        
        if (!isValid) {
            showError(fieldName, errorMessage);
        }
        
        return isValid;
    }
    
    // Helper functions
    function getFieldValue(fieldName) {
        let fieldId;
        switch (fieldName) {
            case 'confirmPassword':
                fieldId = 'confirm-password';
                break;
            case 'name':
                fieldId = 'full-name';
                break;
            case 'companyName':
                fieldId = 'company-name';
                break;
            case 'businessEmail':
                fieldId = 'business-email';
                break;
            default:
                fieldId = fieldName;
        }
        
        const element = document.getElementById(fieldId);
        return element ? element.value.trim() : '';
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function isValidPhone(phone) {
        // Accept various phone formats
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
        return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
    }
    
    function showError(fieldName, message) {
        if (errorElements[fieldName]) {
            errorElements[fieldName].textContent = message;
            errorElements[fieldName].style.display = 'block';
        }
    }
    
    function clearError(fieldName) {
        if (errorElements[fieldName]) {
            errorElements[fieldName].textContent = '';
            errorElements[fieldName].style.display = 'none';
        }
    }
    
    function clearAllErrors() {
        Object.keys(errorElements).forEach(field => clearError(field));
    }
    
    function setFormLoading(loading) {
        signupBtn.disabled = loading;
        signupBtn.textContent = loading ? 'Creating Account...' : 'Create Account';
        
        // Disable all form inputs
        const inputs = signupForm.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = loading;
        });
    }
    
    function showLoginModal(e) {
        e.preventDefault();
        loginModal.classList.add('active');
    }
    
    // Password strength indicator
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    strengthIndicator.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill"></div>
        </div>
        <span class="strength-text">Password strength</span>
    `;
    
    passwordInput.parentNode.appendChild(strengthIndicator);
    
    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = calculatePasswordStrength(password);
        updatePasswordStrength(strength);
    });
    
    function calculatePasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z\d]/.test(password)) score++;
        
        return Math.min(score, 4);
    }
    
    function updatePasswordStrength(strength) {
        const fill = strengthIndicator.querySelector('.strength-fill');
        const text = strengthIndicator.querySelector('.strength-text');
        
        const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['#ff4444', '#ff7744', '#ffaa44', '#77ff44', '#44ff44'];
        
        fill.style.width = `${(strength / 4) * 100}%`;
        fill.style.backgroundColor = colors[strength] || colors[0];
        text.textContent = levels[strength] || levels[0];
    }
});

// Add CSS for password strength indicator and organizer fields
const style = document.createElement('style');
style.textContent = `
    .password-strength {
        margin-top: 0.5rem;
    }
    
    .strength-bar {
        width: 100%;
        height: 4px;
        background-color: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 0.25rem;
    }
    
    .strength-fill {
        height: 100%;
        width: 0%;
        background-color: #ff4444;
        transition: all 0.3s ease;
    }
    
    .strength-text {
        font-size: 0.75rem;
        color: var(--color-text-light);
    }
    
    .account-type-selection {
        margin-bottom: 1.5rem;
    }
    
    .account-type-options {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
    }
    
    .account-type-option {
        flex: 1;
        padding: 1rem;
        border: 2px solid var(--color-border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
    }
    
    .account-type-option:hover {
        border-color: var(--color-primary);
        background-color: var(--color-primary-light);
    }
    
    .account-type-option.selected {
        border-color: var(--color-primary);
        background-color: var(--color-primary-light);
    }
    
    .account-type-radio {
        margin-bottom: 0.5rem;
    }
    
    .account-type-title {
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .account-type-description {
        font-size: 0.875rem;
        color: var(--color-text-light);
    }
    
    #organizer-fields {
        display: none;
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background-color: var(--color-background-light);
        margin-bottom: 1rem;
    }
    
    .organizer-fields-title {
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--color-primary);
    }
    
    .login__error {
        color: var(--color-error);
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: none;
    }
    
    .login__success {
        color: var(--color-success);
        font-size: 0.875rem;
        margin-bottom: 1rem;
        text-align: center;
        font-weight: 500;
    }
`;

document.head.appendChild(style);