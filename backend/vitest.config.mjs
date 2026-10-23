import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false, // both test files share one database, so run them one after another
    testTimeout: 20000,
    hookTimeout: 60000,
    env: {
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://localhost:27017/pmdb_test", // never your dev database
      JWT_SECRET: "test-secret",
      CLIENT_URL: "http://localhost:3000",
    },
  },
});
