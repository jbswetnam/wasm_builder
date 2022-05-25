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
See the [demo folder](./demo) for a full HTML example. You can view the demo live [here](https://jbswetnam.github.io/wasm_builder/demo/demo.html).

## Usage

To do...
