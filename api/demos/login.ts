import { login } from '../../server/demos.js'

export function POST(request: Request) {
  return login(request)
}
