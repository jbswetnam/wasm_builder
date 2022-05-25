// uncomment and modify path as needed in NodeJS:
// const { WASMBuilder } = require("../wasm_builder.js");
// you will also need the utils file in NodeJS:
// const { test_mod, assert } = require("./testing_utils.js")

let mod = WASMBuilder.module();

test_mod(mod, function (mod) {
  assert(mod, "empty module compiles");
});

mod.func();

test_mod(mod, function (mod) {
  assert(mod, "empty function compiles");
});

mod = WASMBuilder.module();

mod.func()
    .param("a", "i32")
    .param("b", "i32")
    .result("i32")
    .export("addTwo")
    .body().local$get("a")
           .local$get("b")
           .i32$add();

test_mod(mod, function (mod) {
  assert(mod.addTwo(2, 3), 5, "simple adding function");
});
