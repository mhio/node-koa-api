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
function log(level, ...args){ return console.log('%s %s', Date.now(), level, ...args) } // nyc-ignore-line
function noop(){}

class KoaApiException extends Exception {}

/** 
  Handle API requests and errors in Koa apps in a standard way. 
*/
class KoaApi {

  /**
   * Setup an array of routes
   * @param {array|KoaApiHandler} routes_config    - Array of KoaApiHandler route config objects or KoaApiHandler
   * @param {object} opts            -
   * @param {object} opts.router     - @koa/router instance
   * @param {object} opts.app        - Koa app
   * @returns {object} Koa-Router
   */
  static setupRoutes(routes_config, opts = {}){
    if (!routes_config || ( !routes_config.length && !routes_config.routeConfig )) {
      throw new KoaApiException('Setup requires an array of route configs or an instance of KoaApiHandler')
    }
    const router = opts.router || new koaRouter()
    const app = opts.app

    const loop_routes_config = (routes_config.routeConfig)
      ? routes_config.routeConfig()
      : routes_config
    for (const route_config of loop_routes_config){
      if (route_config.routeConfig) {
        const handler_routes = route_config.routeConfig()
        for (const handler_route of handler_routes) {
          this.setupRoute(router, handler_route)
        }
      }
      else {
        this.setupRoute(router, route_config)
      }
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
    debug('setupRoute got route config', route_config)
    const { method, path, routes, fn, handler_object, handler_function, validations, raw } = this.parseRouteConfig(route_config)
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
    let handleFn
    if (raw) {
      handleFn = (fn)
        ? fn
        : handler_object[handler_function].bind(handler_object)
      debug('raw', method, path)
      // generate validation function
    }
    else {
      handleFn = (fn)
        ? KoaApiHandle.response(fn)
        : KoaApiHandle.response(handler_object[handler_function].bind(handler_object))
      debug('kah', method, path)
    } 
    if (validations && validations.length > 0) {
      router[method](path, ...validations, handleFn)
    } 
    else {
      router[method](path, handleFn)
    }
    return router
  }


  // 
  static genValidationMiddleware(validations_arr) {
    if (!validations_arr) return null
    return async function(ctx){
      for (const validation_fn of validations_arr) {
        validation_fn(ctx)
      }
    }
  }

  // Things like RAML of OpenAPI would go in here. 
  // Not sure how you would link functions to config
  static parseRouteConfig(route_config){
    debug('converting route_config', route_config)
    if (Array.isArray(route_config)){
      const method = route_config[0]
      const path = route_config[1]
      const fn = route_config[2]
      const raw = route_config[3]
      return { method, path, fn, raw }
    }
    return route_config
  }

  /**
   * Setup a KoaApi app
   * @params options {object} - Options
   * @params options.logging {object} - Logging options for KoaApiHandle.logging
   * @params options.errors {object} - Error handling options for KoaApiHandle.errors
   * @params options.tracking {object}     - Options KoaApiHandle.tracking
   * @params options.cors {object}         - Options KoaApiHandle.cors  [@koa/cors](http://cors)
   * @params options.bodyParser {object}   - Options KoaApiHandle.bodyParser [@koa/bodyParser](http://cors)
   * @params options.routes_config {Array<KoaApiHandler>} - Options KoaApiHandle.routes_config KoaApiHandler
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
      if (!this.srv) this.srv = http.createServer(this.app.callback())
      this.srv.listen(address, ()=> ok(this.srv))
    })
  }
  /**
   * Setup a http2 server to listen for the app
   * @param {string|number} address 
   * @returns {Promise<http2.Server>}
   */
  /* istanbul ignore next */
  listen2(address){
    return new Promise(ok => {
      // this.srv2 = http2.createServer({}, this.app.callback())
      if (!this.srv2) this.srv2 = http2.createSecureServer({}, this.app.callback())
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
  ApiResponse,
  log,
  noop,
}
