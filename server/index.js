// server/index.js
// See also https://blog.logrocket.com/adding-dynamic-meta-tags-react-app-without-ssr/

const config = require('./../src/config')
const express = require('express')
const path = require('path')
const fs = require('fs')
const app = express()
const axios = require('axios')
const { createProxyMiddleware } = require('http-proxy-middleware')

const PORT = process.env.PORT || 3000
const indexPath = path.resolve(__dirname, '..', 'build', 'index.html')

const defaultTitle = 'Metriq - Community-driven Quantum Benchmarks'
const defaultDescription = 'Quantum computing benchmarks, scientific social media Wiki community, for hardware, compilers, algorithms, simulators, and all things quantum, by Unitary Foundation!'

const truncateBefore = function (str, pattern) {
  return str.slice(str.indexOf(pattern) + pattern.length)
}

// Escape data for safe insertion in HTML text/attribute contexts.
// This prevents breaking out of tags/attributes and mitigates XSS.
const escapeHtmlForAttribute = function (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Static resources should just be served as they are.
app.use(express.static(
  path.resolve(__dirname, '..', 'build'),
  { maxAge: '30d' }
))

app.use('/api', createProxyMiddleware({ target: config.api.serverSideUrl, changeOrigin: true }))

// Rewrite meta tags.
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next()
  }
  fs.readFile(indexPath, 'utf8', async (err, htmlData) => {
    if (err) {
      console.error('Error during file reading', err)
      return res.status(404).end()
    }

    let title = defaultTitle
    let description = defaultDescription

    if (req.url.startsWith('/Submission/')) {
      const id = truncateBefore(req.url, '/Submission/')
      const route = config.api.getUriPrefix() + '/submission/' + id
      await (axios.get(route)
        .then(subRes => {
          const response = subRes.data.data
          title = response.name
          description = response.description
        }))
    } else if (req.url.startsWith('/Task/')) {
      const id = truncateBefore(req.url, '/Task/')
      const route = config.api.getUriPrefix() + '/task/' + id
      await (axios.get(route)
        .then(subRes => {
          const response = subRes.data.data
          title = response.name
          description = response.description
        }))
    } else if (req.url.startsWith('/Method/')) {
      const id = truncateBefore(req.url, '/Method/')
      const route = config.api.getUriPrefix() + '/method/' + id
      await (axios.get(route)
        .then(subRes => {
          const response = subRes.data.data
          title = response.name
          description = response.description
        }))
    } else if (req.url.startsWith('/Platform/')) {
      const id = truncateBefore(req.url, '/Platform/')
      const route = config.api.getUriPrefix() + '/platform/' + id
      await (axios.get(route)
        .then(subRes => {
          const response = subRes.data.data
          title = response.name
          description = response.description
        }))
    } else if (req.url.startsWith('/User/')) {
      const id = truncateBefore(req.url, '/User/')
      if (!id.includes('/')) {
        const route = config.api.getUriPrefix() + '/user/' + id
        await (axios.get(route)
          .then(subRes => {
            const response = subRes.data.data
            title = response.name
            description = response.affiliation || ''
          }))
      }
    }
    if (title.length > 50) {
      title = title.substring(0, 47) + '...'
    }

    // Escape dynamic content before injecting into HTML
    const safeTitle = escapeHtmlForAttribute(title)
    const safeDescription = escapeHtmlForAttribute(description)
    const safeOgUrl = escapeHtmlForAttribute('https://metriq.info' + req.url)

    // inject meta tags
    htmlData = htmlData
      .replace(defaultTitle, safeTitle)
      .replace(defaultTitle, safeTitle)
      .replace(defaultDescription, safeDescription)
      .replace(defaultDescription, safeDescription)
      .replace("content='https://metriq.info'", "content='" + safeOgUrl + "'")
    return res.send(htmlData)
  })
})
// Listening...
app.listen(PORT, (error) => {
  if (error) {
    return console.log('Error during app startup', error)
  }
  console.log('listening on ' + PORT + '...')
})
