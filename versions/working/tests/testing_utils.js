(function (exports) {
  const failed = [], total = 0;
  
  exports.assert = function (x, msg) {
    if (!x) failed.push(msg);
    total++;
  };
  
  exports.test_mod = function (module, msg, cb, imp) {
    module.instantiate(imp || {}).then(function (mod) {
      console.log(`running tests: ${msg}`);
      cb(mod);
      console.log(`${failed.length} of ${total} tests failed`);
      for (const f of failed) console.log(`Failed: ${f}`);
    });
  };
})(
  typeof module === "undefined" ? window : module.exports
);
