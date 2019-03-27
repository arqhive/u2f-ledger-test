import { foreach, splitPath } from './utils';

export default class Apis {
  transport;

  constructor(transport, scrambleKey = 'w0w') {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        'getAddress',
        'signTransaction',
        'signPersonalMessage',
        'getAppConfiguration',
      ],
      scrambleKey,
    );
  }

  getAddress(path, boolDisplay, boolChaincode) {
    let paths = splitPath(path);
    let buffer = new Buffer(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(
        0xe0,
        0x02,
        boolDisplay ? 0x01 : 0x00,
        boolChaincode ? 0x01 : 0x00,
        buffer,
      )
      .then(response => {
        let result = {};
        let publicKeyLength = response[0];
        let addressLength = response[1 + publicKeyLength];
        result.publicKey = response
          .slice(1, 1 + publicKeyLength)
          .toString('hex');
        result.address =
          '0x' +
          response
            .slice(
              1 + publicKeyLength + 1,
              1 + publicKeyLength + 1 + addressLength,
            )
            .toString('ascii');
        if (boolChaincode) {
          result.chainCode = response
            .slice(
              1 + publicKeyLength + 1 + addressLength,
              1 + publicKeyLength + 1 + addressLength + 32,
            )
            .toString('hex');
        }
        return result;
      });
  }

  signTransaction(path, rawTxHex) {
    let paths = splitPath(path);
    let offset = 0;
    let rawTx = new Buffer(rawTxHex, 'hex');
    let toSend = [];
    let response;
    while (offset !== rawTx.length) {
      let maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 : 150;
      let chunkSize =
        offset + maxChunkSize > rawTx.length
          ? rawTx.length - offset
          : maxChunkSize;
      let buffer = new Buffer(
        offset === 0 ? 1 + paths.length * 4 + chunkSize : chunkSize,
      );
      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        rawTx.copy(buffer, 1 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        rawTx.copy(buffer, 0, offset, offset + chunkSize);
      }
      toSend.push(buffer);
      offset += chunkSize;
    }
    return foreach(toSend, (data, i) =>
      this.transport
        .send(0xe0, 0x04, i === 0 ? 0x00 : 0x80, 0x00, data)
        .then(apduResponse => {
          response = apduResponse;
        }),
    ).then(() => {
      const v = response.slice(0, 1).toString('hex');
      const r = response.slice(1, 1 + 32).toString('hex');
      const s = response.slice(1 + 32, 1 + 32 + 32).toString('hex');
      return { v, r, s };
    });
  }

  getAppConfiguration() {
    return this.transport.send(0xe0, 0x06, 0x00, 0x00).then(response => {
      let result = {};
      result.arbitraryDataEnabled = response[0] & 0x01;
      result.version = '' + response[1] + '.' + response[2] + '.' + response[3];
      return result;
    });
  }

  signPersonalMessage(path, messageHex) {
    let paths = splitPath(path);
    let offset = 0;
    let message = new Buffer(messageHex, 'hex');
    let toSend = [];
    let response;
    while (offset !== message.length) {
      let maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 - 4 : 150;
      let chunkSize =
        offset + maxChunkSize > message.length
          ? message.length - offset
          : maxChunkSize;
      let buffer = new Buffer(
        offset === 0 ? 1 + paths.length * 4 + 4 + chunkSize : chunkSize,
      );
      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        buffer.writeUInt32BE(message.length, 1 + 4 * paths.length);
        message.copy(
          buffer,
          1 + 4 * paths.length + 4,
          offset,
          offset + chunkSize,
        );
      } else {
        message.copy(buffer, 0, offset, offset + chunkSize);
      }
      toSend.push(buffer);
      offset += chunkSize;
    }
    return foreach(toSend, (data, i) =>
      this.transport
        .send(0xe0, 0x08, i === 0 ? 0x00 : 0x80, 0x00, data)
        .then(apduResponse => {
          response = apduResponse;
        }),
    ).then(() => {
      const v = response[0];
      const r = response.slice(1, 1 + 32).toString('hex');
      const s = response.slice(1 + 32, 1 + 32 + 32).toString('hex');
      return { v, r, s };
    });
  }
}
