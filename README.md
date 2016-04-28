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
./node_modules/.bin/nsfondue "node_modules/tns-core-modules/**/*.js"
./node_modules/.bin/nsfondue "app/**/*.js"
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

In the log.js you should see traces such as:
```
// } missing start time for: Observable.notify node_modules/tns-core-modules/data/observable/observable.js:138:34~158:5
// } missing start time for: Observable._emit node_modules/tns-core-modules/data/observable/observable.js:170:33~176:5
// } missing start time for: ActionItem._raiseTap node_modules/tns-core-modules/ui/action-bar/action-bar-common.js:317:37~319:5
// } missing start time for: TapBarItemHandlerImpl.tap node_modules/tns-core-modules/ui/action-bar/action-bar.ios.js:229:42~234:5
// offset: 787066328.2049471
DataSource.tableViewCellForRowAtIndexPath() { // node_modules/tns-core-modules/ui/list-view/list-view.ios.js:58:58~72:5
  // start:    0ms
  ListView._prepareCell() { // node_modules/tns-core-modules/ui/list-view/list-view.ios.js:265:38~300:5
    // start:    0.08081090450286865ms
    get view() { // node_modules/tns-core-modules/ui/list-view/list-view.ios.js:31:13~33:9
      // start:    0.08956897258758545ms
      // end:      0.09389388561248779ms
    } // duration: 0.004324913024902344ms
    notifyForItemAtIndex() { // node_modules/tns-core-modules/ui/list-view/list-view.ios.js:39:0~43:1
      // start:    0.10458683967590332ms
      Observable.notify() { // node_modules/tns-core-modules/data/observable/observable.js:138:34~158:5
        // start:    0.1276949644088745ms
        Observable._getEventList() { // node_modules/tns-core-modules/data/observable/observable.js:177:41~187:5
          // start:    0.13662993907928467ms
          // end:      0.1387479305267334ms
        } // duration: 0.0021179914474487305ms
        // end:      0.13974297046661377ms
      } // duration: 0.012048006057739258ms
      // end:      0.14091193675994873ms
    } // duration: 0.03632509708404541ms
```
