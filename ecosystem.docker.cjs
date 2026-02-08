/* File: ecosystem.docker.cjs */
/**
 * PM2 config for Docker. Used by pm2-runtime in the container.
 * Env is provided by the container (docker-compose / Dockerfile); no .env load.
 */
module.exports = {
  apps: [
    {
      name: "app",
      script: "server.js",
      cwd: "/app",
      interpreter: "node",

      instances: 1,
      exec_mode: "fork",

      max_memory_restart: "768M",
      min_uptime: "10s",

      autorestart: true,
      max_restarts: 15,
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,

      kill_timeout: 8000,
      listen_timeout: 15000,

      watch: false,

      combine_logs: true,
      merge_logs: true,
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      error_file: "/dev/stderr",
      out_file: "/dev/stdout",

      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3222",
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
