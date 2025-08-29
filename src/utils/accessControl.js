import axios from 'axios'
import config from '../config'

// Minimal, frontend-only permission check.
// - If submission is not in restricted list, allow.
// - If restricted, only allow if current user is in config.acl.privilegedUsers.
// This is a UI guard; backend must still enforce.
export async function canAppendToSubmission (submissionId, submissionObj) {
  try {
    const restricted = await isSubmissionRestricted(submissionId, submissionObj)
    if (!restricted) return true

    const res = await axios.get(config.api.getUriPrefix() + '/user')
    const user = res?.data?.data || {}
    // Prefer server-provided flag when available
    if (typeof user.isPrivileged === 'boolean') {
      return !!user.isPrivileged
    }
    // Fallback to legacy env-based list if present (will be removed once API ships)
    const username = (user.username || '').trim()
    const privileged = (config?.acl?.privilegedUsers || [])
    return privileged.includes(username)
  } catch (e) {
    // Not logged in or cannot fetch user → treat as not privileged for restricted submissions
    return false
  }
}

export async function isSubmissionRestricted (submissionId, submissionObj) {
  // Prefer server-provided flag if available
  if (submissionObj && typeof submissionObj.restrictedAppend === 'boolean') {
    return !!submissionObj.restrictedAppend
  }
  try {
    // Probe the submission in case backend already provides the flag
    const res = await axios.get(`${config.api.getUriPrefix()}/submission/${submissionId}`)
    const item = res?.data?.data || {}
    if (typeof item.restrictedAppend === 'boolean') {
      return !!item.restrictedAppend
    }
  } catch (e) {
    // ignore; fall back to config
  }
  return !!config?.acl?.restrictedSubmissionIds?.includes(Number(submissionId))
}
