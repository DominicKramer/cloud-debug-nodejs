
const debug = require('./build/src').start();

async function main() {
  await debug.isReady();
}

main().catch(console.error);
