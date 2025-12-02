#!/usr/bin/env node

/**
 * Script to generate VAPID keys for Web Push
 * Run: node scripts/generate-vapid.js
 */

const webpush = require('web-push')
const fs = require('fs')
const path = require('path')

console.log('🔑 Generating VAPID keys for Web Push...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ Keys generated successfully!\n')
console.log('📋 Add these to your .env.local file:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`)
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`)
console.log('\n')

// Save to file
const keysPath = path.join(process.cwd(), 'vapid-keys.json')
fs.writeFileSync(keysPath, JSON.stringify(vapidKeys, null, 2))

console.log(`💾 Keys also saved to: ${keysPath}`)
console.log('\n⚠️  Keep these keys secret! Add vapid-keys.json to .gitignore\n')



