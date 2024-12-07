/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */


//import apiRouter from './router.js';

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export default {
    async fetch(request, env) {
        // Handle CORS preflight requests
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "https://coalescencelab.com",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type",
                }
            });
        }

        // Only allow POST requests
        if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        try {
            // Make sure request is to /api/contact
            const url = new URL(request.url);
            if (url.pathname !== "/api/contact") {
                return new Response("Not found", { status: 404 });
            }

            // Parse the request body
            const { name, email, message } = await request.json();

            // Validate required fields
            if (!name || !email || !message) {
                return new Response("Missing required fields", { status: 400 });
            }

            // Validate email
            if (!isValidEmail(email)) {
                return new Response("Invalid email address", { status: 400 });
            }

            // Create the email message
            const msg = createMimeMessage();
            msg.setSender({ name: "Contact Form", addr: "no-reply@coalescencelab.com" });
            msg.setSubject("Contact Form Submission");
            //msg.setRecipient("info@coalescencelab.com");
            
            // Create HTML content
            const htmlContent = `
                <h2>New Contact Form Submission</h2>
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `;

            // Create plain text content
            const textContent = `                
                From: ${name} (${email})
                Subject: Contact Form Submission
                
                Message:
                ${message}
            `;

            // Add both HTML and plain text versions
            msg.addMessage({
                contentType: 'text/plain',
                data: textContent
            });
            
            msg.addMessage({
                contentType: 'text/html',
                data: htmlContent
            });

            // Create and send the email
            const emailMessage = new EmailMessage(
                "no-reply@coalescencelab.com",
                "alireza.n.j@gmail.com",
                msg.asRaw()
            );

            await env.SEB.send(emailMessage);

            return new Response(JSON.stringify({ success: true }), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "https://coalescencelab.com"
                }
            });

        } catch (error) {
            console.error('Error:', error);
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Failed to send email" 
            }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "https://coalescencelab.com"
                }
            });
        }
    }
};