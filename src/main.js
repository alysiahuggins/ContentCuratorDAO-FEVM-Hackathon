import Web3 from 'web3'
import BigNumber from "bignumber.js"
import erc20Abi from '../contract/erc20.abi.json'
import contentCuratorDAOAbi from '../contract/contentCuratorDAO.abi.json'
import contentCuratorDAOTokenAbi from '../contract/contentCuratorDAOToken.abi.json'



/** TODOg
 * update shares button
 * show how many shares the user has
 */

const ERC20_DECIMALS = 18

let kit
const MPContractAddress = "0x634cED1A66D18744D44716A741284118B687b061"
const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
const contentCuratorDAOAddress = "0x66880f93c6a64bed43415D4F01043Bf953D7D726"
const contentCuratorDAOTokenAddress = "0xF188BC880974fcbF9C323D4385060e7E9469CA8a"
let contract
let erc20Contract
let properties = []
let web3 
let defaultAccount
let filecoinTestnetID=31415
let bgColor = "#edc0e0"
let hightlightColor = "#FF58EE"
let walletConnected = false;



ethereum.on('chainChanged', (_chainId) => window.location.reload());

const connectMetamaskWallet = async function () {
    if (window.ethereum) {
        notification("⚠️ Please approve this DApp to use it.")
        try{
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            if(parseInt(chainId,16)!=filecoinTestnetID){
                throw "⚠️ Please switch to the Filecoin Wallaby Testnet to use this app."
            }
            
            web3 = new Web3(window.ethereum);

            await window.ethereum.enable();
            notificationOff()

            const accounts = await web3.eth.getAccounts()
            defaultAccount = accounts[0];    
            console.log(`accounts ${accounts}`)

            

        } catch (error) {
            notification(`⚠️ ${error}.`)
          }
        
      }else {
        notification("⚠️ Please install the Metamask.")
      }
  }

  
  let posts = [
    {
      image: "https://pbs.twimg.com/media/FhoePCRUAAA1WLG?format=jpg&name=large",
      description: "Welcoming back Ligma & Johnson!",
      owner: "Elon Musk",
      numVotes: 0,
      status: 0,
      ipfsURL: "ipfs://1"
    },
    {
      image: "https://pbs.twimg.com/media/FhS6MXBUUAYC6y3?format=jpg&name=large",
      description: "Twitter HQ is great (this is a real pic)",
      owner: "Elon Musk",
      numVotes: 0,
      status: 0,
      ipfsURL: "ipfs://2",
    },
    {
      image: "https://pbs.twimg.com/media/Fh6qtzYVUAI5aYv?format=jpg&name=large",
      description: "Just leaving Twitter HQ code review",
      owner: "Elon Musk",
      numVotes: 0,
      status: 0,
      ipfsURL: "ipfs://3",
    }
  ]
  

  

  const getBalance = async function () {
    web3 = new Web3(window.ethereum);

    let balance = await web3.eth.getBalance(defaultAccount);
    console.log(balance);
    document.querySelector("#balance").textContent = parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(2)
  }

  const getDAOTokenBalance = async function () {
    web3 = new Web3(window.ethereum);

    let balance = await erc20Contract.methods.balanceOf(defaultAccount).call();
    console.log(balance);
    document.querySelector("#balance").textContent = parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(2)
  }



  async function renderPosts() {
    console.log(`render posts ${posts.length}`)
    console.log(`get Post Votes`)

    document.getElementById("marketplace").innerHTML = ""
    posts.forEach(async (_post, index) => {
      console.log(_post)
      const _postVotes = await contract.methods.getPostVotes(_post.ipfsURL).call();
      _post.numVotes = _postVotes;
      posts[index] = _post;
      const newDiv = document.createElement("div")
      newDiv.className = "col-md-4"
      newDiv.innerHTML = postsTemplate(_post, index)

      document.getElementById("marketplace").appendChild(newDiv)
    })
  }


  function postsTemplate(_post, index) {
    let viewerIsOwner = _post.owner==defaultAccount
    
      return `
      <div class="card mb-4">
        <img class="card-img-top img-thumbnail" src="${_post.image}" alt="...">
        
        <h4 class="position-absolute top-0 end-0 mt-5 px-2 py-1 rounded-start" style="background-color: ${bgColor};">
          ${_post.numVotes} Votes
        </h4>
        <!--div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${_post.owner}
        </div>
        </div-->
        <h2 class="card-title fs-4 fw-bold mt-2">${_post.owner}</h2>
        <p class="card-text mb-5" style="min-height: 82px">
          ${_post.description}             
        </p>
        
        
        <!--p class="card-text mt-4 ">
          <i class="bi bi-megaphone-fill" ></i>
          <span>${_post.status==0?'More Votes Needed':'Accepted'}</span>
        </p-->
       
        <div class="d-grid gap-2" style="background-color: ${bgColor};" >
          <!-- do not show buy button if property status is not 0 (which means on sale)-->
          <a class="btn btn-lg btn-outline-dark voteBtn fs-6 p-3" style="${_post.status==0?'display:block':'display:none'}" id=${
            index
          }>
            Vote
          </a>
          
        </div>
      </div>
    </div>`
    
              
    
}


  function notification(_text) {
    document.querySelector(".alert").style.display = "block"
    document.querySelector("#notification").textContent = _text
  }
  
  function notificationOff() {
    document.querySelector(".alert").style.display = "none"
  }

  async function isWalletConnected(){
    if(window.ethereum){
      web3 = new Web3(window.ethereum);
      setUpContracts()

      const accounts = await web3.eth.getAccounts()
      if(!accounts){
        // document.getElementById("disconnectButton").style.display="none";
        document.getElementById("connectButton").style.display="none";
        walletConnected = false;
      }else{
        // document.getElementById("disconnectButton").style.display="block";
        document.getElementById("connectButton").style.display="none";
        defaultAccount = accounts[0];    

        walletConnected = true;
        await getDAOTokenBalance();
      }


    }
    
    
  }

  window.addEventListener('load', async () => {
    notification("⌛ Loading...")
    console.log("loading");

    await isWalletConnected();

    // await connectMetamaskWallet()

    // await getBalance()
    await renderPosts()
    console.log(posts)
    notificationOff()
    setButtonClicks()

  });

  function setUpContracts(){
    contract = new web3.eth.Contract(contentCuratorDAOAbi, contentCuratorDAOAddress);
    erc20Contract = new web3.eth.Contract(erc20Abi, contentCuratorDAOTokenAddress)
  }

    /*  Connect Button */
  document.querySelector("#connectButton").addEventListener("click", async (e) => {
        const index = e.target.id
        try{
          await connectMetamaskWallet()
          walletConnected = true;
          // document.getElementById("disconnectButton").style.display="block";
          document.getElementById("connectButton").style.display="none";

          
        } catch (error) {
          notification(`⚠️ ${error.message}.`)
          walletConnected = false;
        }
  })

   /*  Claim Button */
   document.querySelector("#claimButton").addEventListener("click", async (e) => {
    const index = e.target.id
    try{
      const result = await contract.methods
          .mintDAOToken()
          .send({ from: defaultAccount })
      await connectMetamaskWallet()
      document.getElementById("claimButton").style.display="none";

      
    } catch (error) {
      notification(`⚠️ ${error.message}.`)
    }
})


   

