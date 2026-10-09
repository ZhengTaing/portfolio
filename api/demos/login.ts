import { login } from '../../server/demos'

export function POST(request: Request) {
  return login(request)
}
