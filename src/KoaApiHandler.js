import debugr from 'debug'
import _snakecase from 'lodash.snakecase'

const debug = debugr('mhio:koa-api:KoaApiHandler')

export class KoaApiHandler {

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
  
    // validations
    const route_validation = []
    if (this[`body_${function_name}`]) {
      const error_class = ValidationError
      const fields = Object.entries(this[`body_${function_name}`])
      function validateKoaBody(ctx) {
        if (!ctx.body) {
          const error = new error_class('No body in request')
          error.path = route_path
          throw error
        }
        for (const [ field, validation ] of fields) {
          if (!ctx.body[field]) {
            const error = new error_class(`No ${field} in request`)
            error.path = route_path
            throw error
          }
          if (!validation(ctx.body[field])) {
            const error = new error_class(`Field ${field} is not valid`)
            error.field = field
            error.value = ctx.body[field]
            error.path = route_path
            throw error
          }
        }
      }
      route_validation.push(validateKoaBody) 
    }

    if (this[`params_${function_name}`]) {
      const params = Object.entries(this[`params_${function_name}`])
      function validateKoaParams(ctx) {
        if (!ctx.params) throw new error_class('No params')
        for (const [ param, validation ] of params) {
          if (!ctx.params[param]) {
            const error = new error_class(`No ${param} in url`)
            error.path = route_path
            throw error
          }
          if (!validation(ctx.params[field])) {
            const error = new error_class(`URL param "${param}" is not valid`)
            error.field = field
            error.value = ctx.params[field]
            error.path = route_path
            throw error
          }
        }
      }
      route_validation.push(validateKoaParams) 
    }

    if (this[`query_${function_name}`]) {
      const query_strings = Object.entries(this[`query_${function_name}`])
      function validateKoaQuery(ctx) {
        if (!ctx.query) throw new error_class('No query string')
        for (const [ query, validation ] of query_strings) {
          if (!ctx.query[param]) {
            const error = new error_class(`No query string param "${param}" in url`)
            error.path = route_path
            throw error
          }
          if (!validation(ctx.params[field])) {
            const error = new error_class(`URL query string param "${param}" is not valid`)
            error.field = field
            error.value = ctx.query[field]
            error.path = route_path
            throw error
          } 
        } 
      }
      route_validation.push(validateKoaQuery)
    }

    // methods
    if (function_name.startsWith('get')) {
      return { route_method: 'get', route_path, route_validation }
    }
    if (function_name.startsWith('post') || function_name.startsWith('create')) {
      return { route_method: 'post', route_path }
    }
    if (function_name.startsWith('delete') || function_name.startsWith('remove')) {
      return { route_method: 'delete', route_path }
    }
    if (function_name.startsWith('patch') || function_name.startsWith('update')) {
      return { route_method: 'patch', route_path }
    }
    if (function_name.startsWith('put') || function_name.startsWith('replace')) {
      return { route_method: 'put', route_path }
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
      const { route_method, route_path, skip, routes } = this.routeHttpMethod(fn_name)
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
        debug('routeConfig found routes [%s]', fn_name, route_method, route_path)
        o.fn = this.bindFunction(fn_name)
        o.method = route_method
      }
      config.push(o)
    }
    return config
  }
  
}
KoaApiHandler._initialiseClass()

export default KoaApiHandler
