@mhio/koa-api
--------------------

A Koa API to do all the request heavy lifting, so you just write logic

Errors and json responses are handled, just `return` the data or `throw` the error

Based on [`@mhio/koa-api-handler`](https://github.com/mhio/node-koa-api-handle) and it's [message format](https://github.com/mhio/js-message)

## Install

```
yarn add @mhio/koa-api
npm install @mhio/koa-api
```

## Usage

[API docs](doc/API.md)

```
const {KoaApi} = require('@mhio/koa-api')

class MyHandler {

  static get error_message(){
    return 'Failure'
  }

  static async ok(ctx){
    return {
      ok: true,
      request_id, ctx.state.request_id,
    }
  }

  static async other(){
    return 'other'
  }

  static async error(){
    throw new Error(this.error_message)
  }

}

// Route config for the API
const routes = {
  // Simple function
  [ 'get', '/ok', MyHandler.ok ],

  // Function bound to parent
  [ 'get', '/ok2', MyHandler, 'ok' ],

  // Object setup
  { method: 'post', path: '/other', fn: MyHandler.other },

  // binds `MyHandler` for you
  { method: 'get', path: '/error', handler_object: MyHandler, handler_function: 'error' },
)
const api = new KoaApi()
api.listen().then(srv => console.log(srv))
```
