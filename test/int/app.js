/* global expect */
const Koa = require('koa')

const { KoaApi, KoaApiHandler } = require('../../')
const { Taxios } = require('@mhio/taxios')

describe('test::int::app', function(){

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

  it('should create a KoaApi with object config and respond', async function(){
    class TestHandler extends KoaApiHandler {
      static async getOk(ctx){ return 'ok' }
    }
    new KoaApi({ routes: [TestHandler], app, logger, })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('ok')
    expect(logger.logs).to.have.lengthOf(1)
    expect(logger.logs[0]).to.containSubset(['info'])
  })

  it('should create a KoaApi with sub router config and respond', async function(){
    class SubHandler extends KoaApiHandler {
      static async getOkWoo(){ return 'okWoo' }
    }
    class TestHandler extends KoaApiHandler {
      static async getOk(ctx){ return 'ok' }
      static routes_Sub = [SubHandler]
    }
    new KoaApi({ routes: [TestHandler], app, logger, })
    let res = await request.get('/ok')
    expect( res.status ).to.equal(200)
    expect( res.data ).to.have.property('data').and.equal('ok')
    expect(logger.logs).to.have.lengthOf(1)
    expect(logger.logs[0]).to.containSubset(['info'])
    let res2 = await request.get('/sub/ok-woo')
    expect( res2.status ).to.equal(200)
    expect( res2.data ).to.have.property('data').and.equal('okWoo')
  })

})
