document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.getElementById('heroSection');
    const getInTouchBtn = heroSection.querySelector('button');
    
    // Create contact form HTML
    const contactForm = document.createElement('section');
    contactForm.className = 'contact-form hidden';
    contactForm.id = 'contactSection';
    contactForm.innerHTML = `
        <button class="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Back
        </button>
        <div class="form-header">
            <h2>Get in Touch</h2>
            <p>If you're interested in sensing capabilities for diagnostic applications, exploring research collaboration opportunities, or joining our technical team, we want to hear from you.</p>
        </div>
        <form id="contactForm">
            <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" rows="4" required></textarea>
            </div>
            <button type="submit" class="submit-button">
                Send Message
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
        </form>
    `;
    
    // Insert contact form after hero section
    heroSection.parentNode.insertBefore(contactForm, heroSection.nextSibling);
    
    // Get back button
    const backButton = contactForm.querySelector('.back-button');
    
    // Handle showing contact form
    getInTouchBtn.addEventListener('click', () => {
        heroSection.classList.add('fade-out');
        setTimeout(() => {
            heroSection.classList.add('hidden');
            contactForm.classList.remove('hidden');
            setTimeout(() => {
                contactForm.classList.add('fade-in');
            }, 50);
        }, 500);
    });
    
    // Handle going back to hero
    backButton.addEventListener('click', () => {
        contactForm.classList.remove('fade-in');
        setTimeout(() => {
            contactForm.classList.add('hidden');
            heroSection.classList.remove('hidden');
            setTimeout(() => {
                heroSection.classList.remove('fade-out');
            }, 50);
        }, 500);
    });

    requestAnimationFrame(drawTileAnimation);
    
    // Handle form submission
    const form = document.getElementById('contactForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Add your form submission logic here
        const formData = {
            name: form.name.value,
            email: form.email.value,
            subject: "Contact Form Submission",
            message: form.message.value
        };
        
        // Send form data as REST API request
        fetch('https://contact-form-worker.coalescencelab.com/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (response.ok) {
                // Set text button to 'Sent!'
                const submitButton = form.querySelector('.submit-button');
                submitButton.textContent = 'Sent!';

                // Go back to hero section
                setTimeout(() => {
                    form.reset();
                    backButton.click();
                }, 700);
                
            } else {
                alert('An error occurred while sending the message.');
            }
        })

        // Set text button to 'Sending...'
        const submitButton = form.querySelector('.submit-button');
        submitButton.textContent = 'Sending...';
    });
});