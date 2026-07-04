module.exports = {
  apps: [{
    name: 'statusmonitor',
    script: '.next/standalone/server.js',
    env: {
      NODE_ENV: 'production',
      // 3000 is owned by another app on the VPS (EADDRINUSE on 2026-07-04
      // deploy). The real nginx upstream port for monitor.ducktyped.xyz is
      // still being determined — see .github/workflows/diagnose.yml
      PORT: 3001
    }
  }]
};
