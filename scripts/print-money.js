import sdk from "./initialize-sdk.js";

// This is the address of our ERC-20 contract printed out in the step before.
const token = await sdk.getContract(
  "0xDf5E56C72FA0379EAFa8d743571C98Dd2eD28835",
  "token"
);

(async () => {
  try {
    // What's the max supply you want to set? 1,000,000 is a nice number!
    const amount = 1_000_000_000;
    // Interact with your deployed ERC-20 contract and mint the tokens!
    await token.mintTo("0x2a328877754f701Ed9437b528228F380cd1C7ba7",amount);
    const totalSupply = await token.totalSupply();

    // Print out how many of our token's are out there now!
    console.log(
      "✅ There now is",
      totalSupply.displayValue,
      "$BLIARTDAO in circulation"
    );
  } catch (error) {
    console.error("Failed to print money", error);
  }
})();
