# Special services methods used in */system* route

In order to use these methods, the service needs to be registered using the tbxlibs.services.systemService

```js
systemService.register(serviceInstance, 'ServiceName');
```

See TestService and ExternalTestService for examples

## runMonitorStatus()
Used to check business logic. Add this method for monitoring whit : /system/monitor

Service response:

```json
{
  "ok": true,
  "name": "ServiceName",
  "status": "green",
  "info": {
    ...
  },
  "error": null
}
```

## healthCheck()
Used to check services status. Add this method for monitoring whit : /system/fullcheck

Service response:
```json
{
  "ok": true,
  "name": "ServiceName",
  "info": {
    ...
  },
  "error": null
}
```

## dbCheck()
Used to check DB status and connections. Add this method for monitoring whit : /system/check

Service response:
```json
{
  "ok": true,
  "name": "ServiceName",
  "error": null
}
```
