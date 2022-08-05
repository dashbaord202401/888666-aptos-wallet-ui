import React, { useState } from "react";
import bigInt from "big-integer";
import {
  AptosClient,
  AptosAccount,
  FaucetClient,
  BCS,
  TxnBuilderTypes,
} from "aptos";
import "./App.css";
const NODE_URL =
  process.env.APTOS_NODE_URL || "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL =
  process.env.APTOS_FAUCET_URL || "https://faucet.devnet.aptoslabs.com";

const {
  AccountAddress,
  TypeTagStruct,
  ScriptFunction,
  StructTag,
  TransactionPayloadScriptFunction,
  RawTransaction,
  ChainId,
} = TxnBuilderTypes;
const client = new AptosClient(NODE_URL);
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
var account1;
function App() {
  const [addr1, setAddr1] = useState("");
  const [recAddr, setRecAddr] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [bal1, setBal1] = useState(null);
  const [sendAmount, setSendAmount] = useState("");
  const [balChkAddr, setBalChkAddr] = useState("");
  const [chkBal, setChkBal] = useState("");
  const [txHash, setTxHash] = useState([]);
  const create = async () => {
    account1 = new AptosAccount();
    setAddr1(account1.address().hexString);
    setIsConnected(true);
    await faucetClient.fundAccount(account1.address(), 10000);
    let resources = await client.getAccountResources(
      account1.address().hexString
    );
    // Find Aptos coin resourse
    let accountResource = resources.find(
      (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    );
    setBal1(parseInt(accountResource?.data.coin.value));
  };
  const balance = async () => {
    if (addr1 !== "") {
      let resources = await client.getAccountResources(addr1);
      // Find Aptos coin resourse
      let accountResource = resources.find(
        (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );
      setBal1(parseInt(accountResource?.data.coin.value));
    }
  };
  const checkBalance = async () => {
    if (balChkAddr !== "") {
      let resources = await client.getAccountResources(balChkAddr);
      // Find Aptos coin resourse
      let accountResource = resources.find(
        (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );
      setChkBal(parseInt(accountResource?.data.coin.value));
    }
  };
  const sendToken = async () => {
    const token = new TypeTagStruct(
      StructTag.fromString("0x1::aptos_coin::AptosCoin")
    );
    const scriptFunctionPayload = new TransactionPayloadScriptFunction(
      ScriptFunction.natural(
        // Fully qualified module name, `AccountAddress::ModuleName`
        "0x1::coin",
        // Module function
        "transfer",
        // The coin type to transfer
        [token],
        // Arguments for function `transfer`: receiver account address and amount to transfer
        [
          BCS.bcsToBytes(AccountAddress.fromHex(recAddr)),
          BCS.bcsSerializeUint64(sendAmount),
        ]
      )
    );
    // Get the sequence number from account 1 && Get chain ID
    const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
      client.getAccount(addr1),
      client.getChainId(),
    ]);

    const rawTxn = new RawTransaction(
      // Transaction sender account address
      AccountAddress.fromHex(addr1),
      bigInt(sequenceNumber),
      scriptFunctionPayload,
      // Max gas unit to spend
      2000n,
      // Gas price per unit
      1n,
      // Expiration timestamp. Transaction is discarded if it is not executed within 10 seconds from now.
      bigInt(Math.floor(Date.now() / 1000) + 10),
      new ChainId(chainId)
    );
    // Sign the raw transaction with account1's private key
    const bcsTxn = AptosClient.generateBCSTransaction(account1, rawTxn);
    // Submit the signed Transaction
    const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
    // Wait for the transaction to complete
    await client.waitForTransaction(transactionRes.hash);
    balance();
    setTxHash([transactionRes.hash, ...txHash]);
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

          {isConnected === false ? (
            <button onClick={create}>Create Account</button>
          ) : (
            <button onClick={balance}> Refresh </button>
          )}
        </div>
        <div>
          <p> Address :</p>
          <p>{addr1}</p>
          {isConnected === true ? (
            <>
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

                {txHash.length > 0 &&
                  txHash.map((txn) => <p key={txn}>{txn}</p>)}
              </div>
            </>
          ) : null}
        </div>
      </header>
    </div>
  );
}

export default App;
