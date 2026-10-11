import { favorite } from '../../server/demos.js'

export function POST(request: Request) {
  return favorite(request)
}
