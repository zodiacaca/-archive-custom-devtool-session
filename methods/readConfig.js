
module.exports = function readConfig(fs, dir) {
  const raw = fs.readFileSync(dir);
  const cooked = JSON.parse(raw);

  return cooked.configurations[0];
}
