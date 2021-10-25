@mhio/koa-api change log
--------------------

### 0.6.0

Add `raw` option to route handler

```javascript
{
  method: 'get',
  handler: (ctx) => ctx.body = 'rawr',
  raw: true,
}

```

Validation for `body`, `query` and `params` via 

```javascript
{
  method: 'get',
  handler: (ctx) => ctx.body = 'rawr',
  validations: [
    
  ],
}

```