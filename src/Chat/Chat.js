import { BrowserRouter as Router, Switch, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI from "./ChatABI.json";

import ChatCard from "./ChatCard.js";
import "./Chat.css";

import "../App.css";

function Chat(props) {

  const [message, setMessage] = useState("");
  const [allChats, setAllChats] = useState([]);
  const [pagination, setPagination] = useState(0);
  const [NFT, setNFT] = useState(0);
  const [NFTlist, setNFTlist] = useState([]);


  const connectContract = () => {
    console.log("Chat GM: Running connectContract");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract("0x333C9bC2146e93dC84fe00f7F9D6b5B5c07c914E", ABI, signer);

    return contract;
  }

  const sendMessage = async () => {
    console.log("Chat GM: Running sendMessage");
    const contract = connectContract();
    
    const receipt = await contract.addMessage(message, NFT);
    const transaction = await receipt.wait();

    if(transaction.confirmations > 0){
        await getMessages();
    }
  }

  const getMessages = async () => {
    console.log("Chat GM: Running getMessages");
    const contract = connectContract();

    const totalMessage = await contract.totalMessages();
    const page = 10;

    const amountOfNFTs = await contract.balanceOf(props.userAddress);

    setNFTlist([]);
    for (i = 0; i < amountOfNFTs; i++) {
      console.log("Chat GM: Calling contract.tokenOfOwnerByIndex");
      const currentNFT = await contract.tokenOfOwnerByIndex(props.userAddress, i);
      console.log(currentNFT.toNumber());
      setNFTlist(old => [...old, currentNFT]);
        
    }
    
    const starting = totalMessage - (page * pagination) -1;
    setAllChats([]);

    console.log("Chat GM: allChats:")
    console.log(allChats)

    for (var i = starting; i > starting - page; i--) {
        
      if (i >= 0) {
        console.log("Chat GM: Calling contract.getMessages(",i,")");
        const currentMessage = await contract.Messages(i);
        console.log(currentMessage);
        
        console.log("Chat GM: Calling contract.tokenURI(",currentMessage.nftID,")");
        const tokenURI = await contract.tokenURI(currentMessage.nftID);
        console.log(tokenURI);

        const entireMessage = {
          text: currentMessage.message,
          data: currentMessage.sender,
          image: tokenURI
        }

        setAllChats(prevChat => [...prevChat, currentMessage]);
      }
    }
    console.log("Chat GM: Setting getMessagesLocked = false")
    getMessagesLocked = false;
  }

  const mint = async () => {
    const contract = connectContract();
    const price = await contract.price();
    console.log(price);

    const receipt = await contract.safeMint({ value: price });
    const transaction = await receipt.wait();

    if(transaction.confirmations > 0){
        await getMessages();
    }
  }
  
  let getMessagesLocked = false;

  
  useEffect(() => {
    console.log("Chat Effect: pagination")
    console.log(pagination)
    
    console.log("Chat Effect: getMessagesLocked:")
    console.log(getMessagesLocked)
    if(getMessagesLocked) return;

    if(getMessagesLocked === false && allChats.length === 0){
      console.log("Chat Effect: Setting getMessagesLocked = true")
      getMessagesLocked = true;
      
      console.log("Chat Effect: Calling getMessages");
      getMessages();
    }
  }, [pagination]);


  const back = async () => {
    console.log("PaginationOld: " + pagination)
    setPagination(old => old + 1)
    getMessages()
    console.log("Pagination: " + pagination)
  }

  const forward = async () => {
    if (pagination != 0) {
      setPagination(old => old - 1)
      getMessages()
      console.log("Pagination: " + pagination)
    }
      
  }


    return (
      <section>
        <div className="hero">
        {allChats.map((item) => (
            <ChatCard


              text={item.message} 
              data={item.sender} 
              image={item.image}

              

              /*<button class="header-cta"><a onClick={setPagination((old)=> old-1)} href="#">back</a></button>
              <button class="header-cta"><a onClick={setPagination((old) => old + 1)} href="#">forward</a></button> */
            />
        ))}
          <div className="SubmissionForm">
            <br />
            <hr />
            <br />
            <div className="DescriptionStyle DescriptionFont">
              <textarea 
                  className="DescriptionBox"
                  type="text"
                  
                  value={message}
                  placeholder="Sentiti libero di parlare dei problemi che ti affligono per aver mintato questi NFT..."
                  onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <p>Seleziona il tuo NFT e chatta con altri disagiati come te:</p>
            <select className="SubmissionMenu" onChange={ (e) => setNFT(e.target.value)} name="NFTid" id="NFTid">
              {NFTlist.map((item) => (
                  <option key={item.toString()} value={item.toString()}> {item.toString()}</option>
              ))}
            </select>
            <button onClick={sendMessage} className="ButtonStyle sendButton"><a href="#">INVIA</a></button>
            <button onClick={mint} className="ButtonStyle"><a href="#">MINT</a></button>
          </div>
          <br />
          <br />
          <br />
          <br />
          <br />
        </div>
      </section> 
    );
}

export default Chat;


