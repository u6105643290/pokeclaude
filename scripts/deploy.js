const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy ClaudeToken
  console.log("\n--- Deploying ClaudeToken ---");
  const ClaudeToken = await hre.ethers.getContractFactory("ClaudeToken");
  const claudeToken = await ClaudeToken.deploy();
  await claudeToken.waitForDeployment();
  const claudeTokenAddress = await claudeToken.getAddress();
  console.log("ClaudeToken deployed to:", claudeTokenAddress);

  // Deploy PokeClaudeNFT
  console.log("\n--- Deploying PokeClaudeNFT ---");
  const PokeClaudeNFT = await hre.ethers.getContractFactory("PokeClaudeNFT");
  const pokeClaudeNFT = await PokeClaudeNFT.deploy();
  await pokeClaudeNFT.waitForDeployment();
  const pokeClaudeNFTAddress = await pokeClaudeNFT.getAddress();
  console.log("PokeClaudeNFT deployed to:", pokeClaudeNFTAddress);

  // Deploy Marketplace
  console.log("\n--- Deploying Marketplace ---");
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(pokeClaudeNFTAddress, claudeTokenAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  // Deploy BattleSystem
  console.log("\n--- Deploying BattleSystem ---");
  const BattleSystem = await hre.ethers.getContractFactory("BattleSystem");
  const battleSystem = await BattleSystem.deploy(pokeClaudeNFTAddress, claudeTokenAddress);
  await battleSystem.waitForDeployment();
  const battleSystemAddress = await battleSystem.getAddress();
  console.log("BattleSystem deployed to:", battleSystemAddress);

  // Summary
  console.log("\n========================================");
  console.log("       Deployment Summary");
  console.log("========================================");
  console.log("ClaudeToken:   ", claudeTokenAddress);
  console.log("PokeClaudeNFT: ", pokeClaudeNFTAddress);
  console.log("Marketplace:   ", marketplaceAddress);
  console.log("BattleSystem:  ", battleSystemAddress);
  console.log("========================================");

  // Save deployed addresses to JSON
  const addresses = {
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      ClaudeToken: claudeTokenAddress,
      PokeClaudeNFT: pokeClaudeNFTAddress,
      Marketplace: marketplaceAddress,
      BattleSystem: battleSystemAddress,
    },
  };

  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to:", outputPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
