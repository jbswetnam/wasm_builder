(function (exports) {
  let failed = [], total = 0, mods = 0;
  
  exports.assert = function (a, b, c) {
    let passed = a, msg = b;
    if (c) {
      passed = a === b;
      msg = `${msg}: expected ${a}, got ${b}`;
    }
    if (!passed) failed.push(msg);
    total++;
  };
  
  exports.test_mod = function (module, cb, imp) {
    mods++;
    module.instantiate(imp || {}).then(function (mod) {
      cb(mod.instance.exports);
      mods--;
      if (!mods) {
        console.log(`${failed.length} of ${total} tests failed`);
        for (const f of failed) console.log(`Failed: ${f}`);
      }
    });
  };
})(
  typeof module === "undefined" ? window : module.exports
);
