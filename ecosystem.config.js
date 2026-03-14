module.exports = {
  apps: [{
    name: 'statusmonitor',
    script: '.next/standalone/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
