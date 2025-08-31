const { performance } = require('perf_hooks');

const players = 8;
const rounds = 1000;
const updates = 100;

function legacy(data) {
  let html = "";
  for (let i = 0; i < data.length; i++) {
    let tds = "";
    for (let j = 0; j < data[i].length; j++) {
      tds += `<td><input value="${data[i][j]}"></td>`;
    }
    html += `<tr>${tds}</tr>`;
  }
  return { innerHTML: html };
}

function legacyBenchmark() {
  const data = Array.from({ length: rounds }, () =>
    Array.from({ length: players }, () => 0)
  );
  let tbody = legacy(data);
  const start = performance.now();
  for (let u = 0; u < updates; u++) {
    data[500][4] = u;
    tbody = legacy(data);
  }
  return performance.now() - start;
}

const document = {
  createElement: (tag) => ({
    tag,
    children: [],
    dataset: {},
    appendChild(child) {
      this.children.push(child);
    },
  }),
  createDocumentFragment: () => ({
    children: [],
    appendChild(child) {
      this.children.push(child);
    },
  }),
};

function optimized(tbody, data) {
  for (let i = 0; i < data.length; i++) {
    let row = tbody[i];
    if (!row) {
      row = [];
      const frag = document.createDocumentFragment();
      for (let j = 0; j < data[i].length; j++) {
        const input = document.createElement("input");
        input.value = data[i][j];
        const td = document.createElement("td");
        td.children = [input];
        frag.appendChild(td);
        row.push(td);
      }
      tbody[i] = row;
    } else {
      for (let j = 0; j < data[i].length; j++) {
        if (!row[j]) {
          const input = document.createElement("input");
          input.value = data[i][j];
          row[j] = { children: [input] };
        } else {
          row[j].children[0].value = data[i][j];
        }
      }
      row.length = data[i].length;
    }
  }
  tbody.length = data.length;
  return tbody;
}

function optimizedBenchmark() {
  const data = Array.from({ length: rounds }, () =>
    Array.from({ length: players }, () => 0)
  );
  const tbody = [];
  optimized(tbody, data);
  const start = performance.now();
  for (let u = 0; u < updates; u++) {
    data[500][4] = u;
    optimized(tbody, data);
  }
  return performance.now() - start;
}

console.log("legacy", legacyBenchmark().toFixed(3), "ms");
console.log("optimized", optimizedBenchmark().toFixed(3), "ms");
