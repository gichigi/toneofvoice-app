/**
 * Test email sending
 * Usage: node scripts/test-email.mjs your@email.com
 */

const email = process.argv[2]

if (!email) {
  console.error('Usage: node scripts/test-email.mjs your@email.com')
  process.exit(1)
}

console.log(`🔄 Sending test email to ${email}...`)

fetch('http://localhost:3002/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log(`✅ Success! Email sent to ${email}`)
      console.log(`Email ID: ${data.emailId}`)
    } else {
      console.error(`❌ Failed:`, data.error)
    }
  })
  .catch(err => {
    console.error(`❌ Error:`, err.message)
  })
