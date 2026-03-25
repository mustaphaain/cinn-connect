export const AVATAR_PRESETS = [
  'avatar-01',
  'avatar-02',
  'avatar-03',
  'avatar-04',
  'avatar-05',
  'avatar-06',
  'avatar-07',
  'avatar-08',
  'avatar-09',
  'avatar-10',
  'avatar-11',
  'avatar-12',
] as const

export function isValidAvatarPreset(value: string | null | undefined): value is (typeof AVATAR_PRESETS)[number] {
  if (!value) return false
  return AVATAR_PRESETS.includes(value as (typeof AVATAR_PRESETS)[number])
}

export function randomAvatarPreset(): (typeof AVATAR_PRESETS)[number] {
  return AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]
}

