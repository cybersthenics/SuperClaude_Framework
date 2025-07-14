#!/usr/bin/env node

import { RouterServer } from './core/RouterServer.js';
import { productionConfig, developmentConfig, testConfig } from './config/production.js';

async function main(): Promise<void> {
  const environment = process.env.NODE_ENV || 'development';
  
  let config;
  switch (environment) {
    case 'production':
      config = productionConfig;
      break;
    case 'test':
      config = testConfig;
      break;
    default:
      config = developmentConfig;
  }

  const router = new RouterServer(config);

  const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    try {
      await router.stop();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  try {
    await router.start();
  } catch (error) {
    console.error('Failed to start router:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}