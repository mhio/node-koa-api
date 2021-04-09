/* global expect */
const { KoaApiHandler } = require('../../src/KoaApiHandler')

describe('test::unit::KoaApiHandler', function(){

  it('should load KoaApiHandler', function(){
    expect( KoaApiHandler ).to.be.ok    
  })

  it('should return a routeConfig', function(){
    expect( KoaApiHandler.routeConfig ).to.be.a('function')
  })
  
  it('should return a routeConfig array', function(){
    class TestApi extends KoaApiHandler {
      static getMe(){ return true }
    }
    expect(TestApi.routeConfig()).to.containSubset([])
    const first = TestApi.routeConfig()[0]
    expect(first).to.containSubset([ 'get', '/me' ]) 
    expect(first[2]).to.be.a('function') // can't test functions in arrays in subset
  })

  it('should return a routeConfig array with custom route_', function(){
    class TestApi extends KoaApiHandler {
      static route_getMe = 'you'
      static getMe(){ return true }
    }
    expect(TestApi.routeConfig()).to.containSubset([])
    const first = TestApi.routeConfig()[0]
    expect(first).to.containSubset([ 'get', '/you' ]) 
  })

  it('should return a routeConfig array with custom path_', function(){
    class TestApi extends KoaApiHandler {
      static path_getMe = 'you'
      static getMe(){ return true }
    }
    expect(TestApi.routeConfig()).to.containSubset([])
    const first = TestApi.routeConfig()[0]
    expect(first).to.containSubset([ 'get', '/you' ]) 
  })

  it('should throw a nice error when a user messes up a property name', function(){
    class TestApi extends KoaApiHandler {
      static post_thing = 'you'
    }
    const fn = ()=> TestApi.routeConfig()
    expect(fn).to.throw('not a function')
  })

})
