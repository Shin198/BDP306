const TestToken = artifacts.require("TestToken");
const Reserve = artifacts.require("Reserve");
const Exchange = artifacts.require("Exchange");


module.exports = async function (deployer, network, accounts) {


  await deployer.deploy(Reserve, "Token A", "TOA", 18);
  const reserveA = await Reserve.deployed();
  await reserveA.setExchangeRates(1, 2);
  const tokenA = await reserveA.getTokenAddress()
  console.log('TokenA:: Address:: ', tokenA)

  await deployer.deploy(Reserve, "Token B", "TOB", 18);
  const reserveB = await Reserve.deployed();
  await reserveB.setExchangeRates(2, 4);
  const tokenB = await reserveB.getTokenAddress()
  console.log('TokenB:: Address:: ', tokenB)

  await deployer.deploy(Exchange);
  const exchangeCtr = await Exchange.deployed();
  await exchangeCtr.addReserve(reserveA.address, tokenA, true);
  await exchangeCtr.addReserve(reserveB.address, tokenB, true);



}
