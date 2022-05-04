const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { advanceTime } = require('./utils');
const Web3 = require("web3");
const { fromWei } = Web3.utils;

describe('///^Rarity Staking Test Suite^///', async function(){
    let owner, alice, bob, clyde, nft, token, staking;

    beforeEach('Running Iterative Functions', async function(){

        [owner, alice, bob, clyde] = await ethers.getSigners();
        const nftToken = await ethers.getContractFactory('MockNFT');
        nft = await nftToken.deploy();
        const rewardToken = await ethers.getContractFactory('MockToken');
        token = await rewardToken.deploy();
        const rarityStaking = await ethers.getContractFactory('RarityStaking');
        staking = await rarityStaking.deploy(nft.address, token.address);

        await nft.connect(alice).safeMint(alice.address, 1);
        await nft.connect(alice).safeMint(alice.address, 2);
        await nft.connect(bob).safeMint(bob.address, 3);
        await nft.connect(bob).safeMint(bob.address, 4);
        await nft.connect(clyde).safeMint(clyde.address, 1466);
        await nft.connect(clyde).safeMint(clyde.address, 565);

        await nft.connect(alice).setApprovalForAll(staking.address, true);
        await nft.connect(bob).setApprovalForAll(staking.address, true);
        await nft.connect(clyde).setApprovalForAll(staking.address, true);

        await token.mint(owner.address, ethers.utils.parseEther('6000'));
        await token.transfer(staking.address, ethers.utils.parseEther('5000'));
    });

    it('Test 1: Initialize Contract and Staking', async function(){
        await expect(staking.connect(alice).stakeTokens([1, 2])).to.be.revertedWith('Rarity not initialized');
        console.log("Cannot stake until initialized, Successful!");
        await staking.initializeRarity([[1, 571515,
            "0x4abb6636a08297ce3983c3cab0da7c05a59c913dd1ba4c8f8b4367dcc9b992ef6568fd223b1b31d8505486779ae80b6e0db6fa6fc9761b149bc8daffddb4fe421b"],
        [2, 369299, "0x30ec9140ec95fc56951e07ee66ec523278d2ad920adfb06bc90e970544f3b93a3f7f2a9c10d8c224d85242896de9cb6f615a09e27cba5df809d3520f3dea238c1c"],
            [3, 429135, "0x7d0dc9194f2d6988dcc2a4ccac1ebb278142e57448b46024f6d3ef01b58a53a03909574a620bd3d0096bc70f067eae39dd8aa652b404459fcc05e1d6aa4fb5681c"],
            [4, 616637, "0xd600bd2049ecd6ec75c4bb8f2299399f4306484ccaf3961e83fe2be3e974b59363b30c60e6dfa6ea7a99ed9dd146a2309391e25c3c0166dce15a2d1bda3dd3b81b"]]);
        await staking.connect(alice).stakeTokens([1, 2]);
        await staking.connect(bob).stakeTokens([3, 4]);
        expect (await nft.ownerOf(1)).to.equal(staking.address);
        expect (await nft.ownerOf(3)).to.equal(staking.address);
        console.log("Ownership transferred to contract after staking, Successful!");
        let structVar = await staking.stakedInfo(1);
        await expect(structVar[0]).to.equal(alice.address);
        console.log("Address stored in stakedInfo mapping is the original owner");
    });

    it('Test 2: Raffle Roll', async function(){
        await staking.initializeRarity([[1, 571515,
            "0x4abb6636a08297ce3983c3cab0da7c05a59c913dd1ba4c8f8b4367dcc9b992ef6568fd223b1b31d8505486779ae80b6e0db6fa6fc9761b149bc8daffddb4fe421b"],
            [2, 369299, "0x30ec9140ec95fc56951e07ee66ec523278d2ad920adfb06bc90e970544f3b93a3f7f2a9c10d8c224d85242896de9cb6f615a09e27cba5df809d3520f3dea238c1c"],
            [3, 429135, "0x7d0dc9194f2d6988dcc2a4ccac1ebb278142e57448b46024f6d3ef01b58a53a03909574a620bd3d0096bc70f067eae39dd8aa652b404459fcc05e1d6aa4fb5681c"],
            [4, 616637, "0xd600bd2049ecd6ec75c4bb8f2299399f4306484ccaf3961e83fe2be3e974b59363b30c60e6dfa6ea7a99ed9dd146a2309391e25c3c0166dce15a2d1bda3dd3b81b"]]);
        await staking.connect(alice).stakeTokens([1, 2]);
        await advanceTime(3600 * 24);
        let balanceOfReward1 = await token.balanceOf(alice.address);
        console.log("Alice's balance before winning Raffle: -",
            fromWei(balanceOfReward1.toString(),'ether'));
        await staking.connect(alice).raffleRoll([1,2]);
        let balanceOfReward2 = await token.balanceOf(alice.address);
        console.log("Alice's balance after winning Raffle: -",
            fromWei(balanceOfReward2.toString(),'ether'));
        await advanceTime(3600 * 11);
        await expect(staking.connect(alice).raffleRoll([1, 2])).to.be.revertedWith('Rolling too soon');
        console.log('Successfully checks rolling too soon clause');
        await staking.setRaffleReward(ethers.utils.parseEther('2'));
        await advanceTime(3600);
        let balanceOfReward3 = await token.balanceOf(alice.address);
        console.log("Alice's balance before winning Raffle: -",
            fromWei(balanceOfReward3.toString(),'ether'));
        await staking.connect(alice).raffleRoll([1, 2]);
        let balanceOfReward4 = await token.balanceOf(alice.address);
        console.log("Alice's balance after winning Raffle: -",
            fromWei(balanceOfReward4.toString(),'ether'));
    });

    it('Test 3: Claiming Rewards', async function(){
        await staking.initializeRarity([[1, 571515,
            "0x4abb6636a08297ce3983c3cab0da7c05a59c913dd1ba4c8f8b4367dcc9b992ef6568fd223b1b31d8505486779ae80b6e0db6fa6fc9761b149bc8daffddb4fe421b"],
            [2, 369299, "0x30ec9140ec95fc56951e07ee66ec523278d2ad920adfb06bc90e970544f3b93a3f7f2a9c10d8c224d85242896de9cb6f615a09e27cba5df809d3520f3dea238c1c"],
            [3, 429135, "0x7d0dc9194f2d6988dcc2a4ccac1ebb278142e57448b46024f6d3ef01b58a53a03909574a620bd3d0096bc70f067eae39dd8aa652b404459fcc05e1d6aa4fb5681c"],
            [4, 616637, "0xd600bd2049ecd6ec75c4bb8f2299399f4306484ccaf3961e83fe2be3e974b59363b30c60e6dfa6ea7a99ed9dd146a2309391e25c3c0166dce15a2d1bda3dd3b81b"]]);
        await staking.connect(bob).stakeTokens([3, 4]);
        await advanceTime(24 * 3600);
        let balanceOfReward1 = await token.balanceOf(bob.address);
        console.log("Bob's balance before claiming:-",
            fromWei(balanceOfReward1.toString(),'ether'));
        await expect(staking.connect(alice).claimRewards([3,4])).to.be.revertedWith('Sender not owner');
        console.log("Alice can't claim for Bob");
        await staking.connect(bob).claimRewards([4]);
        let balanceOfReward2 = await token.balanceOf(bob.address);
        console.log("Bob's balance after claiming only for tokenId 4:-",
            fromWei(balanceOfReward2.toString(),'ether'));
        await staking.connect(bob).claimRewards([4]);
        let balanceOfReward3 = await token.balanceOf(bob.address);
        console.log("Bob's balance after claiming reward for tokenId 4 immediately:-",
            fromWei(balanceOfReward3.toString(),'ether'));
        await staking.updateRewards(ethers.utils.parseEther('2'));
        await staking.connect(bob).claimRewards([3]);
        let balanceOfReward4 = await token.balanceOf(bob.address);
        console.log("Bob's balance after claiming for tokenId 3 after changing rate but immediately:-",
            fromWei(balanceOfReward4.toString(),'ether'));
        await advanceTime(12 * 3600);
        await staking.connect(bob).claimRewards([3]);
        let balanceOfReward5 = await token.balanceOf(bob.address);
        console.log("Bob's balance after claiming for tokenID 3 after changing rate after 12 hrs:-",
            fromWei(balanceOfReward5.toString(),'ether'));
        await advanceTime(12 * 3600);
    });

    it('Test 4: Unstaking Tokens', async function(){
        await staking.initializeRarity([[1, 571515,
            "0x4abb6636a08297ce3983c3cab0da7c05a59c913dd1ba4c8f8b4367dcc9b992ef6568fd223b1b31d8505486779ae80b6e0db6fa6fc9761b149bc8daffddb4fe421b"],
            [2, 369299, "0x30ec9140ec95fc56951e07ee66ec523278d2ad920adfb06bc90e970544f3b93a3f7f2a9c10d8c224d85242896de9cb6f615a09e27cba5df809d3520f3dea238c1c"],
            [3, 429135, "0x7d0dc9194f2d6988dcc2a4ccac1ebb278142e57448b46024f6d3ef01b58a53a03909574a620bd3d0096bc70f067eae39dd8aa652b404459fcc05e1d6aa4fb5681c"],
            [4, 616637, "0xd600bd2049ecd6ec75c4bb8f2299399f4306484ccaf3961e83fe2be3e974b59363b30c60e6dfa6ea7a99ed9dd146a2309391e25c3c0166dce15a2d1bda3dd3b81b"]]);
        await staking.connect(bob).stakeTokens([3, 4]);
        let structVar = await staking.stakedInfo(3);
        console.log("Struct owner value:-",structVar[0]);
        await advanceTime(24 * 3600);
        let balanceOfReward1 = await token.balanceOf(bob.address);
        console.log("Bob's balance before unstaking:-",
            fromWei(balanceOfReward1.toString(),'ether'));
        await staking.connect(bob).unstakeTokens([3,4]);
        let balanceOfReward2 = await token.balanceOf(bob.address);
        console.log("Bob's balance after claiming:-",
            fromWei(balanceOfReward2.toString(),'ether'));
        expect (await nft.ownerOf(3)).to.equal(bob.address);
        console.log("NFTs returned to original owners");
        let structVar2 = await staking.stakedInfo(3);
        console.log("Struct owner value:-",structVar2[0]);
    });

    it('Test 5: Testing for the rarest and least rare Molecule', async function(){
        await staking.initializeRarity([[1466, 2859033,
        "0x4918ee4734b133c3e0badabc708dec50467480950e67249eb130d9f1794d57ef74d049e9d3eec1e1f994ea8c31de99596a4c234436f98e961124da2a51c378b91b"],
        [565, 277489,
        "0x4a53de024665ce4464c6d5dfb7bdb058f3e74a3a5db9c1cab0e3b88fee73ff3b7bd83be6c137f542546a017e043c113afc100deac0650a2c01c58102d551b9941c"]]);
        await staking.connect(clyde).stakeTokens([1466, 565]);
        await advanceTime(24 * 3600);

        let balanceOfReward1 = await token.balanceOf(clyde.address);
        console.log("Clyde's balance before claiming Reward for rarest molecule: -",
            fromWei(balanceOfReward1.toString(),'ether'));
        await staking.connect(clyde).claimRewards([1466]);
        let balanceOfReward2 = await token.balanceOf(clyde.address);
        console.log("Clyde's balance after claiming Reward for tokenID 1466(rarest) after 24hrs: -",
            fromWei(balanceOfReward2.toString(),'ether'));

        let balanceOfReward3 = await token.balanceOf(clyde.address);
        console.log("Clyde's balance before claiming reward for least rare molecule: -",
            fromWei(balanceOfReward3.toString(),'ether'));
        await staking.connect(clyde).claimRewards([565]);
        let balanceOfReward4 = await token.balanceOf(clyde.address);
        console.log("Clyde's balance after claiming reward for tokenID 565(least rare) after 24hrs: -",
            fromWei(balanceOfReward4.toString(),'ether'));
    });
});