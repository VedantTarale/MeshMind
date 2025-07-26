import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
require('dotenv').config();

const DeployModule = buildModule("DeployModule", (m) => {
  const tokenTransfer = m.contract("TokenTransfer");
  const meshMind = m.contract("MeshMind", [tokenTransfer, '0xAceAcA97FbAB5E83d26C5a4e20a561f79Ed462Ef']);

  return { tokenTransfer, meshMind };
});

export default DeployModule;

// DeployModule#TokenTransfer - 0x12743949e8D927f28724C40b72Dd179571Be0F33
// DeployModule#MeshMind - 0xA8693c0Be587946bdd9dC2A718d3820AF43dFfA5