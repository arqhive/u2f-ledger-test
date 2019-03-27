import React, { Component } from 'react';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import Apis from './apis';
import App3 from 'app3js';
import { isNull } from 'util';

const labelStyle = {
  display: 'block',
};

const inputStyle = {
  boxSizing: 'border-box',
  width: '30%',
  padding: 10,
  marginTop: 20,
  border: '1px solid #e6c6c6',
};

export default class App extends Component {
  state = {
    address: '',
    publicKey: '',
    error: '',
    result: '',

    gasPrice: '50000000000',
    gas: '200000',
    to: '0xc5f590c1035ae780906514ff8e76dd86b89b97dc',
    value: '1000000000000000000',
    nonce: 0,
    toMask: '',
    chainId: 1,

    unSignedTx: '',
    signObject: null,
    rawTx: null,
  };

  inputHandler = e => {
    const { target } = e;
    this.setState({
      [target.name]: target.value,
    });
  };

  getApisAddress = async () => {
    try {
      const transport = await TransportU2F.create();
      const apis = new Apis(transport);
      const result = await apis.getAddress("44'/777'/0'/0/0");
      this.setState({
        address: result.address,
        publicKey: result.publicKey,
      });
    } catch (error) {
      this.setState({ error });
    }
  };

  signTransaction = async () => {
    const { unSignedTx } = this.state;
    try {
      const transport = await TransportU2F.create();
      const apis = new Apis(transport);
      const result = await apis.signTransaction("44'/777'/0'/0/0", unSignedTx);
      this.setState({
        signObject: result,
      });
    } catch (error) {
      this.setState({ error });
    }
  };

  generateHash = async () => {
    const { gasPrice, gas, to, value, nonce, chainId } = this.state;
    const app3 = new App3();
    const unSignedTx = await app3.apis.accounts.getEncodedTx({
      gasPrice,
      gas,
      to,
      value,
      nonce,
      chainId,
    });
    this.setState({
      unSignedTx: unSignedTx.encoded.substring(2),
    });
  };

  mergeSign = async () => {
    const { gasPrice, gas, to, value, nonce, chainId, signObject } = this.state;

    const app3 = new App3();

    const rawTx = await app3.apis.accounts.mergeSign(
      {
        gasPrice,
        gas,
        to,
        value,
        nonce,
        chainId,
      },
      {
        v: signObject.v,
        s: signObject.s,
        r: signObject.r,
      },
    );
    this.setState({
      rawTx: rawTx.rawTransaction,
    });
  };

  render() {
    const {
      error,
      address,
      publicKey,
      gasPrice,
      gas,
      value,
      nonce,
      to,
      chainId,
      unSignedTx,
      signObject,
      rawTx,
    } = this.state;

    return (
      <main>
        <h1 style={{ color: 'red' }}>Ledger Test with U2F 제발 되라</h1>
        <h2>지갑 주소 가져오기</h2>
        <article style={{ border: '1px solid #d108da', padding: '10px' }}>
          <section>
            <button type="button" onClick={this.getApisAddress}>
              주소 가져오기!
            </button>
            <p style={{ color: 'blue' }}>
              {address !== '' && `주소: ${address}`}
            </p>
            <p style={{ color: 'blue' }}>
              {publicKey !== '' && `퍼블릭키: ${publicKey}`}
            </p>
          </section>
          {error !== '' && <section>{`에러! => ${error}`}</section>}
        </article>
        <h2>Generate Raw TX</h2>
        <article>
          <label style={labelStyle} htmlFor="address">
            보내는 주소 =>{' '}
            <input
              id="address"
              name="address"
              style={inputStyle}
              value={address}
              onChange={this.inputHandler}
              readOnly
            />
          </label>
          <label style={labelStyle} htmlFor="gasPrice">
            가스프라이스 =>{' '}
            <input
              id="gasPrice"
              name="gasPrice"
              style={inputStyle}
              value={gasPrice}
              onChange={this.inputHandler}
            />
          </label>
          <label style={labelStyle} htmlFor="gas">
            가스 =>{' '}
            <input
              id="gas"
              name="gas"
              style={inputStyle}
              value={gas}
              onChange={this.inputHandler}
            />
          </label>
          <label style={labelStyle} htmlFor="to">
            받는주소 =>{' '}
            <input
              id="to"
              name="to"
              style={inputStyle}
              value={to}
              onChange={this.inputHandler}
            />
          </label>
          <label style={labelStyle} htmlFor="nonce">
            논스 =>{' '}
            <input
              id="nonce"
              name="nonce"
              style={inputStyle}
              value={nonce}
              onChange={this.inputHandler}
              readOnly
            />
          </label>
          <label style={labelStyle} htmlFor="value">
            보낼 APIS =>{' '}
            <input
              id="value"
              name="value"
              style={inputStyle}
              value={value}
              onChange={this.inputHandler}
            />
          </label>
          <label style={labelStyle} htmlFor="chainId">
            체인 Id =>{' '}
            <input
              id="chainId"
              name="chainId"
              style={inputStyle}
              value={chainId}
              onChange={this.inputHandler}
              readOnly
            />
          </label>
          <button type="button" onClick={this.generateHash}>
            만들기!
          </button>
          <p>결과: {unSignedTx}</p>
        </article>

        <h2>Sign</h2>
        <p>
          <button type="button" onClick={this.signTransaction}>
            서명하기!
          </button>
        </p>
        {signObject !== null && (
          <p>
            <span>v: {signObject.v}</span>
            <br />
            <span>s: {signObject.s}</span>
            <br />
            <span>r: {signObject.r}</span>
          </p>
        )}

        <h3>Merge Sign</h3>
        <button type="button" onClick={this.mergeSign}>
          머지하기!
        </button>

        <h3 style={{ fontSize: '55px ', color: 'red' }}>{rawTx}</h3>
      </main>
    );
  }
}
