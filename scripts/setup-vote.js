import sdk from "./initialize-sdk.js";

// This is our governance contract.
const vote = await sdk.getContract("0xe8f277d067F2e118b049aE4819b38acc7499A844", "vote"); 

// This is our ERC-20 contract.
const token = await sdk.getContract("0xDf5E56C72FA0379EAFa8d743571C98Dd2eD28835", "token");

(async () => {
  try {
    // Give our treasury the power to mint additional token if needed.
    await token.roles.grant("minter", vote.getAddress());

    console.log(
      "Successfully gave vote contract permissions to act on token contract"
    );
  } catch (error) {
    console.error(
      "failed to grant vote contract permissions on token contract",
      error
    );
    process.exit(1);
  }

  try {
    // Grab our wallet's token balance, remember -- we hold basically the entire supply right now!
    const ownedTokenBalance = await token.balanceOf(
      process.env.WALLET_ADDRESS
    );

    // Grab 70% of the supply that we hold.
    const ownedAmount = ownedTokenBalance.displayValue;
    const percent70 = Number(ownedAmount) / 100 * 70;

    // Transfer 70% of the supply to our voting contract.
    await token.transfer(
      vote.getAddress(),
      percent70
    ); 

    console.log("✅ Successfully transferred " + percent70 + " tokens to vote contract");
  } catch (err) {
    console.error("failed to transfer tokens to vote contract", err);
  }
})();