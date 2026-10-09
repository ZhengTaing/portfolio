import { logout } from '../../server/demos.js'

export function POST(request: Request) {
  return logout(request)
}
