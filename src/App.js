import React, { Component } from "react";
import {
    Navbar,
    NavbarBrand,
    Nav,
    Container,
    Row,
    Col,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Alert,
} from "reactstrap";
import Loader from "./Loader";
import sha256 from "./sha256";
import logo from "./cyber-quest-white.png";
import "./App.css";

const api = "https://api.blockchain.bengalloway.io";

class App extends Component {
    constructor(props) {
        super(props);
        this.setUser = this.setUser.bind(this);
        this.fetchChain = this.fetchChain.bind(this);
        this.fetchTransactions = this.fetchTransactions.bind(this);
        this.mine = this.mine.bind(this);
        this.send = this.send.bind(this);
        this.recalculateBalance = this.recalculateBalance.bind(this);

        this.state = {
            user: null,
            usernameError: false,
            usernameErrorMessage: "",
            nodes: [],
            balance: 0,
            previousBalance: 0,
            chain: { chain: [] },
            transactions: { unconfirmed_transactions: [] },
            mineStatus: null,
            sendStatus: null,
            sendError: false,
            sendAmount: "",
            sendRecipient: "",
            verifyPreviousProof: "",
            verifyProof: "",
            verifyPreviousHash: "",
            verifyProofHash: "",
            sendRequestInFlight: false,
            mineRequestInFlight: false,
            transactionRequestInFlight: false,
            chainRequestInFlight: false,
            userRequestInFlight: false,
        };
    }
    promiseState = async (state) => new Promise((resolve) => this.setState(state, resolve));

    recalculateBalance() {
        const chain = this.state.chain.chain;
        const transactionList = chain.reduce((accumulator, block) => {
            return [...accumulator, ...block.transactions];
        }, []);
        const creditTransactions = transactionList.filter((transaction) => transaction.recipient === this.state.user);
        const debitTransactions = transactionList.filter((transaction) => transaction.sender === this.state.user);
        const creditAmount = creditTransactions.reduce(
            (accumulator, transaction) => accumulator + transaction.amount,
            0
        );
        const debitAmount = debitTransactions.reduce((accumulator, transaction) => accumulator + transaction.amount, 0);
        const balance = creditAmount - debitAmount;
        this.setState({ previousBalance: this.state.balance, balance });
    }

