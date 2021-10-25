class DetailsError extends Error {
  constructor(message, details){
    super(message)
    this.details = details
    this.name = this.constructor.name
  }
}

class ValidationError extends DetailsError {
  constructor(message, details){
    super(message, details)
    this.status = 400
  }
}

const error_class = ValidationError
// export function setValidationError(value){
//   let test_err
//   try {
//     test_err = new value('message', { something: true })
//   }
//   catch (error) {
//     throw new Error('New validation error must be contsructed from a message and details object')
//   }
//   if (!(test_err instanceof Error)) {
//     throw new Error('New validation error must be an Error constructor')
//   }
//   error_class = value
// }

const hasOwnProperty = Object.prototype.hasOwnProperty
function _has(object, key) {
  return object ? hasOwnProperty.call(object, key) : false
}

function generateBodyValidationMiddleware(route_path, fields){
  return async function validateKoaBody(ctx, next) {
    if (!ctx.request.body) {
      throw new error_class('No body in request', { path: route_path, request: ctx.request })
    }
    for (const [ field, validation ] of fields) {
      if (!_has(ctx.request.body, field)) {
        throw new error_class(`No field "${field}" in body of request`, { field, path: route_path, request: ctx.request })
      }
      if (!validation(ctx.request.body[field])) {
        throw new error_class(`Field ${field} is not valid`, {
          field,
          value: ctx.request.body[field],
          path: route_path
        })
      }
    }
    await next()
  }
}

function generateRouteParamsValidationMiddleware(route_path, params){
  return async function validateKoaRouteParams(ctx, next) {
    if (!ctx.request.params) {
      throw new error_class('No URL parameters in request', { path: route_path })
    }
    for (const [ param_name, validation ] of params) {
      if (!_has(ctx.request.params, param_name)) {
        throw new error_class(`No parameter ${param_name} in url`, { field: param_name, path: route_path })
      }
      if (!validation(ctx.request.params[param_name])) {
        throw new error_class(`URL parameter "${param_name}" is not valid`, {
          field: param_name,
          value: ctx.request.params[param_name],
          path: route_path
        })
      }
    }
    await next()
  }
}

function generateQueryStringValidationMiddleware(route_path, query_strings){
  return async function validateKoaQueryStrings(ctx, next) {
    if (!ctx.request.query) {
      throw new error_class('No query string in request', { path: route_path })
    }
    for (const [ query_param, validation ] of query_strings) {
      if (!_has(ctx.request.query, query_param)) {
        throw new error_class(`No query string param "${query_param}" in url`, { field: query_param, path: route_path })
      }
      if (!validation(ctx.request.query[query_param])) {
        throw new error_class(`URL query string param "${query_param}" is not valid`, {
          field: query_param,
          value: ctx.request.query[query_param],
          path: route_path
        })
      } 
    } 
    await next()
  }
}

module.exports = {
  _has,
  generateQueryStringValidationMiddleware,
  generateRouteParamsValidationMiddleware,
  generateBodyValidationMiddleware,
  ValidationError,
  DetailsError,
}
