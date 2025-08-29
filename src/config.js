const config = {}

config.isDebug = true

config.api = {}
config.api.url = config.isDebug ? 'localhost:3000' : 'metriq.info'
config.api.protocol = config.isDebug ? 'http://' : 'https://'
config.api.endpoint = '/api'
config.api.serverSideUrl = 'http://localhost:8080'
config.api.getUriPrefix = () => {
  return config.api.protocol + config.api.url + config.api.endpoint
}

config.web = {}
config.web.url = config.isDebug ? 'localhost:3000' : 'metriq.info'
config.web.protocol = config.isDebug ? 'http://' : 'https://'
config.web.endpoint = ''
config.web.serverSideUrl = 'http://localhost:8080'
config.web.getUriPrefix = () => {
  return config.web.protocol + config.web.url + config.web.endpoint
}

module.exports = config

// Access control (frontend-only guard)
// Configure restricted submissions and privileged users.
// Set env var REACT_APP_PRIVILEGED_USERS to a comma-separated list of usernames.
config.acl = {
  restrictedSubmissionIds: [800],
  privilegedUsers: (process.env.REACT_APP_PRIVILEGED_USERS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}