//     /*  Disconnect Button */
//     document.querySelector("#disconnectButton").addEventListener("click", async (e) => {
//       const index = e.target.id
//       try{
//         await disconnectMetamaskWallet()
//         walletConnected = false;

//         // document.getElementById("disconnectButton").style.display="none";
//         document.getElementById("connectButton").style.display="block";
        
//       } catch (error) {
//         notification(`⚠️ ${error.message}.`)
//         walletConnected = true;
//       }
// })



 
  
  /* Approve token spender */
  async function approve(amount) {
    const ccdContract = new web3.eth.Contract(erc20Abi, contentCuratorDAOTokenAddress)
    console.log("toApprove")
  
    const result = await ccdContract.methods
      .approve(contentCuratorDAOAddress, amount)
      .send({ from: defaultAccount })
      console.log(result)
    return result
  }

 
function setButtonClicks(){

  document.querySelector("#marketplace").addEventListener("click", async (e) => {
    e.preventDefault();
    console.log('click')
    if (e.target.className.includes("voteBtn")) {
      console.log('let the voting begin')
      const index = e.target.id
      const ipfsURL = posts[index].ipfsURL
      const owner = posts[index].owner
      console.log(index, ipfsURL, owner)

      try{
        let walletBalance = await getDAOTokenBalance()
        console.log(walletBalance)
        if (walletBalance<properties[index].price/properties[index].numShares){
          notification(`You do not have enough CCD to vote`)
          return
        }
      } catch (error) {
        notification(`⚠️ ${error.message}.`)
      }
      


      // notification("⌛ Waiting for payment approval...")
      // try {
      //   await approve(properties[index].price)
      
      // } catch (error) {
      //   notification(`⚠️ ${error}.`)
      // }
      notification(`⌛ Awaiting vote ...`)
    try {
      const result = await contract.methods
        .vote(ipfsURL, owner)
        .send({ from: defaultAccount })
        console.log(result);
      notification(`🎉 You successfully voted "${posts[index].description}".`)
      await renderPosts()
      getDAOTokenBalance()
    } catch (error) {
      notification(`⚠️ ${error.message}.`)
    }
  }
})
}




