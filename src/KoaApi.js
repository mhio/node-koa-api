const http = require('http')
const http2 = require('http2')

const Koa = require('koa')
const koaRouter = require('@koa/router')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')

const { Exception } = require('@mhio/exception')
const {
  KoaApiHandle,
  KoaApiHandleException,
  // Dependencies
  Message,
  MessageData,
  MessageError,
  ApiResponse
} = require('@mhio/koa-api-handle')

const { KoaApiHandler } = require('./KoaApiHandler')

const debug = require('debug')('mhio:koa-api:KoaApi')
export function log(level, ...args){ return console.log('%s %s', Date.now(), level, ...args) }
export function noop(){}

class KoaApiException extends Exception {}

/** 
  Handle API requests and errors in Koa apps in a standard way. 
*/
class KoaApi {

  /**
   * Setup an array of routes
   * @param {object} app            - Koa app
   * @param {object} router         - @koa/router instance
   * @param {array} routes_config    - Array of KoaApiHandle route config objects
   * @returns {object} Koa-Router
   */
  static setupRoutes(routes_config, opts = {}){
    if (!routes_config || !routes_config.length) {
      throw new KoaApiException('Setup requires an array of route configs')
    }
    const router = opts.router || new koaRouter()
    const app = opts.app

    for (const route_config of routes_config){
      debug('Adding route', route_config)
      this.setupRoute(router, route_config)
    }

    if (app) {
      debug('Adding router to provided app')
      app.use(router.routes()).use(router.allowedMethods())
    }
    return router
  }

  /**
   * Setup a single route
   * @param {object} router                           - @koa/router instance
   * @param {object} route_config                     - route config object
   * @param {string} route_config.method              - HTTP method
   * @param {string} route_config.path                - HTTP Path
   * @param {function} route_config.fn                  - Handler function
   * @param {object} route_config.handler_object      - Object with handler function
   * @param {string} route_config.handler_function    - Method name to call in handler object
   * @returns {object} Koa-Router
   */
  static setupRoute(router, route_config = {}) {
    if (!router) throw new KoaApiException('Setup route requires a @koa/router')
    const { method, path, routes, fn, handler_object, handler_function } = this.parseRouteConfig(route_config)
    if (!path) throw new KoaApiException('Setup route requires route path')
    if (routes) {
      const sub_router = this.setupRoutes(routes)
      router.use(path, sub_router.routes()).use(sub_router.allowedMethods())
      return sub_router
    }
    if (!method) throw new KoaApiException('Setup route requires a route method')
    if (!fn && (!handler_object || !handler_function)) {
      throw new KoaApiException('Setup route requires a route `handler_*` or `fn`')
    }
    if (fn && (handler_object || handler_function)) {
      throw new KoaApiException('Setup route requires either `fn` or `handler_*`')
    }
    if (fn && typeof fn !== 'function') {
      throw new KoaApiException('Setup route requires `fn` to be a function')
    }
    if (!fn && !handler_object[handler_function]) {
      const name = (handler_object.name) ? handler_object.name : 'object'
      throw new KoaApiException(`Setup route handler \`${name}[${handler_function}]\` should exist`)
    }
    if (!fn && !handler_object[handler_function].bind) {
      const name = (handler_object.name) ? handler_object.name : 'object'
      throw new KoaApiException(`Setup route handler \`${name}[${handler_function}]\` should be a function`)
    }
    const handleFn = (fn)
      ? KoaApiHandle.response(fn)
      : KoaApiHandle.response(handler_object[handler_function].bind(handler_object))
    router[method](path, handleFn)
    return router
  }

  // Things like RAML of OpenAPI would go in here. 
  // Not sure how you would link functions to config
  static parseRouteConfig(route_config){
    if (Array.isArray(route_config)){
      const method = route_config[0]
      const path = route_config[1]
      const handler = route_config[2]
      const handler_2nd = route_config[3]
      if (handler_2nd) return {
          method,
          path,
          handler_object: handler,
          handler_function: handler_2nd
        }
      return { method, path, fn: handler}
    }
    return route_config
  }

  /**
   * Setup a KoaApi app
   * @params options {object} - Options
   * @params options.logging {object} - Logging options for KoaApiHandle.logging
   * @params options.errors {object} - Error handling options for KoaApiHandle.errors
   * @params options.tracking {object} - Options KoaApiHandle.tracking
   * @params options.cors {object} - Options KoaApiHandle.cors  [@koa/cors](http://cors)
   * @params options.bodyParser {object} - Options KoaApiHandle.bodyParser [@koa/bodyParser](http://cors)
   */
  static setupApp(opts = {}){
    const routes_config = opts.routes_config
    const app = opts.app || new Koa()
    const logger = opts.logger
    const router = (routes_config)
      ? this.setupRoutes(routes_config)
      : new koaRouter()

    const logging_config = opts.logging || {}
    const errors_config = opts.errors || {}
    const tracking_config = opts.tracking || {}
    const cors_config = opts.cors || {}
    const bodyParser_config = opts.bodyParser || {}
    const use = opts.use

    debug('logging config spread', { logger, ...logging_config })
    app.use(KoaApiHandle.errors({ logger, ...errors_config }))
    app.use(KoaApiHandle.logging({ logger, ...logging_config }))
    app.use(KoaApiHandle.tracking({ ...tracking_config }))
    app.use(cors({ keepHeadersOnError: true, ...cors_config }))
    app.use(bodyParser({ enableTypes: ['json'], jsonLimit: '16kb', strict: true, ...bodyParser_config }))
    if (use) {
      debug('setup app - adding provided `use` middleware')
      app.use(use)
    }
    app.use(router.routes()).use(router.allowedMethods())
    app.use(KoaApiHandle.notFound())
    return { app, router }
  }

  static pinoLikeConsoleLogger(){
    return {
      level: 'info',
      silent: noop,
      fatal(...args){ return log('fatal', ...args) },
      error(...args){ return log('error', ...args) },
      warn(...args){  return log('warn', ...args)  },
      info(...args){  return log('info', ...args)  },
      debug(...args){ return log('debug', ...args) },
      trace(...args){ return log('trace', ...args) },
    }
  }

  constructor(opts = {}){
    const routes = opts.routes
    const logger = opts.logger || this.constructor.pinoLikeConsoleLogger()
    const provided_app = opts.app
    const provided_middleware = opts.use
    const { app, router } = this.constructor.setupApp({
      routes_config: routes,
      logger,
      app: provided_app,
      use: provided_middleware,
      logging: opts.logging,
      cors: opts.cors,
      bodyParser: opts.bodyParser,
      tracking: opts.tracking, 
      errors: opts.errors, 
    })
    this.routes = (routes instanceof KoaApiHandler)
      ? routes.routeConfig()
      : routes
    this.app = app
    this.router = router
    this.logger = logger
  }

  /**
   * Setup a http server to listen for the app
   * @param {string|number} address   - Node http server listen address 
   * @returns {Promise<http.Server>}
   */
  listen(address){
    return new Promise(ok => {
      this.srv = http.createServer(this.app.callback())
      this.srv.listen(address, ()=> ok(this.srv))
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
      this.srv2 = http2.createSecureServer({}, this.app.callback())
      this.srv2.listen(address, ()=> ok(this.srv2))
    })
  }

}

module.exports = {
  KoaApi,
  KoaApiException,
  // Dependencies
  KoaApiHandle,
  KoaApiHandleException,
  Message,
  MessageData,
  MessageError,
  ApiResponse
}
