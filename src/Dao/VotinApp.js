import React from "react";
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

import ABI from "./GovernanceABI.json";
import "../App.css";
import ProposalCard from "./Components/ProposalCard.js";
import SubmissionCard from "./Components/SubmissionCard.js";



function VotingApp(props) {
    //*** CONSTANTS ***\\
    const contractAddress = "0xbaF4Cc929863Ac96f2c72B58366b60b1176FabC2";
    //*** STATE VARIABLES ***\\
    const [userAddress, setUserAddress] = useState(null);
    const [proposals, setProposals] = useState([]);

    const [pageNumber, setPageNumber] = useState(1);
    const [propsPerPage, setPropsPerPage] = useState(5);
    const [availableETH, setAvailableETH] = useState(null);
    const [quorum, setQuorum] = useState(null);

    const [totalProposals, setTotalProposals] = useState(0);
    
    
    //*** GETTER FUNCTIONS ***\\
    const getAllProposals = async() => {
        console.log("HP GAP: Running getAllProposals");
        
        console.log("HP GAP: Calling getContract")
        const contract = await connectContract();
        const totalProposals = await getTotalProposals(contract);
        setTotalProposals(totalProposals);
        
        const firstID = (totalProposals - 1) - (pageNumber - 1)*propsPerPage;
        let lastID = totalProposals - (pageNumber)*propsPerPage;
        if(lastID < 0) lastID = 0;

        if(proposals[0] == firstID) return;
        
        console.log("HP GAP: pageNumber = ", pageNumber);
        console.log("HP GAP: propsPerPage = ", propsPerPage);
        console.log("HP GAP: totalProposals - 1 = ", totalProposals - 1);
        
        setProposals([]);
        for(let i = firstID; i >= lastID; i--){
            console.log("HP GAP: Calling getProposal", i, ", contract)");
            const proposal = await getProposal(i, contract);

            setProposals(allProposals => [...allProposals, proposal]);
        }
    }
   
    const getTotalPages = async(totalProposals) => {
        console.log("HP GTP: Running getTotalPages")

        const totalPages = Math.ceil((totalProposals - 1) / propsPerPage);

        console.log("HP GTP: totalPages = ", totalPages);
        return totalPages;
    }

    
    // Use to begin array loop from most recent proposals first
    // function getTotalProposals() external view returns(uint256 totalProposals);
    const getTotalProposals = async(contract = null) => {
        console.log("HP GTP: Running getTotalProposals");
        
        if(contract === null) contract = await connectContract();
        
        console.log("HP GTP: Calling getTotalProposals");
        const proposalCount = (await contract.getTotalProposals()).toNumber();
        console.log(proposalCount);

        return proposalCount;
    }


    // This will return each Proposal with its dynamically calculated state
    // function getProposal(uint256 propID) external view returns(ProposalData memory proposal); 
    const getProposal = async(propID, contract = null) => {
        console.log("HP GP: Running getProposal");
        if(contract === null){
            contract = await connectContract();
        }
        
        console.log("HP GP: Calling getMemberHasVoted(",userAddress,", ",propID,")");
        const memberHasVoted = await getMemberHasVoted(userAddress, propID);
        
        console.log("HP GP: Calling getProposal(",propID,")");
        let proposal = await contract.getProposal(propID);
        // console.log(proposal);

        proposal = formatProposal(proposal, propID, memberHasVoted);

        return proposal;
    }



    // Returns seconds left on Propose stage, may or may not be useful
    // function getReviewTimeRemaining(uint256 propID) external view returns(uint256 timeRemaining);
    const getReviewTimeRemaining = async(propID) => {
        console.log("HP GRTR: Running getReviewTimeRemaining");
        
        const contract = await connectContract();
        
        
        console.log("HP GRTR: Calling getReviewTimeRemaining");
        const reviewTimeRemaining = (await contract.getReviewTimeRemaining(propID)).toNumber();
        console.log(reviewTimeRemaining);


        return reviewTimeRemaining;
    }



    // Returns seconds left on Vote stage, may or may not be useful
    // function getVoteTimeRemaining(uint256 propID) external view returns(uint256 timeRemaining);
    const getVoteTimeRemaining = async(propID) => {
        console.log("HP GVTR: Running getVoteTimeRemaining");
        
        const contract = await connectContract();
        
        
        console.log("HP GVTR: Calling getVoteTimeRemaining");
        const voteTimeRemaining = (await contract.getVoteTimeRemaining(propID)).toNumber();
        console.log(voteTimeRemaining);


        return voteTimeRemaining;
    }



    // Gets the quorum threshold
    // function getQuorum() external view returns(uint256);
    const getQuorum = async() => {
        console.log("HP GQ: Running getQuorum");
        
        const contract = await connectContract();
        
        
        console.log("HP GQ: Calling getQuorum");
        const quorum = (await contract.getQuorum()).toNumber();
        console.log(quorum);

        setQuorum(quorum);

        return quorum;
    }


    
    // Gets the current grant amount
    // function getGrantAmount() external view returns(uint256);
    const getGrantAmount = async(propID) => {
        console.log("HP GQ: Running getGrantAmount");
        
        const contract = await connectContract();
        
        
        console.log("HP GQ: Calling getGrantAmount");
        const grantAmount = ethers.utils.formatEther(await contract.getGrantAmount());
        console.log(grantAmount);

        return grantAmount;
    }



    // Gets the amount of ETH available for new proposals
    // function availableETH() external view returns(uint256);
    const getAvailableETH = async(propID) => {
        console.log("HP GQ: Running availableETH");
        
        const contract = await connectContract();
        
        
        console.log("HP GQ: Calling availableETH");
        const availableETH = ethers.utils.formatEther(await contract.availableETH());
        console.log(availableETH);

        setAvailableETH(availableETH);

        return availableETH;
    }



    // Returns true if the member has already voted on a Proposal
    // function memberHasVoted(address account, uint256 propID) external view returns(bool);
    const getMemberHasVoted = async(address, propID, contract = null) => {
        console.log("HP GQ: Running memberHasVoted");
        if(contract === null){
            contract = await connectContract();
        }
        
        console.log("HP GQ: Calling memberHasVoted(",address, propID,")");
        const memberHasVoted = await contract.memberHasVoted(address, propID);
        console.log("HP GMHV: memberHasVoted: ", memberHasVoted);


        return memberHasVoted;
    }





    //*** CONTRACT CONNECTION ***\\
    const connectContract = async() => {
        // console.log("HP CC: Running connectContract");
        
        // console.log("HP CC: Getting provider");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // console.log(provider);
        
        // console.log("HP CC: Getting signer");
        const signer = provider.getSigner();
        // console.log(signer);
        
        
        // console.log("HP CC: Getting contract");
        const contract = new ethers.Contract(contractAddress, ABI, signer);
        // console.log(contract);

        return contract;
    }


    const connectWallet = async () => {
        console.log("HP CW: Running connectWallet");
        const address = await props.connectWallet();
        console.log("HP CW: Setting userAddress:");
        console.log(userAddress);
        setUserAddress(address);
        return address;
        // if(window.ethereum && window.ethereum.isMetaMask){
        //     console.log("HP CW: Wallet detected");
    
        //     console.log("HP CW: Getting provider:");
        //     const provider = new ethers.providers.Web3Provider(window.ethereum);
        //     console.log(provider);
    
        //     console.log("HP CW: Requesting accounts");
        //     const accounts = await provider.send("eth_requestAccounts");
        //     console.log(accounts);
    
        //     console.log("HP CW: Getting signer:");
        //     const signer = provider.getSigner();
        //     console.log(signer);
    
        //     console.log("HP CW: Getting userAddress");		
        //     const address = await signer.getAddress();
        //     console.log(address);
            
        //     console.log("HP CW: Setting userAddress");		
        //     setUserAddress(address);

        //     return address;
        // }
    }

    const loadStateVariables = async(userAddress = null) => {
        console.log("HP LSV: Running loadStateVariables");
        await getQuorum();
        await getAvailableETH();
        await getAllProposals(userAddress);
    }


    
    //*** HELPER FUNCTIONS ***\\
    
    const formatProposal = (proposal, propID, memberHasVoted) => {
    // const formatProposal = (proposal, propID, memberHasVoted) => {
        console.log("HP FP: Running formatProposal");
        proposal = {
            proposalID: propID, // Number
            memberHasVoted: memberHasVoted, // Bool
            voteBegins: formatTimestamp(proposal.voteBegins), // Date
            voteEnds: formatTimestamp(proposal.voteEnds), // Date
            votesFor: proposal.votesFor.toNumber(), // Number
            votesAgainst: proposal.votesAgainst.toNumber(), // Number
            memberVoteCount: proposal.memberVoteCount.toNumber(), // Number
            propState: formatPropState(proposal.propState), // Enum
            propType: formatPropType(proposal.propType), // Enum
            recipient: proposal.recipient, // String
            ethGrant: ethers.utils.formatEther(proposal.ethGrant), // ETH Amount
            newETHGrant: ethers.utils.formatEther(proposal.newETHGrant), // ETH Amount
            description: proposal.description, // String
            voteFor: async function() {
                voteFor(propID);
            },
            voteAgainst: async function() {
                voteAgainst(propID);
            },
            execut: async function() {
                execute(propID);
            },
        }
        console.log(proposal);

        return proposal;
    }


    const formatTimestamp = (timestamp) => {
        console.log("HP FT: Running formatTimestamp");
        const date = new Date(timestamp * 1000);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        timestamp = `${day}-${month}-${year} ${hours}:${minutes}`;
        console.log(timestamp);

        return timestamp;
    }

    const formatPropState = (propState) => {
        propState = propState == 0 ? "Unassigned"
            : propState == 1 ? "Pending"
                : propState == 2 ? "Active"
                    : propState == 3 ? "Queued"
                        : propState == 4 ? "Defeated"
                            : propState == 5 ? "Succeeded"
                                : propState == 6 ? "Expired"
                                    : "ERROR: Invalid Proposal State";
        
        return propState;
    }

    const formatPropType = (propType) => {
        propType = propType == 0 ? "Issue Grant"
            : propType == 1 ? "Modify Grant Size"
                : "ERROR: Invalid Proposal Type";

        return propType;
    }
    
    
    
    //*** SETTER FUNCTIONS ***\\

    // function submitNewGrant(address recipient, string memory description) external;

    const submitNewGrant = async() => {
        console.log("HP SNG: Running submitNewGrant");
        const contract = await connectContract();

        const receipt = await contract.submitNewGrant(grantRecipient, description);

        const transaction = await receipt.wait();
        if(transaction.confirmations > 0){
            loadStateVariables();
        }
    }


    // function submitNewAmountChange(uint256 newGrantAmount, string memory description) external;

    const submitNewGrantAmount = async() => {
        console.log("HP SNAC: Running submitNewAmountChange");
        const contract = await connectContract();

        const amount = ethers.utils.parseEther(newGrantAmount);

        const receipt = await contract.submitNewAmountChange(amount, description);

        const transaction = await receipt.wait();
        if(transaction.confirmations > 0){
            loadStateVariables();
        }
    }



    // function voteFor(uint256 propID) external;

    const voteFor = async(propID) => {
        console.log("HP VF: Running voteFor");
        const contract = await connectContract();

        const receipt = await contract.voteFor(propID);

        const transaction = await receipt.wait();
        if(transaction.confirmations > 0){
            loadStateVariables();
        }
    }



    // function voteAgainst(uint256 propID) external;

    const voteAgainst = async(propID) => {
        console.log("HP VA: Running voteAgainst");
        const contract = await connectContract();

        const receipt = await contract.voteAgainst(propID);

        const transaction = await receipt.wait();
        if(transaction.confirmations > 0){
            loadStateVariables();
        }
    }



    // function execute(uint256 propID) external;

    const execute = async(propID) => {
        console.log("HP E: Running execute");
        const contract = await connectContract();

        const receipt = await contract.execute(propID);

        const transaction = await receipt.wait();
        if(transaction.confirmations > 0){
            loadStateVariables();
        }
    }






    //*** UI FUNCTIONS ***\\

    const nextPage = () => {
        setPageNumber(pageNumber + 1);
    }
    
    const prevPage = () => {
        setPageNumber(pageNumber - 1);
    }





    //*** EFFECTS ***\\

    useEffect(() => {
        console.log("HP Effect: pageNumber");
        console.log(pageNumber);
        if(userAddress !== null){
            getAllProposals();
        }
    }, [pageNumber])


    useEffect(() => {
        console.log("HP Effect: proposals updated")
        console.log(proposals)
    }, [proposals])

    
    useEffect(() => {
        console.log("HP Effect: userAddress:");
        console.log(props.userAddress);

        if(userAddress === null && props.userAddress !== null){
            setUserAddress(props.userAddress);
        }
        if(userAddress !== null){
            console.log("HP Effect: Calling loadStateVariables");
            loadStateVariables();
        }
    }, [userAddress, props.userAddress]);


    useEffect(() => {
        window.ethereum.on('accountsChanged', (accounts) => {
            setUserAddress(accounts[0]);
        })
        // connectWallet();
    }, [])



    // useEffect(() => {
    //     console.log(selection);
    // }, [selection]);

    const [selection, setSelection] = useState("");
    const [input, setInput] = useState("");
    const [grantRecipient, setGrantRecipient] = useState("");
    const [description, setDescription] = useState("");
    const [newGrantAmount, setGrantAmount] = useState(0);


    return(
        <div>
            {proposals.length === propsPerPage &&
                <div className="hero">

                    {/* Next Page Button */}
                    {pageNumber > 1 && (
                        <button className="header-cta">
                            <a href="#" onClick={prevPage}>Pagina precedente</a>
                        </button>
                    )}

                    Available Funds: {availableETH} ETH

                    {/* Previous Page Button */}
                    {(pageNumber * propsPerPage) - 1 < totalProposals && (
                        <button className="header-cta">
                            <a href="#" onClick={nextPage}>Pagina successiva</a>
                        </button>
                    )}
                </div>
            }

            <div className="cardPresentation">
                {proposals.map((data) => {
                    return(
                        <ProposalCard ringrazia
                            proposal={data}
                            quorum={quorum}

                            
                            updateData={async() => {
                                return await getProposal(data.proposalID)
                            }}
                        />
                    )
                })}
            </div>

            <div className="SubmissionForm">
                <hr />
                <br />
                <p>FAI LA TUA PROPOSTA... e ringrazia che non so programmare NoWithVETO:</p>
                <br />

                <select className="SubmissionMenu"
                        value={selection}
                        key="selection"
                        onChange={(e) => setSelection(e.target.value)}
                        name="submissionID"
                        id="submissionID">
                            <option key="Default">Seleziona una cazzo di opzione:</option>
                            <option key="NewGrant" value="NewGrant">Proponi un GRANT</option>
                            <option key="ModifyGrantSize" value="ModifyGrantSize">Proponi la quantità del GRANT</option>
                </select>
                <br></br>

                <div className="NewSubmission">

                    <SubmissionCard 
                        selection={selection}
                        recipient={grantRecipient}
                        description={description}
                        grantAmount={newGrantAmount}

                        setGrantAmount={(input) => setGrantAmount(input)}
                        submitNewGrantAmount={async() => submitNewGrantAmount()}

                        setGrantRecipient={(input) => setGrantRecipient(input)}
                        submitNewGrant={async() => submitNewGrant()}

                        setDescription={(input) => setDescription(input)}
                    
                    />
                </div>
            </div>
        </div>
    )
}

export default VotingApp;