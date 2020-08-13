/* global expect */

const {
  KoaApi, KoaApiException,
  // Dependencies
  KoaApiHandle,
  KoaApiHandleException,
  Message,
  MessageData,
  MessageError,
  ApiResponse,
} = require('../../')

describe('test::built::module', function(){

  it('should load the KoaApi', function(){
    expect( KoaApi, 'KoaApi module' ).to.be.ok
  })

  it('should load KoaApiException', function(){
    expect( KoaApiException, 'KoaApiException module' ).to.be.ok
  })
  it('should load KoaApiHandle', function(){
    expect( KoaApiHandle, 'KoaApiHandle module' ).to.be.ok
  })
  it('should load KoaApiHandleException', function(){
    expect( KoaApiHandleException, 'KoaApiHandleException module' ).to.be.ok
  })
  it('should load Message', function(){
    expect( Message, 'Message module' ).to.be.ok
  })
  it('should load MessageData', function(){
    expect( MessageData, 'MessageData module' ).to.be.ok
  })
  it('should load MessageError', function(){
    expect( MessageError, 'MessageError module' ).to.be.ok
  })
  it('should load ApiResponse', function(){
    expect( ApiResponse, 'ApiResponse module' ).to.be.ok
  })
})