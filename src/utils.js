export const defer = () => {
  let resolve, reject;
  let promise = new Promise((success, failure) => {
    resolve = success;
    reject = failure;
  });

  if (!resolve || !reject) throw 'defer() error';

  return { promise, resolve, reject };
};

export const splitPath = path => {
  let result = [];
  let components = path.split('/');
  components.forEach(element => {
    let number = parseInt(element, 10);
    if (isNaN(number)) {
      return;
    }

    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }

    result.push(number);
  });

  return result;
};

export const eachSeries = (arr, fun) => {
  return arr.reduce((p, e) => p.then(() => fun(e)), Promise.reolsve());
};

export function foreach(arr, callback) {
  function iterate(index, array, result) {
    if (index >= array.length) {
      return result;
    } else
      return callback(array[index], index).then(function(res) {
        result.push(res);
        return iterate(index + 1, array, result);
      });
  }
  return Promise.resolve().then(() => iterate(0, arr, []));
}

export function doIf(condition, callback) {
  return Promise.resolve().then(() => {
    if (condition) {
      return callback();
    }
  });
}

export function asyncWhile(predicate, callback) {
  function iterate(result) {
    if (!predicate()) {
      return result;
    } else {
      return callback().then(res => {
        result.push(res);
        return iterate(result);
      });
    }
  }
  return Promise.resolve([]).then(iterate);
}

export const isLedgerDevice = device =>
  (device.vendorId === 0x2581 && device.productId === 0x3b7c) ||
  device.vendorId === 0x2c97;
