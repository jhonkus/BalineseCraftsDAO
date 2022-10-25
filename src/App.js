import { useAddress, useContract } from "@thirdweb-dev/react";
import { useState, useEffect, useMemo } from "react";
import { ConnectWallet } from "@thirdweb-dev/react";
import { Button, Table, Row, Col } from "react-bootstrap";
import { AddressZero } from "@ethersproject/constants";
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

  const [proposals, setProposals] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // A fancy function to shorten someones wallet address, no need to show the whole thing.
  const shortenAddress = (str) => {
    return str.substring(0, 6) + "..." + str.substring(str.length - 4);
  };

  // Use the hooks thirdweb give us.
  const address = useAddress();
  // const connectWithMetamask = useMetamask();
  console.log("👋 Address:", address);

  const ActiveProposals = () => {
    return (
      <div>
        <h4>Active Proposals</h4>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            //before we do async things, we want to disable the button to prevent double clicks
            setIsVoting(true);

            // lets get the votes from the form for the values
            const votes = proposals.map((proposal) => {
              const voteResult = {
                proposalId: proposal.proposalId,
                //abstain by default
                vote: 2,
              };
              proposal.votes.forEach((vote) => {
                const elem = document.getElementById(
                  proposal.proposalId + "-" + vote.type
                );

                if (elem.checked) {
                  voteResult.vote = vote.type;
                  return;
                }
              });
              return voteResult;
            });

            // first we need to make sure the user delegates their token to vote
            try {
              //we'll check if the wallet still needs to delegate their tokens before they can vote
              const delegation = await token.getDelegationOf(address);
              // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
              if (delegation === AddressZero) {
                //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                await token.delegateTo(address);
              }
              // then we need to vote on the proposals
              try {
                await Promise.all(
                  votes.map(async ({ proposalId, vote: _vote }) => {
                    // before voting we first need to check whether the proposal is open for voting
                    // we first need to get the latest state of the proposal
                    const proposal = await vote.get(proposalId);
                    // then we check if the proposal is open for voting (state === 1 means it is open)
                    if (proposal.state === 1) {
                      // if it is open for voting, we'll vote on it
                      return vote.vote(proposalId, _vote);
                    }
                    // if the proposal is not open for voting we just return nothing, letting us continue
                    return;
                  })
                );
                try {
                  // if any of the propsals are ready to be executed we'll need to execute them
                  // a proposal is ready to be executed if it is in state 4
                  await Promise.all(
                    votes.map(async ({ proposalId }) => {
                      // we'll first get the latest state of the proposal again, since we may have just voted before
                      const proposal = await vote.get(proposalId);

                      //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                      if (proposal.state === 4) {
                        return vote.execute(proposalId);
                      }
                    })
                  );
                  // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                  setHasVoted(true);
                  // and log out a success message
                  console.log("successfully voted");
                } catch (err) {
                  console.error("failed to execute votes", err);
                }
              } catch (err) {
                console.error("failed to vote", err);
              }
            } catch (err) {
              console.error("failed to delegate tokens");
            } finally {
              // in *either* case we need to set the isVoting state to false to enable the button again
              setIsVoting(false);
            }
          }}
        >
          {proposals.map((proposal) => (
            <div key={proposal.proposalId} className="active-proposal">
              <h6>{proposal.description}</h6>
              <div>
                {proposal.votes.map(({ type, label }) => (
                  <div key={type}>
                    <input
                      type="radio"
                      id={proposal.proposalId + "-" + type}
                      name={proposal.proposalId}
                      value={type}
                      //default the "abstain" vote to checked
                      defaultChecked={type === 2}
                    />
                    <label htmlFor={proposal.proposalId + "-" + type}>
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button disabled={isVoting || hasVoted} type="submit">
            {isVoting
              ? "Voting..."
              : hasVoted
              ? "You Already Voted"
              : "Submit Votes"}
          </Button>
          {!hasVoted && (
            <small>
              <br />
              This will trigger multiple transactions that you will need to
              sign.
            </small>
          )}
        </form>
      </div>
    );
  };
  const MemberList = () => {
    return (
      <div>
        <h4>Member List</h4>
        <Table striped bordered hover size="sm">
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
        </Table>
      </div>
    );
  };

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

  const vote = useContract(
    "0xe8f277d067F2e118b049aE4819b38acc7499A844",
    "vote"
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

  // Retrieve all our existing proposals from the contract.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // A simple call to vote.getAll() to grab the proposals.
    const getAllProposals = async () => {
      try {
        const proposals = await vote?.contract.getAll();
        setProposals(proposals);
        console.log("🌈 Proposals:", proposals);
      } catch (error) {
        console.log("failed to get proposals", error);
      }
    };
    getAllProposals();
  }, [hasClaimedNFT, vote?.contract]);

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

  // We also need to check if the user already voted.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // If we haven't finished retrieving the proposals from the useEffect above
    // then we can't check if the user voted yet!
    if (!proposals.length) {
      return;
    }

    const checkIfUserHasVoted = async () => {
      try {
        const hasVoted = await vote?.contract.hasVoted(
          proposals[0].proposalId,
          address
        );
        setHasVoted(hasVoted);
        if (hasVoted) {
          console.log("🥵 User has already voted");
        } else {
          console.log("🙂 User has not voted yet");
        }
      } catch (error) {
        console.error("Failed to check if wallet has voted", error);
      }
    };
    checkIfUserHasVoted();
  }, [hasClaimedNFT, proposals, address, vote?.contract]);

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">Welcome to Bali Arts DAO</h1>

        <p className="description">
          Here you can see some of our Balinese Art collections including
          Paintings, Sculptures and Various Handicrafts made by artisans from
          Bali, Indonesia.
        </p>

        <div className="connect">
          <ConnectWallet />
        </div>

        {!hasClaimedNFT && (
          <div className="text-center mintNft">
            <h3>Mint your free Balinese Arts Membership NFT</h3>
            <p className="description">
              Please register as a member by pressing the Mining button below.
              Registration is free.
            </p>

            <Button disabled={isClaiming || !address} onClick={mintNft}>
              {isClaiming ? "Minting..." : "Mint your NFT (FREE)"}
            </Button>
          </div>
        )}

        {/* <div className="grid">
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
        </div> */}

        {hasClaimedNFT && 
          <>
            <div className="member-page">
              <h3>Congratulations on being a members.</h3>
            </div>

            <Row>
              <Col lg="5">
                <MemberList />
              </Col>
              <Col lg="7">
                <ActiveProposals />
              </Col>
            </Row>
          </>
        }
      </main>
    </div>
  );
}
