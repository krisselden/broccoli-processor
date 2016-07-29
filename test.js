function impliedPaths(path) {
  var i = 0;
  var s = 0;
  var e = path.length - 1;
  var paths = [];
  while (i < e && (i = path.indexOf("/", i)) !== -1) {
    if (i === 0) {
      s = 1;
    } else {
      paths.push(path.substring(s, i));
    }
    i++;
  }
  return paths;
}

console.log(impliedPaths("/a/b/c.js"));
console.log(impliedPaths("a/b/c.js"));
console.log(impliedPaths("a/b/"));
console.log(impliedPaths("a/b/c"));
console.log(impliedPaths("a/b/c/d/e"));