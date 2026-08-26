#!/usr/bin/env node
/**
 * IndexNow submitter for pregret.ca
 *
 * Pushes URLs to IndexNow (Bing + Yandex). Google ignores IndexNow —
 * Google indexing is handled via the daily GSC URL-Inspection push.
 *
 * Usage:
 *   node scripts/indexnow.mjs                  # submits the default priority list
 *   node scripts/indexnow.mjs /blog/some-post  # submits only the paths you pass
 *
 * The key file must be live at:
 *   https://pregret.ca/8f5ac63200544cba9a43031066bf9171.txt
 */

const HOST = 'pregret.ca'
const KEY = '8f5ac63200544cba9a43031066bf9171'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const BASE = `https://${HOST}`

const DEFAULT_PATHS = [
  '/',
  '/categories',
  '/blog',
  '/about',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/category/electronics',
  '/category/kitchen',
  '/category/fitness',
  '/category/personal-care',
  '/category/home-garden',
  '/category/baby',
  '/category/beauty',
  '/category/school-supplies',
]

const args = process.argv.slice(2).filter(Boolean)
const paths = args.length ? args : DEFAULT_PATHS
const urlList = paths.map((p) => (p.startsWith('http') ? p : `${BASE}${p.startsWith('/') ? '' : '/'}${p}`))

const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
})

const text = await res.text()
console.log(`IndexNow → ${res.status} ${res.statusText}`)
console.log(`Submitted ${urlList.length} URL(s):`)
urlList.forEach((u) => console.log('  ' + u))
if (text.trim()) console.log('Response body:', text.trim())
if (res.status !== 200 && res.status !== 202) {
  console.error('\n⚠️  Non-success status — check that the key file is live at', KEY_LOCATION)
  process.exit(1)
}
