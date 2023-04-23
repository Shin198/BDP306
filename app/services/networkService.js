import {
  getExchangeContract,
  getTokenContract,
  getWeb3Instance,
} from "./web3Service";
import EnvConfig from "../configs/env";

export function getSwapABI(data) {
  /*TODO: Get Swap ABI*/
}

export function getTransferABI(data) {
  /*TODO: Get Transfer ABI*/
}

export function getApproveABI(srcTokenAddress, amount) {
  /*TODO: Get Approve ABI*/
}

export function getAllowance(srcTokenAddress, address, spender) {
  /*TODO: Get current allowance for a token in user wallet*/
}

export async function getAccountAddress() {
  return await getWeb3Instance().eth.getAccounts();
}

export async function approval(token, value) {
  try {
    const tokenContract = getTokenContract(token);
    const accounts = await getWeb3Instance().eth.getAccounts();
    const account = accounts[0];
    return tokenContract.methods
      .approve(EnvConfig.EXCHANGE_CONTRACT_ADDRESS, String(value * 10 ** 18))
      .send({ from: account });
  } catch (error) {
    return error;
  }
}

export async function checkApprove(srcTokenAddress, spendValue) {
  const accounts = await getWeb3Instance().eth.getAccounts();
  const account = accounts[0];

  const tokenContract = getTokenContract(srcTokenAddress);
  const totalSupply = await tokenContract.methods.totalSupply().call();

  let result = await tokenContract.methods
    .allowance(account, EnvConfig.EXCHANGE_CONTRACT_ADDRESS)
    .call();

  return result / 1e18 >= spendValue;
}

/* Get Exchange Rate from Smart Contract */
export async function getExchangeRate(
  srcTokenAddress,
  destTokenAddress,
  srcAmount
) {
  const exchangeContract = getExchangeContract();
  let exchangeRate = await exchangeContract.methods
    .getExchangeRate(srcTokenAddress, destTokenAddress, srcAmount)
    .call();

  return exchangeRate;
}

export async function checkValidAddress(address) {
  try {
    const web3Instance = getWeb3Instance();
    const res = await web3Instance.utils.toChecksumAddress(address);
    return res;
  } catch (error) {
    return false;
  }
}

export async function swapToken(srcToken, destToken, value) {
  const accounts = await getWeb3Instance().eth.getAccounts();
  if (accounts == undefined || accounts == [] || accounts == null) {
    return new Error(`Can't connect to account`);
  }
  const account = accounts[0];

  let txObj = {};
  txObj.from = account;
  if (srcToken.address == EnvConfig.TOKENS[2].address) {
    txObj.value = String(value * 1e18);
  }
  const exchangeContract = getExchangeContract();

  let res = await exchangeContract.methods
    .exchangeToken(srcToken.address, destToken.address, String(value * 1e18))
    .send(txObj);

  return res;
}

export async function estimateGasSwapToken(srcToken, destToken, value) {
  const accounts = await getWeb3Instance().eth.getAccounts();
  if (accounts == undefined || accounts == [] || accounts == null) {
    return new Error(`Can't connect to account`);
  }
  const account = accounts[0];

  let txObj = {};
  txObj.from = account;
  if (srcToken.address == EnvConfig.TOKENS[2].address) {
    txObj.value = String(value * 1e18);
  }
  console.log(txObj)
  const exchangeContract = getExchangeContract();
  let res = await exchangeContract.methods
    .exchangeToken(srcToken.address, destToken.address, String(value * 1e18))
    .estimateGas(txObj);

  return res;
}

export async function estimgateGasTransfer(token, toAddress, value) {
  const accounts = await getWeb3Instance().eth.getAccounts();
  if (accounts == undefined || accounts == [] || accounts == null) {
    return new Error(`Can't connect to account`);
  }
  const account = accounts[0];
  if (token == EnvConfig.TOKENS[2].address) {
    let gas = await getWeb3Instance().eth.estimateGas({
      from: account,
      to: toAddress,
      value: String(value * 1e18),
    });
    return gas;
  }
  const tokenContract = getTokenContract(token);

  let gas = await tokenContract.methods
    .transfer(toAddress, String(value * 1e18))
    .estimateGas({
      from: account,
    });

  return gas;
}

export async function transferToken(token, toAddress, value) {
  const accounts = await getWeb3Instance().eth.getAccounts();
  if (accounts == undefined || accounts == [] || accounts == null) {
    return new Error(`Can't connect to account`);
  }
  const account = accounts[0];
  if (token == EnvConfig.TOKENS[2].address) {
    const result = await getWeb3Instance().eth.sendTransaction({
      from: account,
      to: toAddress,
      value: String(value * 1e18),
    });
    return result;
  }
  const tokenContract = getTokenContract(token);

  return await tokenContract.methods
    .transfer(toAddress, String(value * 1e18))
    .send({
      from: account,
    });
}

export async function getTokenBalances(token) {
  /*TODO: Get Token Balance*/
  const accounts = await getWeb3Instance().eth.getAccounts();
  const account = accounts[0];
  if (token == EnvConfig.TOKENS[2].address) {
    return await getWeb3Instance().eth.getBalance(account);
  }
  const tokenContract = getTokenContract(token);
  console.log(token, await tokenContract.methods.balanceOf(account).call())
  return await tokenContract.methods.balanceOf(account).call();
}
