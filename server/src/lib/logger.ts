const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const MAGENTA = '\x1b[35m'

function statusColor(status: number) {
  if (status < 300) return GREEN
  if (status < 400) return CYAN
  if (status < 500) return YELLOW
  return RED
}

export const logger = {
  info: (msg: string, ...args: unknown[]) =>
    console.log(
      `${DIM}${new Date().toISOString()}${RESET} ${CYAN}INFO${RESET}  ${msg}`,
      ...args,
    ),

  warn: (msg: string, ...args: unknown[]) =>
    console.log(
      `${DIM}${new Date().toISOString()}${RESET} ${YELLOW}WARN${RESET}  ${msg}`,
      ...args,
    ),

  error: (msg: string, ...args: unknown[]) =>
    console.log(
      `${DIM}${new Date().toISOString()}${RESET} ${RED}ERROR${RESET} ${msg}`,
      ...args,
    ),

  request: (method: string, path: string, status: number, ms: number) => {
    const sc = statusColor(status)
    console.log(
      `${DIM}${new Date().toISOString()}${RESET} ${sc}${status}${RESET} ${MAGENTA}${method.padEnd(6)}${RESET} ${path} ${DIM}${ms}ms${RESET}`,
    )
  },
}
