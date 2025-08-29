// Express-style guard for POST /submission/:id/result
// Assumes:
// - req.user is set by auth middleware and contains { id, is_privileged, ... }
// - db.getSubmission(id) returns row with { id, restricted_append }

async function ensureCanAppendToSubmission (req, res, next) {
  try {
    const { id } = req.params
    const submissionId = Number(id)
    if (!Number.isFinite(submissionId)) {
      return res.status(400).json({ message: 'Invalid submission id' })
    }

    const submission = await db.getSubmission(submissionId)
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' })
    }

    if (!submission.restricted_append) {
      return next()
    }

    const user = req.user
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // Bypass for admins/moderators if you have roles (pseudo-code):
    // if (user.is_admin || user.is_moderator) return next()

    if (user.is_privileged) {
      return next()
    }

    return res.status(403).json({ message: 'Restricted submission: append not permitted' })
  } catch (e) {
    return next(e)
  }
}

// Route wiring example
// const router = require('express').Router()
// router.post('/submission/:id/result', authRequired, ensureCanAppendToSubmission, appendResultHandler)

module.exports = { ensureCanAppendToSubmission }

