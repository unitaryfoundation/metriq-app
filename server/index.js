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
      const idPattern = /^[a-zA-Z0-9_-]+$/; // Allow only alphanumeric, underscores, and hyphens
      if (!idPattern.test(id)) {
        console.error('Invalid ID format:', id);
        return res.status(400).send('Invalid ID format');
      }
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
      const idPattern = /^[a-zA-Z0-9_-]+$/; // Allow only alphanumeric, underscores, and hyphens
      if (!idPattern.test(id)) {
        console.error('Invalid ID format:', id);
        return res.status(400).send('Invalid ID format');
      }
      const route = config.api.getUriPrefix() + '/platform/' + id
      await (axios.get(route)
        .then(subRes => {
          const response = subRes.data.data
          title = response.name
          description = response.description
        }))
    }
    if (title.length > 50) {
      title = title.substring(0, 47) + '...'
    }

    description = description.split('"').join("'")

    // inject meta tags
    htmlData = htmlData
      .replace(defaultTitle, title)
      .replace(defaultTitle, title)
      .replace(defaultDescription, description)
      .replace(defaultDescription, description)
      .replace("content='https://metriq.info'", "content='https://metriq.info" + req.url + "'")
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
