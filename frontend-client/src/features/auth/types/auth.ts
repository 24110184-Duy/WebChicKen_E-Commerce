export interface UserInfo {
  userId: string
  email: string
  fullName: string
  phone: string
  logoUrl?: string
  roles: string[]
}

export interface AuthResponseData {
  accessToken: string
  user: UserInfo
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  phone: string
  password: string
}
