import React from "react";
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

import css from "./Marketplace.css";
import MarketplaceABI from "./MarketplaceABI.json";
import USDCABI from "./USDCABI.json";
import USDTABI from "./USDTABI.json";
import TokenABI from "./IERC20.json";
import ProductCard from "./ProductCard.js";
import gatto1 from "./gatto1.png";
import gatto2 from "./gatto2.png";
import gatto3 from "./gatto3.png";

function Marketplace(props) {
    const marketplaceAddress = "0x9AC7F15D2E05c9cCAae38d2b409969fd0E9cAc71";
    const usdcAddress = "0x93C0689f4834D2e1b28142261Ab40B9E7eE16bD6";
    const usdtAddress = "0xB0d4C974DFB17fED8424b63753ca33342CEBFB13";

    const [bought, setBought] = useState(false);
    const [stablecoinPrice, setPrice] = useState(null);

    const connectContract = (contractAddress, contractABI) => {
        console.log("HP CM: Running connectMarketplace");
        
        console.log("HP CM: Getting provider");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log(provider);
        
        console.log("HP CM: Getting signer");
        const signer = provider.getSigner();
        console.log(signer);
        
        
        console.log("HP CM: Getting contract");
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        console.log(contract);

        return contract;
    }

    const connectUSDC = () => {
        console.log("HP CUSDC: Running connectUSDC");
        const contract = connectContract(usdcAddress, USDCABI);

        return contract;
    }

    const connectUSDT = () => {
        console.log("HP CUSDC: Running connectUSDC");
        const contract = connectContract(usdtAddress, USDTABI);

        return contract;
    }

    const connectMarketplace = () => {
        console.log("HP CUSDC: Running connectUSDC");
        const contract = connectContract(marketplaceAddress, MarketplaceABI);

        return contract;
    }


    const checkBought = async () => {
        const contract = connectMarketplace();

        const bought = await contract.alreadyBought(props.userAddress);

        setBought(bought);
        console.log(bought);
    }


    const payInETH = async () => {
        const contract = connectMarketplace();
        const balance = props.userBalance;

        const formattedBalance = ethers.utils.formatEther(balance);
        console.log(formattedBalance);

        const ethPrice = await contract.priceInETH();
        const formattedPrice = ethers.utils.formatEther(ethPrice);

        if (formattedBalance < formattedPrice){
            alert("Insufficient ETH: " + formattedBalance + " < " + formattedPrice);
            return;
        }

        console.log("Calling Marketplace.payInETH{value: ",formattedPrice,"}");
        const receipt = await contract.payInETH({ value: ethPrice });

        const transaction = await receipt.wait();
        if (transaction.confirmations > 0) await checkBought();
    }

    const payInUSDC = async () => {
        const tokenContract = connectUSDC();
        const marketContract = connectMarketplace();

        const userUSDCBalance = (await tokenContract.balanceOf(props.userAddress)).toNumber();
        const userUSDCAllowance = (await tokenContract.allowance(props.userAddress, marketplaceAddress)).toNumber();
        const stablecoinPrice = (await marketContract.itemPrice()).toNumber();

        console.log("Market PIUSDC: userUSDCBalance:", userUSDCBalance)
        console.log("Market PIUSDC: userUSDCAllowance:", userUSDCAllowance)
        console.log("Market PIUSDC: stablecoinPrice:", stablecoinPrice);

        console.log("Market PIUSDC: Checking Balance:")
        if (userUSDCBalance < stablecoinPrice) {
            alert("Insufficient USDC: " + userUSDCBalance + " < " + stablecoinPrice);
            return;
        }
        
        console.log("Market PIUSDC: Checking Allowance:")
        if (userUSDCAllowance < stablecoinPrice) {
            console.log("Market PIUSDC: Calling contract.approve(",marketplaceAddress, stablecoinPrice,")");
            const receipt = await tokenContract.approve(marketplaceAddress, stablecoinPrice);

            const transaction = await receipt.wait();
            if (transaction.confirmations > 0) {
                await payInUSDC();
                return;
            }
        }

        console.log("Market PIUSDC: Calling contract.payInUSDC")
        const receipt = await marketContract.payInUSDC();

        const transaction = await receipt.wait();
        if (transaction.confirmations > 0) await checkBought();
    }

    const payInUSDT = async () => {
        const tokenContract = connectUSDT();
        const marketContract = connectMarketplace();

        const userUSDTBalance = (await tokenContract.balanceOf(props.userAddress)).toNumber();
        const userUSDTAllowance = (await tokenContract.allowance(props.userAddress, marketplaceAddress)).toNumber();
        const stablecoinPrice = (await marketContract.itemPrice()).toNumber();

        console.log("Market PIUSDT: userUSDTBalance:", userUSDTBalance)
        console.log("Market PIUSDT: userUSDTAllowance:", userUSDTAllowance)
        console.log("Market PIUSDT: stablecoinPrice:", stablecoinPrice);

        console.log("Market PIUSDT: Checking Balance:")
        if (userUSDTBalance < stablecoinPrice) {
            alert("Insufficient USDT: " + userUSDTBalance + " < " + stablecoinPrice);
            return;
        }

        console.log("Market PIUSDT: Checking Allowance:")
        if (userUSDTAllowance < stablecoinPrice) {
            console.log("Market PIUSDT: Calling contract.approve(",marketplaceAddress, stablecoinPrice,")");
            const receipt = await tokenContract.approve(marketplaceAddress, stablecoinPrice);

            const transaction = await receipt.wait();
            if (transaction.confirmations > 0) {
                await payInUSDT();
                return;
            }
        }

        console.log("Market PIUSDT: Calling contract.payInUSDT")
        const receipt = await marketContract.payInUSDT();

        const transaction = await receipt.wait();
        if (transaction.confirmations > 0) await checkBought();
    }
    

    const [ethPrice, setETHPrice] = useState(null);

    const getPrices = async () => {
        console.log("Market GP: Running getPrices")
        const contract = connectMarketplace();
        
        console.log("Market GP: Calling contract.itemPrice:")
        const stablecoinPrice = (await contract.itemPrice()).toNumber();
        const formattedStablecoinPrice = "$" + (stablecoinPrice / (10**6)).toFixed(2);
        console.log(formattedStablecoinPrice);
        
        console.log("Market GP: Calling contract.getETHPrice:")
        const ethPrice = ethers.utils.formatEther((await contract.priceInETH()));
        const formattedETHPrice = parseFloat(ethPrice).toFixed(7) + " ETH";
        console.log(formattedETHPrice);

        setPrice(formattedStablecoinPrice);
        setETHPrice(formattedETHPrice);
    }

    useEffect(() => {
        getPrices();
        checkBought();
    }, []);

    return (
        <div>
            <main>
                <section className="cards">

                    <ProductCard 
                        name="GATTO DI MERDA 1" 
                        imageURL={gatto1} 
                        description="Immagine del cazzo creata con l'IA perchè va di moda" 
                        stablecoinPrice={stablecoinPrice}
                        
                        bought={bought}
                        
                        payInUSDC={async () => payInUSDC()}
                        payInUSDT={async () => payInUSDT()} 
                    />

                    <ProductCard 
                        name="GATTO DI MERDA 2" 
                        imageURL={gatto2} 
                        description="Immagine del cazzo creata con l'IA, da qualcuno che ci ha spesso soldi"
                        stablecoinPrice={stablecoinPrice}
                        
                        bought={bought}
                        
                        payInUSDC={async () => payInUSDC()}
                        payInUSDT={async () => payInUSDT()} 
                    />

                    <ProductCard 
                        name="GATTO DI MERDA 3" 
                        imageURL={gatto3} 
                        description="E chi ci ha spesso soldi con tutto quello che poteva creare, ha creato dei fottuti gatti... BRUH"
                        stablecoinPrice={stablecoinPrice}
                        
                        bought={bought}
                        
                        payInUSDC={async () => payInUSDC()}
                        payInUSDT={async () => payInUSDT()} 
                    />

                </section>

            </main>

        </div>


    );



}

export default Marketplace;