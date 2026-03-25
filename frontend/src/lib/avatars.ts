export const AVATAR_PRESETS = [
  { id: 'avatar-01', label: 'Avatar 1', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine01' },
  { id: 'avatar-02', label: 'Avatar 2', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine02' },
  { id: 'avatar-03', label: 'Avatar 3', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine03' },
  { id: 'avatar-04', label: 'Avatar 4', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine04' },
  { id: 'avatar-05', label: 'Avatar 5', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine05' },
  { id: 'avatar-06', label: 'Avatar 6', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine06' },
  { id: 'avatar-07', label: 'Avatar 7', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine07' },
  { id: 'avatar-08', label: 'Avatar 8', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine08' },
  { id: 'avatar-09', label: 'Avatar 9', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine09' },
  { id: 'avatar-10', label: 'Avatar 10', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine10' },
  { id: 'avatar-11', label: 'Avatar 11', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine11' },
  { id: 'avatar-12', label: 'Avatar 12', src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cine12' },
] as const

export function avatarIdToSrc(avatarId: string | null | undefined) {
  return AVATAR_PRESETS.find((a) => a.id === avatarId)?.src ?? AVATAR_PRESETS[0].src
}

