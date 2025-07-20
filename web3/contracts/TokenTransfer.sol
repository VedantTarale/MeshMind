// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TokenTransfer {
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Deposit(address indexed user, uint256 amount);
    
    mapping(address => uint256) public balances;
    
    address public owner;
    
    uint256 public totalSupply;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function deposit() external payable {
        require(msg.value > 0, "Must send SEI tokens");
        balances[msg.sender] += msg.value;
        totalSupply += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be greater than 0");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be greater than 0");
        
        balances[msg.sender] -= amount;
        totalSupply -= amount;
        
        payable(msg.sender).transfer(amount);
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
    
    mapping(address => mapping(address => uint256)) public allowances;
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balances[from] >= amount, "Insufficient balance");
        require(allowances[from][msg.sender] >= amount, "Insufficient allowance");
        require(amount > 0, "Amount must be greater than 0");
        
        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}