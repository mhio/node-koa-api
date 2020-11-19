/* global expect */
const Koa = require('koa')


const { KoaApi } = require('../../src/KoaApi')
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
      console.log(ctx.request)
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
    const api = new KoaApi({ routes, logger, app, errors: { allowed_errors: {CustomError: true}} })
    const res = await request.sendError('get', '/custom')
    expect( res.data ).to.have.property('error').and.containSubset({ message: 'no' })
  })

  it('should inject tracking options into KoaApiHandle', async function(){
    const api = new KoaApi({ routes: ok_routes, logger, app, tracking: { transaction_trust: true } })
    const res = await request.get('/ok', null,{ headers: { 'x-transaction-id': 'qwerqwer' }})
    expect( res.data ).to.have.property('data').and.equal('ok')
    expect( res.headers ).to.have.property('x-transaction-id').and.equal('qwerqwer')
  })

  it('should inject cors options into KoaApiHandle', async function(){
    //const use = ctx => console.log('headers',ctx.request.headers, ctx.get('Origin'))
    const api = new KoaApi({ routes: ok_routes, logger, app, cors: { origin: 'apro://nope' } })
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
    const api = new KoaApi({ routes, logger, app, bodyParser: { jsonLimit: '32b' } })
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
