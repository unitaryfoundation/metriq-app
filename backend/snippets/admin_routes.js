// Minimal admin routes for toggling flags
// Assumes auth + admin guard middleware

// GET /user (augment payload)
// Ensure you include: { ..., isPrivileged: user.is_privileged }

// GET /submission/:id (augment payload)
// Ensure you include: { ..., restrictedAppend: submission.restricted_append }

// POST /user/:id/privileged { isPrivileged: boolean }
router.post('/user/:id/privileged', authRequired, adminOnly, async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const { isPrivileged } = req.body || {}
    if (typeof isPrivileged !== 'boolean') {
      return res.status(400).json({ message: 'isPrivileged must be boolean' })
    }
    await db.query('UPDATE users SET is_privileged = $1 WHERE id = $2', [isPrivileged, userId])
    const user = await db.getUser(userId)
    return res.json({ data: { id: user.id, isPrivileged: user.is_privileged } })
  } catch (e) { next(e) }
})

// POST /submission/:id/restrictions { restrictedAppend: boolean }
router.post('/submission/:id/restrictions', authRequired, adminOnly, async (req, res, next) => {
  try {
    const submissionId = Number(req.params.id)
    const { restrictedAppend } = req.body || {}
    if (typeof restrictedAppend !== 'boolean') {
      return res.status(400).json({ message: 'restrictedAppend must be boolean' })
    }
    await db.query('UPDATE submissions SET restricted_append = $1 WHERE id = $2', [restrictedAppend, submissionId])
    const sub = await db.getSubmission(submissionId)
    return res.json({ data: { id: sub.id, restrictedAppend: sub.restricted_append } })
  } catch (e) { next(e) }
})

// curl examples
// curl -X POST http://localhost:8080/user/123/privileged -H 'Content-Type: application/json' -d '{"isPrivileged": true}' -b cookie.jar
// curl -X POST http://localhost:8080/submission/800/restrictions -H 'Content-Type: application/json' -d '{"restrictedAppend": true}' -b cookie.jar

