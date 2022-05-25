// modify path as needed in NodeJS:
const { WASMBuilder } = typeof window === "undefined" ? require("../wasm_builder.js") : window;
// you will also need to download the utils file in NodeJS:
const { test_mod, assert } = typeof window === "undefined" ? require("./testing_utils.js") : window;

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
   .export("add_two")
   .body().local$get("a")
          .local$get("b")
          .i32$add();

mod.func()
   .name("return_const")
   .result("i32")
   .body().i32$const(4);

mod.func()
   .export("call_functions")
   .result("i32")
   .body().call("return_const")
          .i32$const(5)
          .call(0);

test_mod(mod, function (mod) {
  assert(mod.add_two(2, 3), 5, "simple adding function");
  assert(mod.call_functions(), 9, "call functions by name and index");
});
