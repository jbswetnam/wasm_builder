# wasm_builder

Build WASM modules programmatically in JavaScript

## Quick Start

The easiest way is to download the latest stable version of wasm_builder.js into your project:
```
wget https://raw.githubusercontent.com/jbswetnam/wasm_builder/main/versions/latest/wasm_builder.js
```
Then include it in a NodeJs file:
```js
const { WASMBuilder } = require("./path/to/wasm_builder.js");
const my_mod = WASMBuilder.module();
```
Or an HTML file:
```html
<script src="path/to/wasm_builder.js"></script>
<script>
  const my_mod = WASMBuilder.module();
</script>
```
See the [demo folder](versions/latest/demo) for a full HTML example. You can view the demo live [here](https://jbswetnam.github.io/wasm_builder/versions/latest/demo/demo.html).

## Usage

To do...
