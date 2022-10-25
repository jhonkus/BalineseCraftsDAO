import sdk from "./initialize-sdk.js";
import { readFileSync } from "fs";
const editionDrop = await sdk.getContract("0x62565FB8d46467de09dbae374361cB3B6124beCF", "edition-drop");

(async () => {
  try {
    await editionDrop.createBatch([
      {
        name: "Balinese Dancer Painting",
        description: "This NFT will give you access to Balinese Arts DAO!",
        image: readFileSync("scripts/assets/bali-dancer.jpg"),
      },
    ]);
    console.log("✅ Successfully created a new NFT in the drop!");
  } catch (error) {
    console.error("failed to create the new NFT", error);
  }
})();
