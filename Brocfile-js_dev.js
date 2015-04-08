var pickFiles = require('broccoli-static-compiler');

var Funnel = require('broccoli-funnel');
var flatten = require('broccoli-flatten');
var mergeTrees = require('broccoli-merge-trees');
var stew = require('broccoli-stew');
var TraceurCompiler = require('./tools/broccoli/traceur');
var replace = require('broccoli-replace');
var htmlReplace = require('./tools/broccoli/html-replace');
var path = require('path');

var modulesTree = new Funnel('modules', {include: ['**/**'], destDir: '/'});

// First, use Traceur to transpile original sources to ES6
var es6DevTree = new TraceurCompiler(modulesTree, '.es6', {
  sourceMaps: true,
  annotations: true,      // parse annotations
  types: true,            // parse types
  script: false,          // parse as a module
  memberVariables: true,  // parse class fields
  modules: 'instantiate',
  typeAssertionModule: 'rtts_assert/rtts_assert',
  typeAssertions: true,
  outputLanguage: 'es6'
});
es6DevTree = stew.rename(es6DevTree, function(relativePath) {
  return relativePath.replace(/\.(js|es6)\.map$/, '.map').replace(/\.js$/, '.es6');
});

// Call Traceur again to lower the ES6 build tree to ES5
var es5DevTree = new TraceurCompiler(es6DevTree, '.js', {modules: 'instantiate', sourceMaps: true});
es5DevTree = stew.rename(es5DevTree, '.es6.map', '.js.map');

var vendorScriptsTree = flatten(new Funnel('.', {include: [
  'node_modules/es6-module-loader/dist/es6-module-loader-sans-promises.src.js',
  'node_modules/zone.js/zone.js',
  'node_modules/zone.js/long-stack-trace-zone.js',
  'node_modules/systemjs/dist/system.src.js',
  'node_modules/systemjs/lib/extension-register.js',
  'node_modules/systemjs/lib/extension-cjs.js',
  'node_modules/rx/dist/rx.all.js',
  'tools/build/snippets/runtime_paths.js',
  path.relative(__dirname, TraceurCompiler.RUNTIME_PATH)
]}));

var servingTrees = [];
function copyVendorScriptsTo(destDir) {
  servingTrees.push(pickFiles(vendorScriptsTree, {srcDir: '/', destDir: destDir}));
  if (destDir.indexOf('benchmarks') > -1) {
    servingTrees.push(pickFiles(flatten(new Funnel('.', {include: [
      'tools/build/snippets/url_params_to_form.js'
    ]})), {srcDir: '/', destDir: destDir}));
  }
  if (destDir.indexOf('benchmarks_external') > -1) {
    servingTrees.push(pickFiles(flatten(new Funnel('.', {include: [
      'node_modules/angular/angular.js'
    ]})), {srcDir: '/', destDir: destDir}));
  }
}
// TODO(broccoli): are these needed here, if not loaded by a script tag??
copyVendorScriptsTo('benchmarks/src');
copyVendorScriptsTo('benchmarks_external/src');
copyVendorScriptsTo('examples/src/benchpress');

var htmlTree = new Funnel(modulesTree, {include: ['*/src/**/*.html'], destDir: '/'});
htmlTree = replace(htmlTree, {
  files: ['examples*/**'],
  patterns: [
    { match: /\$SCRIPTS\$/, replacement: htmlReplace('SCRIPTS')}
  ],
  replaceWithPath: function(relativePath, result) {
    copyVendorScriptsTo(path.dirname(relativePath));
    return result.replace('@@FILENAME_NO_EXT', relativePath.replace(/\.\w+$/, ''));
  }
});
htmlTree = replace(htmlTree, {
  files: ['benchmarks/**'],
  patterns: [
    { match: /\$SCRIPTS\$/, replacement: '<script src="url_params_to_form.js" type="text/javascript"></script>\n' + htmlReplace('SCRIPTS')}
  ],
  replaceWithPath: function(relativePath, result) {
    copyVendorScriptsTo(path.dirname(relativePath));
    return result.replace('@@FILENAME_NO_EXT', relativePath.replace(/\.\w+$/, ''));
  }
});
htmlTree = replace(htmlTree, {
  files: ['benchmarks_external/**'],
  patterns: [
    { match: /\$SCRIPTS\$/, replacement: '<script src="angular.js" type="text/javascript"></script>\n<script src="url_params_to_form.js" type="text/javascript"></script>\n' + htmlReplace('SCRIPTS')}
  ],
  replaceWithPath: function(relativePath, result) {
    copyVendorScriptsTo(path.dirname(relativePath));
    return result.replace('@@FILENAME_NO_EXT', relativePath.replace(/\.\w+$/, ''));
  }
});
var scripts = mergeTrees(servingTrees, {overwrite:true});
var polymer = stew.mv(
  flatten(new Funnel('.', {include: ['bower_components/polymer/lib/polymer.html']})),
  'benchmarks_external/src/tree/polymer');
htmlTree = mergeTrees([htmlTree, scripts, polymer]);

es5DevTree = mergeTrees([es5DevTree, htmlTree]);

module.exports = mergeTrees([stew.mv(es6DevTree, 'js/dev/es6'), stew.mv(es5DevTree, 'js/dev/es5')]);
