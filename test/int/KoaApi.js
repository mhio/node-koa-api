/* global expect */
const Koa = require('koa')


const { KoaApi } = require('../../src/KoaApi')
const { KoaApiHandler } = require('../../src/KoaApiHandler')
const { Taxios } = require('@mhio/taxios')

const ok_routes = [
  { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') },
]

describe('test::int::KoaApi', function(){

  let app = null
  let request
  let logger

  beforeEach(async function(){
    app = new Koa()
    request = await Taxios.app(app)
    logger = request.logger
  })

  afterEach(async function(){
    await request.afterMocha(this)
    request = null
  })

  it('should generate a koa response', async function(){
    let routes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') }
    ]
    const router = KoaApi.setupRoutes(routes)
    app.use(router.routes()).use(router.allowedMethods())
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('ok')
  })

  it('should generate a koa response', async function(){
    let routes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') }
    ]
    KoaApi.setupRoutes(routes, { app })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('ok')
  })

  it('should generate a koa response', async function(){
    const handler = {
      ok: function() { return Promise.resolve(this.value) },
      value: 'okeydokey',
    }
    let routes = [
      { path: '/ok', method: 'get', handler_object: handler, handler_function: 'ok' }
    ]
    KoaApi.setupRoutes(routes, { app })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('okeydokey')
  })

  it('should generate a koa response for a sub router', async function(){
    let routes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok1') },
      { path: '/sub', routes: [
        { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok2') },
      ]},
    ]
    KoaApi.setupRoutes(routes, { app })
    let res = await request.get('/sub/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('ok2')
    let res_ok = await request.get('/ok')
    expect( res_ok.status ).to.equal(200)
    expect( res_ok.data ).to.have.property('data').and.equal('ok1')
  })

  it('should allow a koa raw response', async function(){
    const ok = async (ctx) => { ctx.body = 'raw' }
    let routes = [
      { path: '/ok', method: 'get', fn: ok, raw: true, }
    ]
    KoaApi.setupApp({ routes_config: routes, app, logger })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.headers['content-type'] ).to.match(/text\/plain/)
    expect( res.data ).to.equal('raw')
  })

  it('should generate a koa body response from config with validation function', async function(){
    const ok = async () => 'ok'
    let routes = [
      { path: '/ok', method: 'get', fn: ok, validation: [ (ctx, next) => next ], }
    ]
    KoaApi.setupApp({ routes_config: routes, app, logger })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('ok')
  })

  it('should generate a koa body  response from a Kah class with validation config', async function(){
    class TestRoutest extends KoaApiHandler {
      static body_postOk = {
        one: (v) => v === 'two',
      }
      static async postOk(){
        return { ok: true }
      }
    }
    new KoaApi({ routes: [ TestRoutest ], app, logger })
    let res = await request.post('/ok', { one: 'two' })
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.eql({ ok: true })
  })

  it('should generate a koa body validation error from a Kah class', async function(){
    class TestRoutest extends KoaApiHandler {
      static body_postOk = {
        one: (v) => v === 'two',
      }
      static async postOk(){
        return { ok: true }
      }
    }
    new KoaApi({ errors: { allowed_errors: { 'ValidationError': true } }, routes: [ TestRoutest ], app, logger })
    let res = await request.sendError('post', '/ok', { one: 'nottwo' })
    expect( res.status ).to.equal(400)
    expect( res.data ).to.containSubset({
      error: {
        details: {
          field: 'one',
          path: 'ok',
        },
      },
    })
  })

  it('should generate a koa body validation error', async function(){
    const handler = {
      ok: function() { return Promise.resolve(this.value) },
      value: 'okeydokey',
    }
    const errorGen = () => {
      const error = new Error('no')
      error.status = 400
      error.statusCode = 400
      error.name = 'ValidationError'
      throw error
    }
    let routes = [
      { path: '/ok', method: 'post', handler_object: handler, handler_function: 'ok', validations: [ errorGen ] }
    ]
    KoaApi.setupApp({ routes_config: routes, app, logger, })
    let res = await request.sendError('post', '/ok')
    expect( res.status ).to.equal(400)
    expect( res.data ).to.containSubset({
      error: { 
        name: 'ValidationError',
      },
    })
  })

  it('should generate a koa query  response from a Kah class with validation config', async function(){
    class TestRoutest extends KoaApiHandler {
      static query_getOk = {
        one: (v) => v === 'two',
      }
      static async getOk(){
        return { ok: true }
      }
    }
    new KoaApi({ routes: [ TestRoutest ], app, logger })
    let res = await request.get('/ok?one=two')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.eql({ ok: true })
  })

  it('should generate a koa query validation error from a Kah class', async function(){
    class TestQueryRoute extends KoaApiHandler {
      static query_getOk = {
        str: (v) => v === 'qry',
      }
      static async getOk(){
        return { ok: true }
      }
    }
    new KoaApi({ errors: { allowed_errors: { 'ValidationError': true } }, routes: [ TestQueryRoute ], app, logger })
    let res = await request.sendError('get', '/ok?str=a')
    expect( res.status ).to.equal(400)
    expect( res.data ).to.containSubset({
      error: {
        details: {
          field: 'str',
          value: 'a',
          path: 'ok',
        },
      },
    })
  })

  it('should generate a koa param  response from a Kah class with validation config', async function(){
    class TestParamTestOk extends KoaApiHandler {
      static path_getOk = '/ok/:id'
      static params_getOk = {
        id: (v) => v === '4',
      }
      static async getOk(){
        return { ok: true }
      }
    }
    new KoaApi({ routes: [ TestParamTestOk ], app, logger })
    let res = await request.get('/ok/4')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.eql({ ok: true })
  })

  it('should generate a koa param validation error from a Kah class', async function(){
    class TestParamTestFail extends KoaApiHandler {
      static path_getOk = '/ok/:id'
      static params_getOk = {
        id: (v) => v === '4',
      }
      static async getOk(){
        return { ok: true }
      }
    }
    new KoaApi({ errors: { allowed_errors: { 'ValidationError': true } }, routes: [ TestParamTestFail ], app, logger })
    let res = await request.sendError('get', '/ok/nope')
    expect( res.status ).to.equal(400)
    expect( res.data ).to.containSubset({
      error: {
        details: {
          field: 'id',
          value: 'nope',
          path: '/ok/:id',
        },
      },
    })
  })

  it('should create a KoaApi with no config', function(){
    const api = new KoaApi()
    expect( api.app ).to.be.ok
    expect( api.router ).to.be.ok
  })

  it('should create a KoaApi with object config and respond', async function(){
    const routes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') }
    ]
    new KoaApi({ routes, app, logger, })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('ok')
    expect(logger.logs).to.have.lengthOf(1)
    expect(logger.logs[0]).to.containSubset(['info'])
  })

  it('should create a KoaApi with multi object config and respond', async function(){
    const routes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') },
      [ 'get', '/ok2', ()=> Promise.resolve('ok') ],
    ]
    new KoaApi({ routes, app, logger, })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('ok')
    expect(logger.logs).to.have.lengthOf(1)
    expect(logger.logs[0]).to.containSubset(['info'])
    let res2 = await request.get('/ok2')
    expect( res2.status ).to.equal(200)
    expect( res2.data ).to.have.property('data').and.equal('ok')
  })

  it('should create a KoaApi with sub router config and respond', async function(){
    const routes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') },
      { path: '/sub', routes: [
        [ 'get', '/ok2', ()=> Promise.resolve('ok2') ],
      ]},
      [ 'get', '/ok3', ()=> Promise.resolve('ok3') ],
    ]
    new KoaApi({ routes, app, logger, })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('ok')
    expect(logger.logs).to.have.lengthOf(1)
    expect(logger.logs[0]).to.containSubset(['info'])
    let res2 = await request.get('/sub/ok2')
    expect( res2.status ).to.equal(200)
    expect( res2.data ).to.have.property('data').and.equal('ok2')
    let res3 = await request.get('/ok3')
    expect( res3.status ).to.equal(200)
    expect( res3.data ).to.have.property('data').and.equal('ok3')
  })

  it('should create a KoaApi with global `use` middleware', async function(){
    const routes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') },
    ]
    const use = (ctx) => {
      if (ctx.request.path === '/ok') ctx.body = 'intercepted'
    }
    new KoaApi({ routes, app, logger, use })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.equal('intercepted')
  })


  it('should inject logging options into KoaApiHandle', async function(){
    let logged = false
    const mock_logger = {
       trace: () => logged = true
    }
    new KoaApi({ logger, routes: ok_routes, app, logging: { logger: mock_logger, log_level: 'trace' } })
    const res = await request.get('/ok')
    expect( res.data ).to.have.property('data').and.equal('ok')
    expect(logged).equal(true)
  })
  it('should inject error options into KoaApiHandle', async function(){
    class CustomError extends Error {
      constructor(msg){
        super(msg)
        this.name = this.constructor.name
        this.status = 503
      }
    }
    const routes = [{ method: 'get', path: '/custom', fn: ()=> Promise.reject(new CustomError('no')), }]
    new KoaApi({ routes, logger, app, errors: { allowed_errors: {CustomError: true}} })
    const res = await request.sendError('get', '/custom')
    expect( res.data ).to.have.property('error').and.containSubset({ message: 'no' })
  })

  it('should inject tracking options into KoaApiHandle', async function(){
    new KoaApi({ routes: ok_routes, logger, app, tracking: { transaction_trust: true } })
    const res = await request.get('/ok', null,{ headers: { 'x-transaction-id': 'qwerqwer' }})
    expect( res.data ).to.have.property('data').and.equal('ok')
    expect( res.headers ).to.have.property('x-transaction-id').and.equal('qwerqwer')
  })

  it('should inject cors options into KoaApiHandle', async function(){
    //const use = ctx => console.log('headers',ctx.request.headers, ctx.get('Origin'))
    new KoaApi({ routes: ok_routes, logger, app, cors: { origin: 'apro://nope' } })
    const port = request.srv.address().port
    const res = await request.send('options', `http://127.0.0.1:${port}/ok`, null, {
      headers: {
        'Origin': 'http://example.org/',
        'Access-Control-Request-Method': 'POST',
      },
    })
    expect( res.headers ).to.containSubset({ 'access-control-allow-origin': 'apro://nope' })
  })

  it('should inject bodyParser options into KoaApiHandle', async function(){
    const routes = [{ method: 'post', path: '/ok', fn: ()=> Promise.resolve('ok'), }]
    new KoaApi({ routes, logger, app, bodyParser: { jsonLimit: '32b' } })
    const res = await request.sendError('post', '/ok', { data: 'somedatathatislongerthan32b' })
    expect( res.data ).to.have.property('error').and.containSubset({ name: 'PayloadTooLargeError' })
    expect( res.status ).to.equal(413)
  })

  describe('listens', function(){

    let listens_request

    afterEach('close', async function(){
      await listens_request.cleanUp()
    })

    it('should listen on http', async function(){
      const api = new KoaApi({ routes: [[ 'get', '/ok', async ()=>'ok' ]], logger })
      const srv = await api.listen()
      listens_request = Taxios.server(srv)
      let res = await listens_request.get('/ok')
      expect(logger.errors).to.eql([])
      expect( res.data ).to.have.property('data').and.equal('ok')
    })

    xit('should listen on http2', async function(){
      const api = new KoaApi({ routes: [[ 'get', '/ok', async()=>'ok' ]], app, logger, })
      const srv2 = await api.listen2()
      listens_request = Taxios.server2(srv2)
      let res = await listens_request.get('/ok')
      expect(logger.errors).to.eql([])
      expect( res.data ).to.have.property('data').and.equal('ok')
    })

  })

})
