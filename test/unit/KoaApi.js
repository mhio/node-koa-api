/* global expect */
const { KoaApi } = require('../../src/KoaApi')

describe('test::unit::KoaApi', function(){

  it('should load KoaApi', function(){
    expect( KoaApi ).to.be.ok    
  })

  it('should return a response function', function(){
    expect( KoaApi.setupRoutes ).to.be.a('function')
  })

  it('should return a customResponse function', function(){
    expect( KoaApi.setupRoute ).to.be.a('function')
  })

  it('should fail to setupRoutes with no args', function(){
    const fn = () => KoaApi.setupRoutes()
    expect(fn).to.throw('Setup requires')
  })

  it('should fail to setupRoute with no args', function(){
    const fn = () => KoaApi.setupRoute()
    expect(fn).to.throw('Setup route requires')
  })

  it('should fail to setupRoute with no args', function(){
    const fn = () => KoaApi.setupRoute({})
    expect(fn).to.throw('Setup route requires')
  })

  it('should fail to setupRoute with no handler args', function(){
    const fn = () => KoaApi.setupRoute({}, { path: '/test', method: 'get' })
    expect(fn).to.throw('Setup route requires a route `handler_*` or `fn`')
  })

  it('should fail to setupRoute with redundant args', function(){
    const fn = () => KoaApi.setupRoute({}, { path: '/test', method: 'get', fn: true, handler_object: true })
    expect(fn).to.throw('Setup route requires either `fn` or `handler_*`')
  })

  it('should fail to setupRoute with redundant args', function(){
    const fn = () => KoaApi.setupRoute({}, { path: '/test', method: 'get', fn: true })
    expect(fn).to.throw('Setup route requires `fn` to be a function')
  })
  it('should fail to setupRoute without handler function', function(){
    const handler = {}
    const fn = () => KoaApi.setupRoute({}, { path: '/test', method: 'get', handler_object: handler, handler_function: 'nope' })
    expect(fn).to.throw('Setup route handler `object[nope]` should exist')
  })
  it('should fail to setupRoute with handler function that\'s not a function', function(){
    const handler = { nope: true }
    const fn = () => KoaApi.setupRoute({}, { path: '/test', method: 'get', handler_object: handler, handler_function: 'nope' })
    expect(fn).to.throw('Setup route handler `object[nope]` should be a function')
  })
  it('should setup a single route', function(){
    const router = { 
      get(path){ this.ok = true, this.path = path }
    }
    const config =  { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') }
    expect(KoaApi.setupRoute(router, config)).to.containSubset({
      ok: true,
      path: '/ok' 
    })
  })
  it('should have a pino dummy', function(){
    const log = KoaApi.pinoLikeConsoleLogger()
    expect(log).to.be.ok
    expect(log.fatal('wow')).to.be.undefined
  })

})
