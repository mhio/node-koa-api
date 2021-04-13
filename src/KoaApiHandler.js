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
    const route_path = this[`route_${function_name}`] || this[`path_${function_name}`] || this.routeHttpName(function_name, this.path_joiner)
    if (function_name.startsWith('get')) {
      return { route_method: 'get', route_path }
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
      const { route_method, route_path, skip } = this.routeHttpMethod(fn_name)
      if (skip) {
        // debug('routeConfig skipping', fn_name)
        continue
      }
      debug('routeConfig found [%s]', fn_name, route_method, route_path)
      const route_path_prefix = (route_path.startsWith('/')) ? '' : '/'
      config.push([route_method, `${path_prefix}${route_path_prefix}${route_path}`, this.bindFunction(fn_name) ])
    }
    return config
  }
  
}
KoaApiHandler._initialiseClass()

export default KoaApiHandler
