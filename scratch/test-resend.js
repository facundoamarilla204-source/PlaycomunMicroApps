require("dotenv").config({ path: ".env.local" });
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  console.log("Sending email...");
  console.log("From:", process.env.RESEND_FROM_EMAIL);
  console.log("To:", process.env.RESEND_TO_EMAIL);
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [process.env.RESEND_TO_EMAIL],
      subject: "Test email from Antigravity",
      html: "<p>This is a test email.</p>"
    });

    if (error) {
      console.error("Resend API Error:", error);
    } else {
      console.log("Email sent successfully:", data);
    }
  } catch (err) {
    console.error("Caught exception:", err);
  }
}

test();
