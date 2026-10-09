import { audio } from '../../server/demos'

export function GET(request: Request) {
  return audio(request)
}
