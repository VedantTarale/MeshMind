import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployModule = buildModule("DeployModule", (m) => {
  const contract = m.contract("TokenTransfer");

  return { contract };
});

export default DeployModule;