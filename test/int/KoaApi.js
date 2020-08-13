/* global expect */
const supertest = require('supertest')
const http = require('http')
const Koa = require('koa')

const { KoaApi } = require('../../src/KoaApi')
const {testPinoLogger} = require('../helpers.web')

describe('test::int::KoaApi', function(){

  let app = null
  let server = null
  let request

  beforeEach(function(done){
    app = new Koa()
    server = http.createServer(app.callback()).listen(done)
    request = supertest(server)
  })

  afterEach(function(done){
    server.close(done)
  })

  it('should generate a koa response', async function(){
    let oroutes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') }
    ]
    const router = KoaApi.setupRoutes(oroutes)
    app.use(router.routes()).use(router.allowedMethods())
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.body ).to.have.property('data').and.equal('ok')
  })

  it('should generate a koa response', async function(){
    let oroutes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') }
    ]
    KoaApi.setupRoutes(oroutes, { app })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.body ).to.have.property('data').and.equal('ok')
  })

  it('should generate a koa response', async function(){
    const handler = {
      ok: function() { return Promise.resolve(this.value) },
      value: 'okeydokey',
    }
    let oroutes = [
      { path: '/ok', method: 'get', handler_object: handler, handler_function: 'ok' }
    ]
    KoaApi.setupRoutes(oroutes, { app })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.body ).to.have.property('data').and.equal('okeydokey')
  })

  it('should generate a koa response for a sub router', async function(){
    let oroutes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok1') },
      { path: '/sub', routes: [
        { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok2') },
      ]},
    ]
    KoaApi.setupRoutes(oroutes, { app })
    let res = await request.get('/sub/ok')
    expect( res.status ).to.equal(200)
    expect( res.body ).to.have.property('data').and.equal('ok2')
    let resok = await request.get('/ok')
    expect( resok.status ).to.equal(200)
    expect( resok.body ).to.have.property('data').and.equal('ok1')
  })

  it('should create a KoaApi', function(){
    expect( new KoaApi() ).to.be.ok
  })

  it('should create a KoaApi', function(){
    const api = new KoaApi()
    expect( api.app ).to.be.ok
    expect( api.router ).to.be.ok
  })

  it('should create a KoaApi', async function(){
    const routes = [
      { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') }
    ]
    const logger = testPinoLogger()
    new KoaApi({ routes, app, logger, })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.body ).to.have.property('data').and.equal('ok')
    expect(logger.logs).to.have.lengthOf(1)
    expect(logger.logs[0]).to.containSubset(['info'])
  })

})
