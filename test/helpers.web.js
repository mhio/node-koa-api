
export function testPinoLogger(){
  const logs = []
  return {
    fatal: (...args) => logs.push(['fatal', ...args]),
    error: (...args) => logs.push(['error', ...args]),
    warn: (...args) => logs.push(['warn', ...args]),
    info: (...args) => logs.push(['info', ...args]),
    debug: (...args) => logs.push(['debug', ...args]),
    logs
  }
}