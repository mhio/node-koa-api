@mhio/koa-api-handle
--------------------

A Koa API Handler to do all the request heavy lifting, so you just write logic


## Install

```
yarn add @mhio/koa-api-handle
npm install @mhio/koa-api-handle
```

## Usage

[API docs](doc/API.md)

```
const Koa = require('koa')
const Router = require('koa-router')
const {KoaApiHandle} = require('@mhio/koa-api-handle')

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

const app = new Koa()
const router = new Router()

app.use(KoaApiHandle.error())
app.use(KoaApiHandle.tracking())

router.get('/ok', KoaApiHandle.response(MyHandler, 'ok'))
router.post('/other', KoaApiHandle.response(MyHandler, 'other'))
router.get('/error', KoaApiHandle.response(MyHandler.error.bind(MyError)))

app.use(router.routes())
   .use(router.allowedMethods())

app.use(KoaApiHandle.notFound())

app.listen()
```
