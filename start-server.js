// Bypass Angular CLI version check
process.env.NG_SKIP_VERSION_CHECK = '1';

// Require the Angular CLI
const ng = require('@angular/cli');

// Run the serve command
ng.default({
  cliArgs: ['serve', '--port', '4200', '--proxy-config', 'proxy.conf.json']
});
