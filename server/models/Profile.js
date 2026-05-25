import mongoose from 'mongoose'

const profileSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    version: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    lifetimeDsa: { type: Number, default: 0 },
    lifetimeApps: { type: Number, default: 0 },
    lifetimeStudySeconds: { type: Number, default: 0 },
    daily: { type: mongoose.Schema.Types.Mixed, default: {} },
    roadmaps: { type: mongoose.Schema.Types.Mixed, default: [] },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    permissionAsked: { type: Boolean, default: false },
    pushSubscriptionJson: { type: String, default: null },
    dismissedStreakBreakToken: { type: String, default: null },
  },
  { timestamps: true },
)

export const Profile = mongoose.model('Profile', profileSchema)
