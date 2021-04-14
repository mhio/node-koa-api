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
    class TestApiRo extends KoaApiHandler {
      static getMe(){ return true }
    }
    expect(TestApiRo.routeConfig()).to.containSubset([])
    const first = TestApiRo.routeConfig()[0]
    expect(first).to.containSubset({ method: 'get', path: '/me' }) 
    expect(first['fn']).to.be.a('function') // can't test functions in arrays in subset
  })

  it('should return a routeConfig array with custom path_', function(){
    class TestApiRoutes extends KoaApiHandler {
      static path_getMe = 'you'
      static getMe(){ return true }
    }
    expect(TestApiRoutes.routeConfig()).to.containSubset([])
    const first = TestApiRoutes.routeConfig()[0]
    expect(first).to.containSubset({ method: 'get', path: '/you' }) 
  })

  it('should return a routeConfig array with sub router', function(){
    class TestApiSubRoutes extends KoaApiHandler {
      static async getMe() { return true }
      static async postYou() { return true }
    }
    class TestApiParentRoutes extends KoaApiHandler {
      static routes_Me = TestApiSubRoutes
    }
    expect(TestApiParentRoutes.routeConfig()).to.containSubset([{
        path: '/me',
        routes: v => v.name === 'TestApiSubRoutes', // dodge?
    }])
  })

  it('should throw a nice error when a user messes up a property name', function(){
    class TestApiPost extends KoaApiHandler {
      static post_thing = 'you'
    }
    const fn = ()=> TestApiPost.routeConfig()
    expect(fn).to.throw('not a function')
  })

})
