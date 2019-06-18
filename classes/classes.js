
module.exports = {
  DomainCodes: class {
    constructor() {
      this.Target = 100;
      this.Page = 200;
      this.DOM = 300;
      this.CSS = 400;
    }
  },
  Results: class {
    constructor() {}

    push(operate, result) {
      if (this[operate] == undefined) {
        this[operate] = [];
      }
      this[operate].push(result);
    }
  },
}
