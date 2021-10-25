const { expect } = require('chai')
const { KoaApi } = require('../../src/KoaApi')
const sinon = require('sinon')

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
      get: sinon.spy()
    }
    const config =  { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok') }
    KoaApi.setupRoute(router, config)
    expect(router.get).to.have.been.calledWith('/ok')
    const call = router.get.getCall(0)
    expect(call.args[1].name).to.equal('koaApiHandleApiResponse')
  })

  it('should setup a single raw route', function(){
    const router = { 
      get: sinon.spy()
    }
    const config =  { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok'), raw: true }
    const res = KoaApi.setupRoute(router, config)
    expect(res).to.be.ok
    expect(router.get).to.have.been.calledWith('/ok', config.fn)
  })

  it('should setup a single validation param route', function(){
    const router = { 
      get: sinon.spy()
    }
    const config = { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok'), validations: [ () => true ] }
    const res = KoaApi.setupRoute(router, config)
    expect(res).to.be.ok
    expect(router.get).to.have.been.calledWith('/ok')
    const vals = router.get.getCall(0)
    expect(vals.args[1]).to.be.a('function')
    expect(vals.args[2].name).to.equal('koaApiHandleApiResponse')
  })

  it('should setup a single validation body route', function(){
    const router = { 
      get: sinon.spy()
    }
    const config =  { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok'), validations: [ () => true ] }
    KoaApi.setupRoute(router, config)
    expect(router.get).to.have.been.calledWith('/ok')
    const vals = router.get.getCall(0)
    expect(vals.args[1]).to.be.a('function')
    expect(vals.args[2].name).to.equal('koaApiHandleApiResponse')
  })

  it('should setup a single validation query route', function(){
    const router = { 
      get: sinon.spy()
    }
    const config =  { path: '/ok', method: 'get', fn: ()=> Promise.resolve('ok'), validations: [ () => true ] }
    const res = KoaApi.setupRoute(router, config)
    expect(res).to.be.ok
    expect(router.get).to.have.been.calledWith('/ok')
    const vals = router.get.getCall(0)
    expect(vals.args[1]).to.be.a('function')
    expect(vals.args[2].name).to.equal('koaApiHandleApiResponse')
  })

  it('should have a pino dummy', function(){
    const log = KoaApi.pinoLikeConsoleLogger()
    expect(log).to.be.ok
    expect(log.fatal('wow')).to.be.undefined
  })

})
