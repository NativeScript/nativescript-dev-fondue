Instrumentation profiling for the NativeScript framework

To use the tool first make sure you have everything in source control.
The instrumentation may brake stuff.

Installation:
```
npm install nativescript-dev-fondue
```

Instrument the JavaScript. The following will rewrite the .js files in place without taking backups.
You can remove the `node_modules` folder and reinstall modules from `npm`.
For the `app` folder you may consider `git init`, `git commit`,
and `git reset --hard` after you are done profiling.

To instrument files, at the root of your app use:
```
./node_modules/.bin/globfondue "node_modules/tns-core-modules/**/*.js"
./node_modules/.bin/globfondue "app/**/*.js"
```
Try not to instrument the fondue itself.

In your `app/app.js` add the following require as a first statement:
```
var calltree = require('nativescript-dev-fondue/tracers/calltree');
```

Avoid profiling large calltrees since output is now transfered through the
console output to the host machine and may be slow. To start tracing execute the following in your app (on button tap?):
```
calltree.start();
```
To end the trace and dump the output call:
```
calltree.stop();
```

When you are ready with the installation and have placed the instrumentation start/stop calls run:
```
tns run ios | ./node_modules/.bin/calltreefilter log.js
```
The `calltreefilter` will redirect trace console logs to the logfile.js leaving other logs in the terminal.
Open `logfile.js` with VSCode, you should be able to use codefolding to navigate through calls.

