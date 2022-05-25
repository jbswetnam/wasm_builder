(function (exports) {
  let failed = [], total = 0;
  
  exports.assert = function (x, msg) {
    if (!x) failed.push(msg);
    total++;
  };
  
  exports.test_mod = function (module, msg, cb, imp) {
    module.instantiate(imp || {}).then(function (mod) {
      try {
        cb(mod);
        console.log(`${msg}: ${failed.length} of ${total} tests failed`);
        for (const f of failed) console.log(`Failed: ${f}`);
      } catch (e) {
        console.log(`${msg} failed: ${e}`);
      }
    });
  };
})(
  typeof module === "undefined" ? window : module.exports
);
