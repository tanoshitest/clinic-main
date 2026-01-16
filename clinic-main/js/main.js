/**
 * Main application logic for Premium Dental Clinic
 * Handles Booking Form Submissions sending to Admin Dashboard via localStorage
 * Handles Dynamic Contact Info updates from Admin Dashboard
 */

console.log('main.js loaded');

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
                    type: 'appointment',
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

                // --- SEND TELEGRAM NOTIFICATION ---
                const telegramMsg = `📅 <b>ĐẶT LỊCH MỚI</b>\n` +
                    `--------------------------\n` +
                    `👤 <b>Khách:</b> ${formData.get('first_name')} ${formData.get('last_name')}\n` +
                    `📞 <b>SĐT:</b> ${formData.get('phone')}\n` +
                    `📧 <b>Email:</b> ${formData.get('email')}\n` +
                    `🗓 <b>Ngày hẹn:</b> ${formData.get('preferred_date')}\n` +
                    `📝 <b>Vấn đề:</b> ${formData.get('concern')}`;

                // Do not await strictly to avoid delaying UI feedback too much, but good for demo
                sendTelegramNotification(telegramMsg);

                // --- SEND EMAIL NOTIFICATION ---
                // 1. Notify Admin (Missing ID yet)
                // sendEmail('admin_booking', Object.fromEntries(formData)); 

                // 2. Thank Guest
                sendEmail('guest_thank', {
                    first_name: formData.get('first_name'),
                    last_name: formData.get('last_name'), // In case template uses it
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    preferred_date: formData.get('preferred_date'),
                    to_email: formData.get('email') // Important if using auto-reply feature
                });
                // -------------------------------


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

    // 3. Handle Contact Page Form Submission
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        console.log('Contact form found, attaching listener');
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Contact form submitted');

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                // Collect form data
                const formData = new FormData();
                formData.append('first_name', document.getElementById('first-name').value);
                formData.append('last_name', document.getElementById('last-name').value);
                formData.append('email', document.getElementById('email').value);
                formData.append('concern', document.getElementById('subject').value); // Map Subject to Concern
                formData.append('message', document.getElementById('message').value); // New field for message
                // Add defaults for missing fields needed by PHP
                formData.append('phone', 'N/A');
                formData.append('preferred_date', new Date().toISOString().split('T')[0]); // Today's date as default

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
                        console.warn('Backend unavailable');
                    }
                } catch (networkError) {
                    console.warn('Network error:', networkError);
                }

                // 2. Save to localStorage (Backup)
                const localData = {
                    id: Date.now(),
                    type: 'message',
                    firstName: formData.get('first_name'),
                    lastName: formData.get('last_name'),
                    email: formData.get('email'),
                    phone: 'N/A',
                    date: 'N/A',
                    concern: formData.get('concern'),
                    message: formData.get('message'),
                    submittedAt: new Date().toISOString()
                };

                const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
                appointments.unshift(localData);
                localStorage.setItem('appointments', JSON.stringify(appointments));

                // --- SEND TELEGRAM NOTIFICATION ---
                const telegramMsg = `📩 <b>TIN NHẮN MỚI</b>\n` +
                    `--------------------------\n` +
                    `👤 <b>Khách:</b> ${formData.get('first_name')} ${formData.get('last_name')}\n` +
                    `📧 <b>Email:</b> ${formData.get('email')}\n` +
                    `📝 <b>Chủ đề:</b> ${formData.get('concern')}\n` +
                    `💬 <b>Nội dung:</b> ${formData.get('message')}`;

                sendTelegramNotification(telegramMsg);

                // --- SEND EMAIL NOTIFICATION ---
                // 1. Notify Admin
                sendEmail('admin_message', Object.fromEntries(formData));

                // 2. Thank Guest
                sendEmail('guest_thank', {
                    first_name: formData.get('first_name'),
                    last_name: formData.get('last_name'),
                    email: formData.get('email'),
                    message: formData.get('message'),
                    to_email: formData.get('email')
                });
                // -------------------------------


                // 3. Show Feedback
                if (emailSent) {
                    alert('Message sent! We will get back to you shortly.');
                } else {
                    alert('Message saved! We will get back to you shortly. (Backend email server not reachable)');
                }

                contactForm.reset();

            } catch (error) {
                console.error('Error processing contact form:', error);
                alert('An error occurred. Please try again.');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // LOAD DYNAMIC INFO FROM LOCALSTORAGE...
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

/**
 * Sends a notification to Telegram Channel/Group
 * NOTE: In a real production app, you should not expose the Bot Token in client-side code.
 * Consider using a Serverless Function (Vercel Functions) or a backend proxy.
 */
async function sendTelegramNotification(message) {
    const botToken = '8319802180:AAFiIHtJvWtV2hijtWDircMSljEy6VTgAag';
    const chatId = '1031749914';
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            throw new Error(`Telegram API Error: ${response.statusText}`);
        }
        console.log('Telegram notification sent successfully');
    } catch (error) {
        console.error('Failed to send Telegram notification:', error);
    }
}

/**
 * Sends Email using EmailJS
 */
function sendEmail(type, data) {
    const serviceID = 'service_m89id9r';
    const adminTemplateID = 'template_txkv5sb';
    const guestTemplateID = 'template_jl267q6';

    let templateID = '';
    let templateParams = data;

    if (type === 'guest_thank') {
        templateID = guestTemplateID;
    } else if (type === 'admin_booking' || type === 'admin_message') {
        templateID = adminTemplateID;
    }

    if (!templateID) return;

    emailjs.send(serviceID, templateID, templateParams)
        .then(() => {
            console.log(`Email (${type}) sent successfully!`);
        }, (error) => {
            console.error('Failed to send email:', error);
        });
}
