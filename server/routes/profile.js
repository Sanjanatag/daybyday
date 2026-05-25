import { Router } from 'express'
import { Profile } from '../models/Profile.js'

const router = Router()

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/

function pickPayload(body) {
  return {
    version: body.version ?? 1,
    streak: body.streak ?? 0,
    longestStreak: body.longestStreak ?? 0,
    xp: body.xp ?? 0,
    badges: Array.isArray(body.badges) ? body.badges : [],
    lifetimeDsa: body.lifetimeDsa ?? 0,
    lifetimeApps: body.lifetimeApps ?? 0,
    lifetimeStudySeconds: body.lifetimeStudySeconds ?? 0,
    daily: body.daily && typeof body.daily === 'object' ? body.daily : {},
    roadmaps: Array.isArray(body.roadmaps) ? body.roadmaps : [],
    settings: body.settings && typeof body.settings === 'object' ? body.settings : {},
    permissionAsked: Boolean(body.permissionAsked),
    pushSubscriptionJson: body.pushSubscriptionJson ?? null,
    dismissedStreakBreakToken: body.dismissedStreakBreakToken ?? null,
  }
}

router.get('/:clientId', async (req, res) => {
  const { clientId } = req.params
  if (!CLIENT_ID_RE.test(clientId)) {
    return res.status(400).json({ error: 'Invalid client id' })
  }
  const doc = await Profile.findOne({ clientId }).lean()
  if (!doc) return res.status(404).json({ error: 'Not found' })
  const { _id, __v, createdAt, updatedAt, clientId: _cid, ...data } = doc
  res.json(data)
})

router.put('/:clientId', async (req, res) => {
  const { clientId } = req.params
  if (!CLIENT_ID_RE.test(clientId)) {
    return res.status(400).json({ error: 'Invalid client id' })
  }
  const payload = pickPayload(req.body)
  const doc = await Profile.findOneAndUpdate(
    { clientId },
    { $set: { clientId, ...payload } },
    { upsert: true, new: true, runValidators: true },
  ).lean()
  const { _id, __v, createdAt, updatedAt, clientId: _cid, ...data } = doc
  res.json(data)
})

export default router
