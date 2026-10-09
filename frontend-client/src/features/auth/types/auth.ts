export interface UserInfo {
  userId: string
  email?: string
  username?: string
  fullName: string
  phone?: string
  logoUrl?: string
  roles: string[]
}

export interface AuthResponseData {
  accessToken: string
  user: UserInfo
}

export interface LoginPayload {
  identifier?: string
  email?: string
  password: string
}

export interface RegisterPayload {
  identifier?: string
  username?: string
  email?: string
  phone?: string
  fullName?: string
  password: string
}
