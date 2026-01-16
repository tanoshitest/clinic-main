/**
 * Main application logic for Premium Dental Clinic
 * Handles Booking Form Submissions sending to Admin Dashboard via localStorage
 * Handles Dynamic Contact Info updates from Admin Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle Booking Form Submission
    const bookingForm = document.getElementById('booking-form');

    if (bookingForm) {
        console.log('Booking form found, attaching listener');
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted');

            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                // Collect form data
                const formData = new FormData();
                formData.append('first_name', document.getElementById('first-name').value);
                formData.append('last_name', document.getElementById('last-name').value);
                formData.append('email', document.getElementById('email').value);
                formData.append('phone', document.getElementById('phone').value);
                formData.append('preferred_date', document.getElementById('appointment-date').value);
                formData.append('concern', document.getElementById('concern').value);

                // 1. Send to PHP Backend (for Email)
                let emailSent = false;
                try {
                    const response = await fetch('process-booking.php', {
                        method: 'POST',
                        body: formData
                    });
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            emailSent = true;
                            console.log('Backend response:', result.message);
                        } else {
                            console.error('Backend error:', result.message);
                        }
                    } else {
                        console.warn('Backend unavailable (likely running locally without PHP)');
                    }
                } catch (networkError) {
                    console.warn('Network error or no backend server:', networkError);
                }

                // 2. Save to localStorage (Backup & Demo Dashboard)
                const localData = {
                    id: Date.now(),
                    firstName: formData.get('first_name'),
                    lastName: formData.get('last_name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    date: formData.get('preferred_date'),
                    concern: formData.get('concern'),
                    submittedAt: new Date().toISOString()
                };

                const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
                appointments.unshift(localData);
                localStorage.setItem('appointments', JSON.stringify(appointments));


                // 3. Show Feedback
                if (emailSent) {
                    alert('Success! Your appointment has been scheduled and an email confirmation sent.');
                } else {
                    alert('Success! Your appointment request has been saved locally. (Backend email server not reachable in this demo environment)');
                }

                bookingForm.reset();

            } catch (error) {
                console.error('Error processing form:', error);
                alert('An unexpected error occurred. Please check console.');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    } else {
        console.error('Booking form not found!');
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
