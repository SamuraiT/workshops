const { expect } = require("chai");
const { ethers } = require("hardhat");
const { signMetaTxRequest } = require("../../src/signer");

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

describe("contracts/Registry", function() {
  beforeEach(async function() {
    this.forwarder = await deploy('MinimalForwarder');
    this.registry = await deploy("Registry", this.forwarder.address);
    this.accounts = await ethers.getSigners();
  });

  it("registers a name directly", async function() {
    const sender = this.accounts[1];
    const registry = this.registry.connect(sender);

    const receipt = await registry.register('defender').then(tx => tx.wait());
    expect(receipt.events[0].event).to.equal('Registered');

    expect(await registry.owners('defender')).to.equal(sender.address);
    expect(await registry.names(sender.address)).to.equal('defender');
  });

  it("registers names directly", async function() {
    const sender = this.accounts[1];
    const registry = this.registry.connect(sender);
    const interface = new ethers.utils.Interface([
      "function register(string memory name) public",
    ])
    const calls = [
      interface.encodeFunctionData("register", ["defender"]),
      interface.encodeFunctionData("register", ["multicall-example"])
    ]
    const receipt = await registry.multicall(calls).then(tx => tx.wait());
    expect(receipt.events[0].event).to.equal('Registered');

    expect(await registry.owners('defender')).to.equal(sender.address);
    expect(await registry.owners('multicall-example')).to.equal(sender.address);
  });

  it("registers names via a meta-tx", async function() {
    const signer = this.accounts[2];
    const relayer = this.accounts[3];
    const forwarder = this.forwarder.connect(relayer);
    const registry = this.registry;
    const interface = new ethers.utils.Interface([
      "function register(string memory name) public",
      "function multicall(bytes[] calldata data) external",
    ])
    const calls = [
      interface.encodeFunctionData("register", ["multicall-example"]),
      interface.encodeFunctionData("register", ["defender-defender"]),
    ]

    const { request, signature } = await signMetaTxRequest(signer.provider, forwarder, {
      from: signer.address,
      to: registry.address,
      data: registry.interface.encodeFunctionData('multicall', [calls]),
    });

    expect(await registry.owners('defender-defender')).to.equal('0x0000000000000000000000000000000000000000');
    expect(await registry.owners('multicall-example')).to.equal('0x0000000000000000000000000000000000000000');

    const result = await forwarder.execute(request, signature).then(tx => tx.wait());
    console.log(result.events.map((event) => registry.interface.decodeEventLog('Registered', event.data, event.topics)))

    expect(await registry.owners('defender-defender')).to.equal('0x656E646572000000000000000000000000000000');
    expect(await registry.owners('multicall-example')).to.equal('0x616d706C65000000000000000000000000000000');
  });

  it("registers a name via a meta-tx", async function() {
    const signer = this.accounts[2];
    const relayer = this.accounts[3];
    const forwarder = this.forwarder.connect(relayer);
    const registry = this.registry;
    const { request, signature } = await signMetaTxRequest(signer.provider, forwarder, {
      from: signer.address,
      to: registry.address,
      data: registry.interface.encodeFunctionData('register', ['meta-txs']),
    });

    await forwarder.execute(request, signature).then(tx => tx.wait());

    expect(await registry.owners('meta-txs')).to.equal(signer.address);
    expect(await registry.names(signer.address)).to.equal('meta-txs');
  });
});
