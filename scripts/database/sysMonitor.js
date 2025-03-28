/* global db */

db.sysMonitor.createIndex({created: 1}, {expireAfterSeconds: 604800, background: true});

db.sysMonitor.createIndex({resolved: 1}, {background: true});
