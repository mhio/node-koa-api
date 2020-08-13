const {KoaApi} = require('../')
//const {KoaApi} = require('@mhio/koa-api')

class MyHandler {
 
  static get something(){
    return 'something'
  } 

  static get error_message(){
    return 'Failure'
  }

  static async ok(ctx){
    return {
      ok: true,
      request_id: ctx.state.request_id,
    }
  }
  
  static async other(){
    return 'other'
  }

  static async useThis(){
    return this.something
  }
  
  static async error(){
    throw new Error(this.error_message)
  }

}

const routes = [
 [ 'get', '/ok', MyHandler.ok ],
 { method: 'get', path: '/ok2', fn: MyHandler.ok },
 [ 'post', '/other', MyHandler.other ],
 [ 'get', '/something', MyHandler, 'useThis' ],
 { method: 'get', path: '/something-object', handler_object: MyHandler, handler_function: 'useThis' },
 { method: 'get', path: '/something-bind', fn: MyHandler.useThis.bind(MyHandler) },
 { path: '/sub', routes: [
    { method: 'get', path: '/error', fn: MyHandler.error },
 ]},
]
const api = new KoaApi({ routes })

// const node_http_srv = await api.listen()
api.listen().then(srv => console.log('listening', srv.address()))
