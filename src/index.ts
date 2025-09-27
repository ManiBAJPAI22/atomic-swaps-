#!/usr/bin/env node

// Re-export the CLI
export * from './cli/index';

// If this file is run directly, start the CLI
if (require.main === module) {
  require('./cli/index');
}
