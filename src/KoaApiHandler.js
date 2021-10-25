const debugr = require('debug')
const _snakecase = require('lodash.snakecase')

const {
  generateBodyValidationMiddleware,
  generateRouteParamsValidationMiddleware,
  generateQueryStringValidationMiddleware,
} = require('./validations')

const debug = debugr('mhio:koa-api:KoaApiHandler')

class KoaApiHandler {

  static _initialiseClass(){
    /**
     * Whether to hyphenate API route paths
     */
    // this.path_joiner = ''
    this.path_joiner = '-'
  }
  
  /**
   * Simple `bind` helper
   * @param {string} name               - Function name to bind
   * @returns {function}                - Function bound to `this` class object
   */
  static bindFunction(name){
    if (!this[name]) throw new Error(`No property named "${name}"`)
    if (!this[name].bind) throw new Error(`Property "${name}" is not a function`)
    return this[name].bind(this)
  }
  
  /**
   * Get the second camel case word onwards
   * @param {string} function_name      - Function name to split
   */
  static routeHttpName(function_name, joiner = ''){
    return _snakecase(function_name)
      .split('_')
      .slice(1)
      .join(joiner)
      .toLowerCase()
  }
  
  /**
   * Get the first camel case word as route method and the rest as a route /path string
   * If a route method has a `route_{{Method}}` property, that will be used instead.
   * @param {string} function_name      - Function name to turn into route method/path
   * @returns {object}                  - 
   */
  static routeHttpMethod(function_name){
    // path
    const route_path = this[`path_${function_name}`] || this.routeHttpName(function_name, this.path_joiner)
    const route_raw = Boolean(this[`raw_${function_name}`])
  
    // validations
    const validations = []

    if (this[`body_${function_name}`]) {
      const fields = Object.freeze(Object.entries(this[`body_${function_name}`]))
      const validateKoaBody = generateBodyValidationMiddleware(route_path, fields)
      validations.push(validateKoaBody) 
    }

    if (this[`params_${function_name}`]) {
      const params = Object.freeze(Object.entries(this[`params_${function_name}`]))
      const validateKoaParams = generateRouteParamsValidationMiddleware(route_path, params)
      validations.push(validateKoaParams) 
    }

    if (this[`query_${function_name}`]) {
      const query_strings = Object.freeze(Object.entries(this[`query_${function_name}`]))
      const validateKoaQuery = generateQueryStringValidationMiddleware(route_path, query_strings)
      validations.push(validateKoaQuery)
    }

    // methods
    const route_validations = validations.length && validations
    if (function_name.startsWith('get')) {
      return { route_method: 'get', route_path, route_validations, route_raw }
    }
    if (function_name.startsWith('post') || function_name.startsWith('create')) {
      return { route_method: 'post', route_path, route_validations, route_raw }
    }
    if (function_name.startsWith('delete') || function_name.startsWith('remove')) {
      return { route_method: 'delete', route_path, route_validations, route_raw }
    }
    if (function_name.startsWith('patch') || function_name.startsWith('update')) {
      return { route_method: 'patch', route_path, route_validations, route_raw }
    }
    if (function_name.startsWith('put') || function_name.startsWith('replace')) {
      return { route_method: 'put', route_path, route_validations, route_raw }
    }
    if (function_name.startsWith('routes')) {
      return { routes: this[function_name], route_path }
    }
    return { skip: true }
  }

  /**
   * Return the KoaApi route config array for this handler
   * @params {Object} options
   * @params {String} options.path_prefix  -  Path to prefix all routes with ('/something')
   * @returns {Array} KoaApi route config array
   */
  static routeConfig({ path_prefix = '' } = {}){
    const config = []
    debug('routeConfig for %s', this.name)
    for (const fn_name of Object.getOwnPropertyNames(this)){
      const { route_method, route_path, skip, routes, route_validations, route_raw } = this.routeHttpMethod(fn_name)
      if (skip) {
        debug('routeConfig skipping', fn_name)
        continue
      }
      const route_path_prefix = (route_path.startsWith('/')) ? '' : '/'
      const o = {
        path: `${path_prefix}${route_path_prefix}${route_path}`,
      }
      if (routes) {
        debug('routeConfig found sub routes [%s]', route_path, routes)
        o.routes = routes
      }
      else {
        debug('routeConfig found routes [%s] %s %s val[%s] raw[%s]', fn_name, route_method, route_path, route_validations && route_validations.length, route_raw)
        o.fn = this.bindFunction(fn_name)
        o.method = route_method
        o.raw = route_raw
        o.validations = route_validations
      }
      config.push(o)
    }
    return config
  }
  
}
KoaApiHandler._initialiseClass()

module.exports = {
  KoaApiHandler,
  default: KoaApiHandler,
}
