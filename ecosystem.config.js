module.exports = {
  apps: [{
    name: 'statusmonitor',
    script: '.next/standalone/server.js',
    env: {
      NODE_ENV: 'production',
      // MUST match the proxy_pass port in nginx/monitor.conf — a mismatch
      // means deploys pass their health check but never receive traffic
      PORT: 3000
    }
  }]
};
