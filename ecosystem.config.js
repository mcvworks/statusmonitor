module.exports = {
  apps: [{
    name: 'statusmonitor',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
