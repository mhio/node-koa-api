/* global expect */
const Koa = require('koa')


const { KoaApi } = require('../../src/KoaApi')
const { Taxios, TestPinoLogger} = require('../helpers.web')

describe('test::int::KoaApi', function(){

  let app = null
  let request
  const logger = new TestPinoLogger()

  beforeEach(async function(){
    app = new Koa()
    request = await Taxios.app(app).listen()
  })

  afterEach(async function(){
    await request.close()
    logger.clearLogs()
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

  describe('listens', function(){

    let listens_request

    afterEach('close', async function(){
      await listens_request.close()
    })

    it('should listen on http', async function(){
      const api = new KoaApi({ routes: [[ 'get', '/ok', async ()=>'ok' ]], logger })
      const srv = await api.listen()
      listens_request = Taxios.srv(srv)
      let res = await listens_request.get('/ok')
      expect(logger.logs_errors).to.eql([])
      expect( res.data ).to.have.property('data').and.equal('ok')
    })

    xit('should listen on http2', async function(){
      const api = new KoaApi({ routes: [[ 'get', '/ok', async()=>'ok' ]], app, logger, })
      const srv2 = await api.listen2()
      listens_request = Taxios.srv2(srv2)
      let res = await listens_request.get('/ok')
      expect(logger.logs_errors).to.eql([])
      expect( res.data ).to.have.property('data').and.equal('ok')
    })

  })

})
