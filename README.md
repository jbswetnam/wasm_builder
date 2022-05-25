# wasm_builder

Build WASM modules programmatically in JavaScript

## Quick Start

The easiest way is to download wasm_builder.js into your project:
```
wget https://raw.githubusercontent.com/jbswetnam/wasm_builder/main/wasm_builder.js
```
Include it in a NodeJs file:
```js
const { WASMBuilder } = require("./path/to/wasm_builder.js");
const my_mod = WASMBuilder.module();
```
Include it in an HTML file:
```html
<script src="path/to/wasm_builder.js"></script>
<script>
  const my_mod = WASMBuilder.module();
</script>
```

## Hello World

```js
// uncomment if NodeJS:
// const { WASMBuilder } = require("./path/to/wasm_builder.js");

const my_mod = WASMBuilder.module();

my_mod.memory().minimum(1).import("external", "mem");
my_mod.data().offset(0).content("Hello World!");
my_mod.func()
      .name("log")
      .param("i32")
      .param("i32")
      .import("external", "log");
my_mod.func()
      .export("say_hello")
      .body().i32$const(0)
             .i32$const(12)
             .call("log");
             
const mem = new WebAssembly.Memory({ initial: 1 });

function log_string (start, length) {
  const bytes = new Uint8Array(mem.buffer, start, length);
  const string = new TextDecoder("utf8").decode(bytes);
  console.log(string);
}

my_mod.instantiate({
  external: { log: log_string, mem: mem }
}).then(function (mod) {
  mod.instance.exports.say_hello();
});
```

## Usage

To do...
             
