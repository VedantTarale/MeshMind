import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
require('dotenv').config();

const DeployModule = buildModule("DeployModule", (m) => {
  const tokenTransfer = m.contract("TokenTransfer");
  const meshMind = m.contract("MeshMind", [tokenTransfer, '0xAceAcA97FbAB5E83d26C5a4e20a561f79Ed462Ef']);

  return { tokenTransfer, meshMind };
});

export default DeployModule;

// DeployModule#TokenTransfer - 0x1aC1aE30806e026Aa4e85e3938d847D11F2B7837
// DeployModule#MeshMind - 0xeb2F26441508AeC79B506F01420d7785570ADf8b