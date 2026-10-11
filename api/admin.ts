import { admin } from '../server/admin.js'

export function GET(request: Request) {
  return admin(request)
}

export function POST(request: Request) {
  return admin(request)
}
