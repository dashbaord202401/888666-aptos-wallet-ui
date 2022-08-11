import React, { useState } from "react";

import { WalletClient } from "./aptos-api";
import "./App.css";
const NODE_URL =
  process.env.APTOS_NODE_URL || "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL =
  process.env.APTOS_FAUCET_URL || "https://faucet.devnet.aptoslabs.com";

const walletClient = new WalletClient(NODE_URL, FAUCET_URL);
var account1;
function App() {
  const [addr1, setAddr1] = useState("");
  const [seed, setSeed] = useState("");
  const [recAddr, setRecAddr] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [bal1, setBal1] = useState(null);
  const [sendAmount, setSendAmount] = useState("");
  const [balChkAddr, setBalChkAddr] = useState("");
  const [chkBal, setChkBal] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [txHash, setTxHash] = useState([]);
  const [txns, setTxns] = useState([]);

  const create = async () => {
    let { account, mnemonic } = await walletClient.createNewAccount();
    account1 = account;
    setSeed(mnemonic);
    setAddr1(account1.address().hexString);
    setIsConnected(true);
    setBal1(await walletClient.balance(account1.address()));
  };
  const balance = async () => {
    setBal1(await walletClient.balance(addr1));
  };
  const checkBalance = async () => {
    if (balChkAddr !== "") {
      setChkBal(await walletClient.balance(balChkAddr));
    }
  };
  const sendToken = async () => {
    let txnHash = await walletClient.sendToken(account1, recAddr, sendAmount);
    balance();
    console.log("txnHash2", txnHash);
    setTxHash([txnHash, ...txHash]);
  };
  const importAccount = async () => {
    account1 = await walletClient.getAccountFromMnemonic(mnemonic);
    setSeed(mnemonic);
    console.log("account1 :", account1);
    setAddr1(account1.address().hexString);
    setIsConnected(true);
    setIsImporting(false);
    setBal1(await walletClient.balance((await account1).address()));
  };
  const getTxns = async function accountTransactions() {
    let txns = await walletClient.accountTransactions(addr1);
    setTxns(...txns);
  };
  return (
    <div className="App">
      <h1>Aptos Wallet</h1>
      <header className="App-header">
        <div style={{ padding: "5px" }}>
          <h2>Balance Checker</h2>
          <input
            type={"text"}
            placeholder={"Enter Wallet Address"}
            value={balChkAddr}
            onChange={(e) => setBalChkAddr(e.target.value)}
          ></input>
          <button onClick={checkBalance}> Check Balance</button>
          {chkBal}
        </div>
        <div style={{ padding: "5px" }}>
          <h2>Account</h2>

          {isConnected === false && isImporting === false ? (
            <>
              <button onClick={create}>Create Account</button>
              <button onClick={() => setIsImporting(true)}>
                Import Account
              </button>
            </>
          ) : (
            <>
              <button onClick={balance}> Refresh </button>
              <button onClick={getTxns}> Previous Txns </button>
            </>
          )}
          {isImporting === true ? (
            <>
              <input
                type={"text"}
                placeholder={"Enter Mnemonic Phrase"}
                onChange={(e) => setMnemonic(e.target.value)}
                value={mnemonic}
              ></input>
              <button onClick={importAccount}>Import</button>
            </>
          ) : null}
        </div>
        <div>
          {isConnected === true ? (
            <>
              <p> Address :</p>
              <p>{addr1}</p>
              <p> Seed :</p>
              <p>{seed}</p>
              <p>Balance :</p>
              <p>{bal1}</p>

              <div style={{ padding: "5px" }}>
                <h2>Transfer Token</h2>
                <input
                  type={"text"}
                  placeholder={"Enter Receiver Address"}
                  onChange={(e) => setRecAddr(e.target.value)}
                  value={recAddr}
                ></input>
                <input
                  type={"text"}
                  placeholder={"Enter Amount"}
                  onChange={(e) => setSendAmount(e.target.value)}
                  value={sendAmount}
                ></input>
                <button onClick={sendToken}> Send</button>
                <h2>Transaction Hash</h2>

                {txHash.length > 0 ? (
                  txHash.map((txn) => <p key={txn}>{txn}</p>)
                ) : (
                  <p>No Transactions Recorded</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </header>
    </div>
  );
}

export default App;
