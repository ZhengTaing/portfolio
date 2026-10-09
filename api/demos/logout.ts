import { logout } from '../../server/demos'

export function POST(request: Request) {
  return logout(request)
}
