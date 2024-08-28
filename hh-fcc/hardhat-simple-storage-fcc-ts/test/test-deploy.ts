import { ethers } from "hardhat";
import { assert } from "chai";

describe("SimpleStorage", function () {
  let simpleStorageFactory, simpleStorage
  beforeEach(async function () {
    simpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await simpleStorageFactory.deploy();
  })

  it("Should start a favorite number at 0", async function () {
    const currentValue = await simpleStorage.retrieve()
    const expectedValue = "0"
    // assert
    // expect
    assert.equal(currentValue.toString(), expectedValue)
  })

  it("Should update when we call store", async function () {
    const newValue = "42"
    const tx = await simpleStorage.store(newValue)
    await tx.wait(1)

    const currentValue = await simpleStorage.retrieve()
    assert.equal(currentValue.toString(), newValue)
  })

  it("Should start a add person at Galahad and his favorite number is 13", async function () {
    const newValue = "13"
    const personName = "Galahad"
    const tx = await simpleStorage.addPerson(personName, newValue)
    await tx.wait(1)

  })
})
