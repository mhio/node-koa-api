const fs = require('fs')
const path = require('path')
const axios = require('axios')
const http = require('http')
const http2 = require('http2')
const debug = require('debug')('mhio:taxios')

export class Taxios {
  
  static _initialiseClass(){
    this.tls_self_key = fs.readFileSync(path.join(__dirname,'fixture','server-key.pem'))
    this.tls_self_cert = fs.readFileSync(path.join(__dirname,'fixture','server-cert.pem'))
  }
  static app(app){
    return new this({ app })
  }
  static srv(http_server, app){
    const ret = this.app(app)
    ret.srv(http_server)
    return ret
  }
  static srv2(http2_server, app){
    const ret = this.app(app)
    ret.srv2(http2_server)
    return ret
  }
  constructor({ app }){
    this.app = app
  }
  /**
   * Setup a http server to listen for the app
   * @param {string|number} address   - Node http server listen address 
   * @returns {Promise<http.Server>}
   */
  listen(address){
    return new Promise(ok => {
      this.srv = http.createServer(this.app.callback())
      this.srv.listen(address, ()=> {
        const deets = this.srv.address()
        this.url = `http://[${deets.address}]:${deets.port}`
        debug(`url is ${this.url}`, this.srv.address())
        ok(this)
      })
    })
  }
  /**
   * Setup a http2 server to listen for the app
   * @param {string|number} address 
   * @returns {Promise<http2.Server>}
   */
  listen2(address){
    return new Promise(ok => {
      // this.srv2 = http2.createServer({}, this.app.callback())
      const opts = {
        key: this.constructor.tls_self_key,
        cert: this.constructor.tls_self_cert,
      }
      this.srv2 = http2.createSecureServer(opts, this.app.callback())
      this.srv2.listen(address, ()=> {
        const deets = this.srv2.address()
        this.url = `https://${deets.address}:${deets.port}`
        debug(`url2 is ${this.srv2.address()} ${this.url}`)
        ok(this)
      })
    })
  }

  srv(http_server){
    this.srv = http_server
    const deets = this.srv.address()
    const server_address = (/:/.exec(deets.address))
      ? `[${deets.address}]`
      : `${deets.address}`
    this.url = `http://${server_address}:${deets.port}`
    return this
  }
  srv2(http2_server){
    this.srv2 = http2_server
    const deets = this.srv2.address()
    const server_address = (/:/.exec(deets.address))
      ? `[${deets.address}]`
      : `${deets.address}`
    this.url = `https://${server_address}:${deets.port}`
    return this
  }

  close(){
    return new Promise(ok => this.srv.close(ok))
  }

  async post(path, data, options){
    const app_url = `${this.url}${path}`
    return axios({ method: 'post', url: app_url, data, options })
  }

  async get(path, options){
    const app_url = `${this.url}${path}`
    debug('get', app_url)
    return axios.get(app_url, options)
  }

}

Taxios._initialiseClass()

export class TestPinoLogger {
  constructor(){
    this.logs = []
    this.logs_errors = []
  }
  fatal(...args) {
    this.logs.push(['fatal', ...args])
    this.logs_errors.push(['fatal', ...args])
  }
  error(...args) {
    this.logs.push(['error', ...args])
    this.logs_errors.push(['error', ...args])
  }
  warn(...args){ this.logs.push(['warn', ...args]) }
  info(...args){ this.logs.push(['info', ...args]) }
  debug(...args){ this.logs.push(['debug', ...args]) }
  clearLogs(){
    this.logs = []
    this.logs_errors = []
  }
}
