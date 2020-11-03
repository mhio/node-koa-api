import debugr from 'debug'
import _snakecase from 'lodash.snakecase'

const debug = debugr('mhio:koa-api:KoaApiHandler')

export class KoaApiHandler {

  /**
   * Simple `bind` helper
   * @param {string} name               - Function name to bind
   * @returns {function}                - Function bound to `this` class object
   */
  static bindFunction(name){
    return this[name].bind(this)
  }
  
  /**
   * Get the second camel case word onwards
   * @param {string} function_name      - Function name to split
   */
  static routeHttpName(function_name){
    return _snakecase(function_name).split('_').slice(1).join('').toLowerCase()
  }
  
  /**
   * Get the first camel case word as route method and the rest as a route /path string
   * @param {string} function_name      - Function name to turn into route method/path
   * @returns {object}                  - 
   */
  static routeHttpMethod(function_name){
    const route_name = this[`${function_name}Route`] || this.routeHttpName(function_name)
    if (function_name.startsWith('get')) {
      return { route_method: 'get', route_name }
    }
    if (function_name.startsWith('post') || function_name.startsWith('create')) {
      return { route_method: 'post', route_name }
    }
    if (function_name.startsWith('delete') || function_name.startsWith('remove')) {
      return { route_method: 'delete', route_name }
    }
    if (function_name.startsWith('patch') || function_name.startsWith('update')) {
      return { route_method: 'patch', route_name }
    }
    if (function_name.startsWith('put') || function_name.startsWith('replace')) {
      return { route_method: 'put', route_name }
    }
    return { skip: true }
  }

  /**
   * Return the KoaApi route config array for this handler
   * @returns {Array} KoaApi route config array
   */
  static routeConfig(){
    const config = []
    debug('routeConfig for %s', this.name)
    for (const fn_name of Object.getOwnPropertyNames(this)){
      const { route_method, route_name, skip } = this.routeHttpMethod(fn_name)
      if (skip) {
        // debug('routeConfig skipping', fn_name)
        continue
      }
      debug('routeConfig found [%s]', fn_name, route_method, route_name)
      config.push([route_method, `/${route_name}`, this.bindFunction(fn_name) ])
    }
    return config
  }
  
}

export default KoaApiHandler