export class DetailsError extends Error {
  constructor(message, details){
    super(message)
    this.details = details
  }
}

export class ValidationError extends DetailsError {}

let error_class = ValidationError

export function setValidationError(value){
  let test_err
  try {
    test_err = new value('message', { something: true })
  }
  catch (error) {
    throw new Error('New validation error must be contsructed from a message and details object')
  }
  if (! test_err instanceof Error) {
    throw new Error('New validation error must be an Error constructor')
  }
  error_class = value
}

export function generateBodyValidationMiddleware(route_path, fields){
  return async function validateKoaBody(ctx, next) {
    if (!ctx.body) {
      throw new error_class('No body in request', { path: route_path })
    }
    for (const [ field, validation ] of fields) {
      if (!Object.hasOwn(ctx.body, field)) {
        throw new error_class(`No ${field} in request`, { field, path: route_path })
      }
      if (!validation(ctx.body[field])) {
        throw new error_class(`Field ${field} is not valid`, {
          field,
          value: ctx.params[field],
          path: route_path
        })
      }
    }
    await next()
  }
}

export function generateRouteParamsValidationMiddleware(route_path, params){
  return async function validateKoaRouteParams(ctx, next) {
    if (!ctx.params) {
      throw new error_class('No URL parameters in request', { path: route_path })
    }
    for (const [ param_name, validation ] of params) {
      if (!Object.hasOwn(ctx.params, param_name)) {
        throw new error_class(`No parameter ${param_name} in url`, { field: param_name, path: route_path })
      }
      if (!validation(ctx.params[param_name])) {
        throw new error_class(`URL parameter "${param_name}" is not valid`, {
          field: param_name,
          value: ctx.params[param_name],
          path: route_path
        })
      }
    }
    await next()
  }
}

export function generateQueryStringValidationMiddleware(route_path, query_strings){
  return async function validateKoaQueryStrings(ctx, next) {
    if (!ctx.query) {
      throw new error_class('No query string in request', { path: route_path })
    }
    for (const [ query_param, validation ] of query_strings) {
      if (!Object.hasOwn(ctx.query, query_param)) {
        throw new error_class(`No query string param "${query_param}" in url`, { field: query_param, path: route_path })
      }
      if (!validation(ctx.params[query_param])) {
        throw new error_class(`URL query string param "${query_param}" is not valid`, {
          field: query_param,
          value: ctx.params[query_param],
          path: route_path
        })
      } 
    } 
    await next()
  }
}
