/**
 * Main application logic for Premium Dental Clinic
 * Handles Booking Form Submissions sending to Admin Dashboard via localStorage
 * Handles Dynamic Contact Info updates from Admin Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle Booking Form Submission
    const bookingForm = document.getElementById('booking-form');

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect form data
            const formData = {
                id: Date.now(), // Simple unique ID
                firstName: document.getElementById('first-name').value,
                lastName: document.getElementById('last-name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                date: document.getElementById('appointment-date').value,
                concern: document.getElementById('concern').value,
                submittedAt: new Date().toISOString()
            };

            // Save to localStorage
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            appointments.unshift(formData); // Add new appointment to the top
            localStorage.setItem('appointments', JSON.stringify(appointments));

            // Show success feedback
            alert(`Thank you, ${formData.firstName}! We have received your appointment request for ${formData.date}. Our team will contact you shortly.`);

            bookingForm.reset();
        });
    }

    // 2. Load Dynamic Contact Info (if set in Admin)
    const savedContactInfo = JSON.parse(localStorage.getItem('clinic_contact_info'));

    if (savedContactInfo) {
        // Update Phone Numbers
        const phoneElements = document.querySelectorAll('.contact-phone');
        phoneElements.forEach(el => {
            if (savedContactInfo.phone) el.textContent = savedContactInfo.phone;
        });

        // Update Email
        const emailElements = document.querySelectorAll('.contact-email');
        emailElements.forEach(el => {
            if (savedContactInfo.email) el.textContent = savedContactInfo.email;
        });

        // Update Address
        const addressElements = document.querySelectorAll('.contact-address');
        addressElements.forEach(el => {
            if (savedContactInfo.address) el.innerHTML = savedContactInfo.address.replace(/\n/g, '<br>');
        });

        // Ideally we would have specific classes in the HTML for these elements to target them reliably.
        // For this demo, let's look for specific placeholders if we can, or just rely on the Admin structure.
    }
});
