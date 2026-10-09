import { list } from '../../server/demos.js'

export function GET(request: Request) {
  return list(request)
}
