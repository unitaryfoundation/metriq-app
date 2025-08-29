import axios from 'axios'
import config from '../config'

// Minimal, frontend-only permission check.
// - If submission is not in restricted list, allow.
// - If restricted, only allow if current user is in config.acl.privilegedUsers.
// This is a UI guard; backend must still enforce.
export async function canAppendToSubmission (submissionId) {
  try {
    if (!config?.acl?.restrictedSubmissionIds?.includes(Number(submissionId))) {
      return true
    }

    const res = await axios.get(config.api.getUriPrefix() + '/user')
    const user = res?.data?.data || {}
    const username = (user.username || '').trim()
    const privileged = (config?.acl?.privilegedUsers || [])
    return privileged.includes(username)
  } catch (e) {
    // Not logged in or cannot fetch user → treat as not privileged for restricted submissions
    return false
  }
}

export function isSubmissionRestricted (submissionId) {
  return !!config?.acl?.restrictedSubmissionIds?.includes(Number(submissionId))
}

