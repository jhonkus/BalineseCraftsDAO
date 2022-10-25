import { useAddress, useContract } from "@thirdweb-dev/react";
import { useState, useEffect, useMemo } from "react";
import { ConnectWallet } from "@thirdweb-dev/react";
import { Button } from "react-bootstrap";
import "./styles/Home.css";

export default function App() {
  // State variable for us to know if user has our NFT.
  const [hasClaimedNFT, setHasClaimedNFT] = useState(false);
  // isClaiming lets us easily keep a loading state while the NFT is minting.
  const [isClaiming, setIsClaiming] = useState(false);

  // Holds the amount of token each member has in state.
  const [memberTokenAmounts, setMemberTokenAmounts] = useState([]);
  // The array holding all of our members addresses.
  const [memberAddresses, setMemberAddresses] = useState([]);

  // A fancy function to shorten someones wallet address, no need to show the whole thing.
  const shortenAddress = (str) => {
    return str.substring(0, 6) + "..." + str.substring(str.length - 4);
  };

  // Use the hooks thirdweb give us.
  const address = useAddress();
  // const connectWithMetamask = useMetamask();
  console.log("👋 Address:", address);

  // Initialize our editionDrop contract
  const { contract } = useContract(
    "0x62565FB8d46467de09dbae374361cB3B6124beCF",
    "edition-drop"
  );

  // Initialize our token contract
  const token = useContract(
    "0xDf5E56C72FA0379EAFa8d743571C98Dd2eD28835",
    "token"
  );

  // This useEffect grabs all the addresses of our members holding our NFT.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // Just like we did in the 7-airdrop-token.js file! Grab the users who hold our NFT
    // with tokenId 0.
    const getAllAddresses = async () => {
      try {
        const memberAddresses = await contract?.history.getAllClaimerAddresses(
          0
        );
        setMemberAddresses(memberAddresses);
        console.log("🚀 Members addresses", memberAddresses);
      } catch (error) {
        console.error("failed to get member list", error);
      }
    };
    getAllAddresses();
  }, [hasClaimedNFT, contract?.history]);

  // This useEffect grabs the # of token each member holds.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    const getAllBalances = async () => {
      try {
        // console.log("👜 token", token.contract);
        const amounts = await token?.contract?.history.getAllHolderBalances();
        setMemberTokenAmounts(amounts);
        console.log("👜 Amounts", amounts);
      } catch (error) {
        console.error("failed to get member balances", error);
      }
    };
    getAllBalances();
  }, [hasClaimedNFT, token?.contract?.history]);

  // Now, we combine the memberAddresses and memberTokenAmounts into a single array
  const memberList = useMemo(() => {
    return memberAddresses.map((address) => {
      // We're checking if we are finding the address in the memberTokenAmounts array.
      // If we are, we'll return the amount of token the user has.
      // Otherwise, return 0.
      const member = memberTokenAmounts?.find(
        ({ holder }) => holder === address
      );

      return {
        address,
        tokenAmount: member?.balance.displayValue || "0",
      };
    });
  }, [memberAddresses, memberTokenAmounts]);

  useEffect(() => {
    // If they don't have a connected wallet, exit!
    if (!address) {
      return;
    }

    const checkBalance = async () => {
      try {
        const balance = await contract.balanceOf(address, 0);
        console.log(" ==balance.gt(0): ", balance.toNumber());
        if (balance.gt(0)) {
          setHasClaimedNFT(true);
          console.log("🌟 this user has a membership NFT!");
        } else {
          setHasClaimedNFT(false);
          console.log("😭 this user doesn't have a membership NFT.");
        }
      } catch (error) {
        setHasClaimedNFT(false);
        console.error("Failed to get balance", error);
      }
    };
    checkBalance();
  }, [address, contract]);

  const mintNft = async () => {
    try {
      setIsClaiming(true);
      await contract.claim("0", 1, false);
      console.log(
        `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${contract.getAddress()}/0`
      );
      setHasClaimedNFT(true);
    } catch (error) {
      setHasClaimedNFT(false);
      console.error("Failed to mint NFT", error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">Welcome to Balinese Arts</h1>

        <p className="description">
          Here you can see some of our Balinese Art collections including
          Paintings, Sculptures and Various Handicrafts made by artisans from
          Bali, Indonesia. Please connect your wallet to this website and
          register as a member by pressing the Mining button below. Registration
          is free.
        </p>

        <div className="connect">
          <ConnectWallet />
        </div>

        {!hasClaimedNFT && (
          <div className="text-center mintNft">
            <h3>Mint your free Balinese Arts Membership NFT</h3>
            <Button disabled={isClaiming || !address} onClick={mintNft}>
              {isClaiming ? "Minting..." : "Mint your nft (FREE)"}
            </Button>
          </div>
        )}

        <div className="grid">
          <a href="/" className="card">
            <h2>Bali Paintings &rarr;</h2>
            <p>
              Here you can see Paintings collections.
              <br />
              <br />
            </p>
          </a>

          <a href="/" className="card">
            <h2>Bali Statues&rarr;</h2>
            <p>
              This is a collection of Balinese Statues made of wood.
              <br />
              <br />
            </p>
          </a>

          <a href="/" className="card">
            <h2>Bali Crafts &rarr;</h2>
            <p>
              This is a collection of knick-knacks made by Balinese craftsmen.
            </p>
          </a>
        </div>

        {hasClaimedNFT && (
          <>
            <div className="member-page">
              <h3>🍪 Congratulations on being a members.</h3>
            </div>
            <div>
              <div>
                <h5>Member List</h5>
                <table className="card">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Token Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberList.map((member) => {
                      return (
                        <tr key={member.address}>
                          <td>{shortenAddress(member.address)}</td>
                          <td>{member.tokenAmount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
