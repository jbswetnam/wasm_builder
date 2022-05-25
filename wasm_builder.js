/*
MIT License

Copyright (c) 2022 Joseph Swetnam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function (exports) {

const value_types = {
  func: 0x60,
  funcref: 0x70,
  f64: 0x7c,
  f32: 0x7d,
  i64: 0x7e,
  i32: 0x7f
};

function get_value_type (v) {
  return typeof v === "string" ? value_types[v] : v;
}

const external_kinds = {
  func: 0,
  table: 1,
  memory: 2,
  global: 3
};

const op_codes = {
  "if": 0x04,
  "else": 0x05,
  "end": 0x0b,
  call: 0x10,
  call_indirect: 0x11,
  local$get: 0x20,
  local$set: 0x21,
  global$get: 0x23,
  global$set: 0x24,
  i32$const: 0x41,
  f64$const: 0x44,
  i32$lt_s: 0x48,
  i32$lt_u: 0x49,
  f64$lt: 0x63,
  i32$add: 0x6a,
  f64$sub: 0xa1,
  f64$mul: 0xa2
};

const section_specs = {};

function string_literal (a, s) {
  s = (new TextEncoder).encode(s);
  a.push(s.length, ...s);
}

function type_section_entry (t) {
  switch (t.label) {
    case "func": return [
      value_types.func,
      t.params.length,
      ...t.params,
      t.result.length,
      ...t.result
    ];
  }
}

function func_section_entry ({type_idx}, {type_mappings}) {
  return [type_mappings[type_idx]];
}

function import_section_entry (e, {type_mappings}) {
  const out = [];
  for (const s of e.import) string_literal(out, s);
  out.push(external_kinds[e.label]);
  switch (e.label) {
    case "func": out.push(type_mappings[e.type_idx]); break;
    case "global": out.push(e.type, e.mutable); break;
    case "memory": out.push(0, e.initial); break;
    case "table": out.push(e.element, 0, e.initial); break;
  }
  return out;
}

function table_section_entry (e) {
  return [e.element, 0, e.initial]
}

function memory_section_entry (m) {
  if (m.max) return [1, m.initial, m.max];
  return [0, m.initial];
}

function global_section_entry (g) {
  return [get_value_type(g.type), g.mutable, g.value_const, g.value, op_codes.end];
}

function export_section_entry (e) {
  const out = [];
  for (const s of e.export) string_literal(out, s);
  out.push(external_kinds[e.label]);
  switch (e.label) {
    case "func": out.push(e.func_idx); break;
    case "memory": out.push(0); break;
    case "global": out.push(e.glob_idx); break;
  }
  return out;
}

function start_section_entry (e, {names: {funcs}}) {
  let func_idx = e.func_idx;
  if (typeof func_idx === "string") {
    func_idx = funcs[func_idx].func_idx;
  }
  return [func_idx];
}

function elem_section_entry (e, {names: {funcs}}) {
  for (const i in e.funcs) {
    if (typeof e.funcs[i] === "string") {
      e.funcs[i] = funcs[e.funcs[i]].func_idx;
    }
  }
  return [0, op_codes.i32$const, e.offset, op_codes.end, e.funcs.length, ...e.funcs];
}

function code_section_entry (e) {
  const func_body = [0];
  const locals = [];
  for (const l of e.locals) {
    let i = 1;
    while (i < locals.length && locals[i] !== l) i += 2;
    if (i > locals.length) {
      locals.push(1, l);
    } else {
      locals[i - 1]++;
    }
  }
  func_body.push(locals.length / 2, ...locals, ...e.code, op_codes.end);
  func_body[0] = func_body.length - 1;
  return func_body;
}

function data_section_entry (e) {
  const out = [0, op_codes.i32$const, e.offset, op_codes.end];
  string_literal(out, e.content);
  return out;
}

function add_type_section_entry (mod, entry, data) {
  const type_section = mod.sections.type.entries;
  let i;
  for (i = 0; i < type_section.length; i++) {
    const e = type_section[i];
    let same = true;
    let j = 0;
    while (j < e.length && same) {
      same = e[j] === entry[j];
      j++;
    }
    same = same && (j === entry.length);
    if (same) break;
  }
  mod.type_mappings[data.type_idx] = i;
  if (i === type_section.length) type_section.push(entry);
  return i;
}

function add_section_entry (mod, section, data) {
  const {label} = mod.sections[section];
  const spec = section_specs[label];
  const entry = spec.entry_builder(data, mod);
  if (!entry) return;
  return spec.add_entry(mod, entry, data);
}

function entry_builder (spec, mod) {
  const data = { label: spec.label };
  const out = {
    data: data,
    emit_code: function () {
      const section = this.data.import ? "import" : spec.label;
      add_section_entry(mod, section, this.data);
      if (this.data.export) add_section_entry(mod, "export", this.data);
    }
  };
  if (spec.init) spec.init.call(out, data, mod);
  if (spec.name) {
    out.name = function (nm) {
      mod.names[spec.name][nm] = this.data;
      return this;
    };
  }
  if (!spec.setters) spec.setters = {};
  if (spec.import_export) {
    spec.setters.import = (...args) => args;
    spec.setters.export = (...args) => args;
  }
  for (const prop in spec.setters) {
    out[prop] = function (...args) {
      this.data[prop] = spec.setters[prop].apply(this.data, args);
      return this;
    }
  }
  for (const prop in spec.methods) {
    out[prop] = spec.methods[prop].bind(out, data, mod);
  }
  return out;
}

function def_section (spec) {
  if (!spec.add_entry) {
    spec.add_entry = (mod, e) => mod.sections[spec.label].entries.push(e);
  }
  section_specs[spec.label] = spec;
}

def_section({
  label: "type",
  code: 1,
  multi_entry: true,
  entry_builder: type_section_entry,
  add_entry: add_type_section_entry
});

def_section({
  label: "import",
  code: 2,
  multi_entry: true,
  entry_builder: import_section_entry
});

function set_local (coll) {
  return function (data, mod, nm, tp) {
    if (tp) {
      data.local_names[nm] = data.params.length + data.locals.length;
    } else {
      tp = nm;
    }
    if (typeof tp === "string") tp = value_types[tp];
    data[coll].push(tp);
    return this;
  };
}

function func_body (func, {names}) {
  const out = {};
  for (const op in op_codes) {
    let get_name;
    out[op] = function (...args) {
      switch (op) {
        case "local$get":
        case "local$set":
          get_name = nm => func.local_names[nm];
        break;
        case "call":
          get_name = nm => names.funcs[nm].func_idx;
        break;
        case "call_indirect":
          args.push(0);
        break;
        case "if":
          get_name = get_value_type;
        break;
      }
      if (get_name && typeof args[0] === "string") {
        args[0] = get_name(args[0]);
      }
      func.code.push(op_codes[op], ...args);
      return this;
    };
  }
  return out;
}

function emit_func (data, mod) {
  add_section_entry(mod, "type", data);
  if (data.export) {
    add_section_entry(mod, "export", data);
  }
  if (data.import) {
    add_section_entry(mod, "import", data);
  }
  if (data.code.length) {
    add_section_entry(mod, "func", data);
    add_section_entry(mod, "code", data);
  }
}

def_section({
  label: "func",
  code: 3,
  import_export: true,
  multi_entry: true,
  entry_builder: func_section_entry,
  name: "funcs",
  init: function (data, mod) {
    data.local_names = {};
    data.params = [];
    data.locals = [];
    data.result = [];
    data.code = [];
    data.func_idx = mod.accum.func_idx++;
    data.type_idx = mod.accum.type_idx++;
    data.body = func_body(data, mod);
  },
  methods: {
    param: set_local("params"),
    local: set_local("locals"),
    result: function (data, mod, r) {
      if (typeof r === "string") r = value_types[r];
      data.result.push(r);
      return this;
    },
    body: data => data.body,
    // overwrites default:
    emit_code: emit_func
  }
});

def_section({
  label: "table",
  code: 4,
  import_export: true,
  multi_entry: true,
  entry_builder: table_section_entry,
  setters: {
    initial: x => x,
    element: get_value_type
  }
});

def_section({
  label: "memory",
  code: 5,
  multi_entry: true,
  import_export: true,
  entry_builder: memory_section_entry,
  init: function (data) {
    data.initial = 1;
    data.max = 1;
  },
  setters: {
    initial: x => x,
    max: x => x
  }
});

def_section({
  label: "global",
  code: 6,
  multi_entry: true,
  import_export: true,
  entry_builder: global_section_entry,
  init: function (data, mod) {
    data.glob_idx = mod.accum.glob_idx++;
  },
  setters: {
    type: get_value_type,
  mutable: m => m ? 1 : 0
  },
  methods: {
    i32$const: function (data, mod, x) {
      data.value_const = op_codes.i32$const;
      data.value = x;
      return this;
    }
  }
});

def_section({
  label: "export",
  code: 7,
  multi_entry: true,
  entry_builder: export_section_entry
});

def_section({
  label: "start",
  code: 8,
  multi_entry: false,
  setters: {
    func_idx: x => x
  },
  entry_builder: start_section_entry
});

def_section({
  label: "elem",
  code: 9,
  multi_entry: true,
  entry_builder: elem_section_entry,
  setters: {
    offset: x => x,
    funcs: (...args) => args
  }
});

def_section({
  label: "code",
  code: 10,
  multi_entry: true,
  entry_builder: code_section_entry
});

def_section({
  label: "data",
  code: 11,
  multi_entry: true,
  entry_builder: data_section_entry,
  setters: {
    offset: x => x,
    content: x => x
  }
});

function section_entry ({entries}, {code, multi_entry}) {
  if (entries.length) {
    const sec = [code, 0];
    if (multi_entry) sec.push(entries.length);
    for (const e of entries) sec.push(...e);
    sec[1] = sec.length - 2;
    return sec;
  }
  return [];
}

function wasm_module () {
  const mod = {
    names: {
      funcs: {},
    },
    type_mappings: [],
    accum: {
      type_idx: 0,
      func_idx: 0,
      glob_idx: 0
    },
    sections: {},
    entries: []
  };
  const out = {
    emit_code: function () {
      for (const e of mod.entries) e.emit_code();
      const code = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];
      for (const label in section_specs) {
        const section_spec = section_specs[label];
        const entry = section_entry(mod.sections[label], section_spec);
        code.push(...entry);
      }
      return code;
    },
    instantiate: function (imp) {
      const buf = Uint8Array.from(this.emit_code());
      return WebAssembly.instantiate(buf, imp);
    }
  };
  for (const label in section_specs) {
    out[label] = function () {
      const entry = entry_builder(section_specs[label], mod);
      mod.entries.push(entry);
      return entry;
    };
    mod.sections[label] = { label: label, entries: [] };
  }
  return out;
}

export const WASMBuilder = {
  module: wasm_module
};

})(
  typeof module === "undefined" ? window : module.exports
);
