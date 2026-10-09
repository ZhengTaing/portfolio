import { audio } from '../../server/demos.js'

export function GET(request: Request) {
  return audio(request)
}
