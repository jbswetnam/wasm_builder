// uncomment and modify path as needed in NodeJS:
// const { WASMBuilder } = require("../wasm_builder.js");
// you will also need the utils file in NodeJS:
// const { test_mod, assert } = require("./testing_utils.js")

const mod1 = WASMBuilder.module();

test_mod(mod1, "empty module", function (mod) {
  assert(true, "empty module compiles");
});

mod1.func();

test_mod(mod2, "empty function", function (mod) {
  assert(true, "empty function compiles");
});
