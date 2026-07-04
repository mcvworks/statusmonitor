module.exports = {
  apps: [{
    name: 'statusmonitor',
    script: '.next/standalone/server.js',
    env: {
      NODE_ENV: 'production',
      // nginx (/etc/nginx/sites-enabled/monitor.ducktyped.xyz) proxies the
      // public site to 127.0.0.1:3002. 3000 is the duckTyped API — do not
      // use it. Verified via the Diagnose VPS Routing workflow, 2026-07-04.
      PORT: 3002
    }
  }]
};
