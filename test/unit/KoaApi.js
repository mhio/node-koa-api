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

})
