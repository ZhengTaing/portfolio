import { list } from '../../server/demos'

export function GET(request: Request) {
  return list(request)
}