    setUser() {
        const username = document.getElementById("userEntry").value;
        const re = /^[\w]+$/;
        if (!re.test(username)) {
            this.setState({ usernameError: true, usernameErrorMessage: "Letters and numbers only - no spaces" });
            return false;
        }
        this.setState({ userRequestInFlight: true });
        fetch(`${api}/nodes/register`, {
            method: "POST",
            body: JSON.stringify({ address: username }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((jsonResponse) => {
                if (jsonResponse.message === "New node has been added") {
                    this.setState({
                        user: username,
                        usernameError: false,
                        nodes: jsonResponse.nodes,
                        userRequestInFlight: false,
                    });
                    this.fetchChain();
                    return true;
                } else {
                    this.setState({
                        usernameError: true,
                        usernameErrorMessage: "That name is already taken",
                        userRequestInFlight: false,
                    });
                    return false;
                }
            });
    }
    handleAmountChange = (e) => {
        this.setState({ sendAmount: e.target.value });
    };
    handleRecipientChange = (e) => {
        this.setState({ sendRecipient: e.target.value });
    };
    handleVerifyChange = () => {
        Promise.all([
            this.promiseState({ verifyPreviousProof: document.getElementById("verifyPreviousProof").value }),
            this.promiseState({ verifyProof: document.getElementById("verifyProof").value }),
            this.promiseState({ verifyPreviousHash: document.getElementById("verifyPreviousHash").value }),
        ]).then(() => {
            const verifyProofHash = sha256(
                this.state.verifyPreviousProof + this.state.verifyProof + this.state.verifyPreviousHash
            );
            this.setState({ verifyProofHash });
        });
    };

    fetchChain() {
        this.setState({ chainRequestInFlight: true });
        fetch(`${api}/chain`)
            .then((response) => response.json())
            .then((chain) => this.setState({ chain, chainRequestInFlight: false }))
            .then(() => {
                const divRef = document.getElementById("chain-pre");
                divRef.scrollTop = divRef.scrollHeight;
            })
            .then(this.recalculateBalance);
    }
    fetchTransactions() {
        this.setState({ transactionRequestInFlight: true });
        fetch(`${api}/transactions`)
            .then((response) => response.json())
            .then((transactions) => this.setState({ transactions, transactionRequestInFlight: false }));
    }
    mine() {
        this.setState({ mineStatus: null, mineRequestInFlight: true });
        fetch(`${api}/mine`, {
            method: "POST",
            body: JSON.stringify({ requester: this.state.user }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((response) => new Promise((resolve) => setTimeout(() => resolve(response), 10000))) // Manual 10-second delay
            .then((mineStatus) => this.setState({ mineStatus, mineRequestInFlight: false }))
            .then(() => {
                this.fetchChain();
                this.fetchTransactions();
            });
    }
    send() {
        this.setState({ sendError: false, sendStatus: null });
        if (!(Number(this.state.sendAmount) > 0)) {
            this.setState({ sendError: true, sendStatus: "You haven't entered a valid number" });
            return false;
        }
        if (Number(this.state.sendAmount) > this.state.balance) {
            this.setState({ sendError: true, sendStatus: "You don't have this many coins! Try mining to get some." });
            return false;
        }
        if (this.state.sendRecipient === "") {
            this.setState({ sendError: true, sendStatus: "Who do you want to send these coins to?" });
            return false;
        }
        if (this.state.sendRecipient === this.state.user) {
            this.setState({ sendError: true, sendStatus: "You are trying to send coins to yourself..." });
            return false;
        }
        this.setState({ sendRequestInFlight: true });
        fetch(`${api}/transactions/new`, {
            method: "POST",
            body: JSON.stringify({
                sender: this.state.user,
                recipient: this.state.sendRecipient,
                amount: Number(this.state.sendAmount),
            }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((sendStatus) =>
                this.setState({ sendError: false, sendStatus: sendStatus.message, sendRequestInFlight: false })
            )
            .then(() => this.fetchTransactions());
    }

    render() {
        return (
            <div className="App-root d-flex flex-column justify-content-between">
                <Modal isOpen={this.state.user === null} autoFocus={true} keyboard={false} backdrop="static">
                    <ModalHeader className="heading">Welcome to CyberCoin</ModalHeader>
                    <ModalBody>
                        <label htmlFor="userEntry">Enter a username:&nbsp;</label>
                        <input type="text" id="userEntry" className="mono-font" />
                        <Alert
                            className="mb-0"
                            color="danger"
                            isOpen={this.state.usernameError}
                            toggle={() => this.setState({ usernameError: false, usernameErrorMessage: "" })}
                        >
                            {this.state.usernameErrorMessage}
                        </Alert>
                    </ModalBody>
                    <ModalFooter>
                        {this.state.userRequestInFlight ? (
                            <Loader />
                        ) : (
                            <Button color="success" onClick={this.setUser}>
                                Save and Start
                            </Button>
                        )}
                    </ModalFooter>
                </Modal>
                <Navbar className="header" color="dark" expand="md">
                    <NavbarBrand className="heading text-white" href="/">
                        <img src={logo} className="App-logo" alt="logo" />
                        &nbsp;CyberCoin
                    </NavbarBrand>
                    <Nav className="ml-auto pr-3 text-white d-flex align-items-center" navbar>
                        <span className="heading">Coins:</span> {this.state.balance}
                    </Nav>
                    <Nav className="ml-auto pr-3 text-white" navbar>
                        <span className="heading">User:</span> {this.state.user}
                    </Nav>
                </Navbar>
                <div className="main-content flex-grow-1 flex-shrink-0">
                    <Container fluid>
                        <Row>
                            <Col id="chain-display" sm="7" className="column-height py-3">
                                <Container fluid>
                                    <Row>
                                        <Col sm="12" className="px-1 column-chrome">
                                            <h3 className="heading">Chain</h3>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col
                                            id="chain-pre"
                                            sm="12"
                                            className="panel-height column-overflow border px-0"
                                        >
                                            <pre className="my-0">
                                                {JSON.stringify(this.state.chain.chain, null, 2)}
                                            </pre>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col sm="12" className="py-3 px-0 column-chrome">
                                            {this.state.chainRequestInFlight ? (
                                                <Loader />
                                            ) : (
                                                <Button color="success" onClick={this.fetchChain}>
                                                    Update the chain
                                                </Button>
                                            )}
                                        </Col>
                                    </Row>
                                </Container>
                            </Col>

                            <Col sm="5" className="column-height column-overflow p-3">
                                <h3 className="heading">Commands</h3>
                                <h4>Mine a Block</h4>
                                {this.state.mineRequestInFlight ? (
                                    <Container>
                                        <Row>
                                            <Col sm="4">
                                                <Loader mine={true} />
                                            </Col>
                                            <Col sm="8" className="d-flex flex-column justify-content-center">
                                                <Alert className="mt-2" color="success">
                                                    Mining in progress...
                                                </Alert>
                                            </Col>
                                        </Row>
                                    </Container>
                                ) : (
                                    <Button color="success" onClick={this.mine}>
                                        Mine!
                                    </Button>
                                )}
                                {this.state.mineStatus ? (
                                    <Alert
                                        className="mt-2 mb-0 p-0"
                                        color="success"
                                        toggle={() => this.setState({ mineStatus: null })}
                                    >
                                        <h4 className="alert-heading pt-2 pl-2">{this.state.mineStatus.message}</h4>
                                        <pre className="m-0">
                                            {JSON.stringify(
                                                {
                                                    index: this.state.mineStatus.index,
                                                    previous_proof: this.state.mineStatus.previous_proof,
                                                    proof: this.state.mineStatus.proof,
                                                    previous_hash: this.state.mineStatus.previous_hash,
                                                    transactions_in_block: this.state.mineStatus.transactions.length,
                                                },
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </Alert>
                                ) : null}
                                <hr />
                                <h4>Send Some Coins</h4>
                                <p>
                                    Send{" "}
                                    <input
                                        type="text"
                                        id="amount"
                                        className="mono-font"
                                        value={this.state.sendAmount}
                                        placeholder="some"
                                        onChange={this.handleAmountChange}
                                        size={10}
                                    />{" "}
                                    coins to{" "}
                                    <input
                                        type="text"
                                        id="recipient"
                                        className="mono-font"
                                        value={this.state.sendRecipient}
                                        placeholder="someone"
                                        onChange={this.handleRecipientChange}
                                    />{" "}
                                    &nbsp;
                                    {this.state.sendRequestInFlight ? (
                                        <Loader />
                                    ) : (
                                        <Button color="success" onClick={this.send}>
                                            Send
                                        </Button>
                                    )}
                                </p>
                                <Alert
                                    color={this.state.sendError ? "danger" : "success"}
                                    isOpen={this.state.sendStatus}
                                    toggle={() =>
                                        this.setState({ sendStatus: null, sendAmount: "", sendRecipient: "" })
                                    }
                                >
                                    {this.state.sendStatus}
                                </Alert>
                                <hr />
                                <h4>Unconfirmed Transactions</h4>
                                <pre>{JSON.stringify(this.state.transactions.unconfirmed_transactions, null, 2)}</pre>
                                {this.state.transactionRequestInFlight ? (
                                    <Loader />
                                ) : (
                                    <Button color="success" onClick={this.fetchTransactions}>
                                        Update the transaction list
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    </Container>
                </div>
                <div className="footer px-0 pt-3 pb-1 bg-dark text-white">
                    <Container fluid>
                        <Row>
                            <Col sm="1" className="d-flex align-items-center">
                                <h6 className="heading">Check</h6>
                            </Col>
                            <Col sm="11" className="d-flex align-items-center">
                                <Container fluid>
                                    <Row>
                                        <Col sm="12">
                                            SHA256 hash of (&nbsp;
                                            <input
                                                type="text"
                                                id="verifyPreviousProof"
                                                className="mono-font"
                                                value={this.state.verifyPreviousProof}
                                                placeholder={"previous_proof"}
                                                onInput={this.handleVerifyChange}
                                                size={15}
                                            />
                                            &nbsp;+&nbsp;
                                            <input
                                                type="text"
                                                id="verifyProof"
                                                className="mono-font"
                                                value={this.state.verifyProof}
                                                placeholder={"proof"}
                                                onInput={this.handleVerifyChange}
                                                size={15}
                                            />
                                            &nbsp;+&nbsp;
                                            <input
                                                type="text"
                                                id="verifyPreviousHash"
                                                className="mono-font"
                                                value={this.state.verifyPreviousHash}
                                                placeholder={"previous_hash"}
                                                onInput={this.handleVerifyChange}
                                                size={70}
                                            />
                                            &nbsp;)
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col sm="12" className="py-3">
                                            =&nbsp;
                                            <input
                                                type="text"
                                                className="mono-font"
                                                disabled
                                                value={this.state.verifyProofHash}
                                                size={70}
                                            />
                                        </Col>
                                    </Row>
                                </Container>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        );
    }
}

export default App;
