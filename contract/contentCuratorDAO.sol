// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./ContentCuratorDAOToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
contract ContentCuratorDAO {
    struct Post{
        uint256 id;
        bool exists;
        uint256 numVotes;
        address [] voters;
        bool votePassed;
        string postIPFSURL;
        string postOwner;
    }

    uint256 numPostsWithVotes;
    address daoTokenAddress;
    address owner;
    mapping(string => Post) private posts;
    mapping(address => string[]) private daoMemberVotes;
    mapping(string => uint256) private postVotes;

    constructor(address _daoTokenAddress){
        daoTokenAddress = _daoTokenAddress;
        owner = msg.sender;
        numPostsWithVotes = 0;
    }

    function mintDAOToken(address user)
    external 
    {
        ContentCuratorDAOToken daoToken = ContentCuratorDAOToken(daoTokenAddress);
        require(daoToken.balanceOf(user)==0, "You already received free tokens, you have to buy more tokens to vote.");
        daoToken.mint(user, 5 ether);
    }

    function mintDAOToken()
    external 
    {
        address user = msg.sender;
        ContentCuratorDAOToken daoToken = ContentCuratorDAOToken(daoTokenAddress);
        require(daoToken.balanceOf(user)==0, "You already received free tokens, you have to buy more tokens to vote.");
        daoToken.mint(user, 5 ether);
    }
    

    function hasDAOToken(address user)
    external
    view
    returns (bool)
        {
            ERC20 token = ERC20(daoTokenAddress);
            uint256 tokenBalance = token.balanceOf(user);
            if(tokenBalance>0) return true;
            return false;
    }

    modifier onlyDAOMember(string memory message) {
        require(this.hasDAOToken(msg.sender), message);
        _;
    }

    function createPost(
        string memory _postIPFSURL,
        string memory _postOwner,
        address _voter
    )
        internal
        returns ( Post storage )
    {
        uint256 postId = numPostsWithVotes++;
        Post storage post = posts[_postOwner];
        post.exists = true;
        post.id = postId;
        post.numVotes = 1;
        post.votePassed = false;
        post.voters = [_voter];
        post.postIPFSURL = _postIPFSURL;
        post.postOwner = _postOwner;
        return post;

    }

    function vote(string memory _postIPFSURL, string memory _postOwner)
        external
        payable
        onlyDAOMember("Only DAO Members are allowed to vote")
    {
        //transfer tokens from buyer to seller
        require(
          ERC20(daoTokenAddress).transferFrom(
            msg.sender,
            address(this),
            1 ether
          ),
          "Transfer of CCD Token from DAO member to contract failed."
        );
        Post storage post = posts[_postIPFSURL];
        if(!post.exists){
            post = createPost(_postIPFSURL, _postOwner, msg.sender);
            posts[_postIPFSURL] = post;
        }else{
            post.numVotes++;
            post.voters.push(msg.sender);
        }
        postVotes[_postIPFSURL] = post.numVotes;
        daoMemberVotes[msg.sender].push(_postIPFSURL);

    }

    
    function getDaoMemberVotes()
    external
    view
    returns ( string[] memory)
    {
        return daoMemberVotes[msg.sender];
    }


    function getPosts(string memory postIPFSURL )
    external
    view
    returns (Post memory){
        return posts[postIPFSURL];
    }

    function getNumPostsWithVotes()
    external
    view
    returns (uint256 postsWithVotes){
        return numPostsWithVotes;
    }

    function getPostVoters(string memory postIPFSURL )
    external
    view
    returns (address [] memory){
        return posts[postIPFSURL].voters;
    }

    function getPostVotes(string memory postIPFSURL )
    external
    view
    returns (uint256){
        return postVotes[postIPFSURL];
    }


    function removeVote(string memory _postIPFSURL)
    external {
        Post memory post = this.getPosts(_postIPFSURL);
        address [] memory voters = post.voters;
        for(uint256 i = 0; i<voters.length; i++){
            if(voters[i]==msg.sender){
                post.numVotes--;
                voters = removeFromAddressArray(voters, i);
            }
        }

    }

    function removeFromAddressArray(address [] memory addrArr , uint256 index)
    internal 
    returns (address [] memory)
    {
        if (index >= addrArr.length) return addrArr;

        for (uint i = index; i<addrArr.length-1; i++){
            addrArr[i] = addrArr[i+1];
        }
        return addrArr;
    }


    
}