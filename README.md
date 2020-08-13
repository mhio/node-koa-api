@mhio/koa-api
--------------------

A Koa API to do all the request heavy lifting, so you just write logic


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

const routes = {
  [ 'get', '/ok', MyHandler, 'ok' ],
  { method: 'post', path: '/other', fn: MyHandler.other },
  // binds `MyHandler` for you
  { method: 'get', path: '/error', handler_object: MyHandler, handler_function: 'error' },
)
const api = new KoaApi()
api.listen().then(srv => console.log(srv))
```
