// NOTES:
//
// 1. script uses hardcoded gasPrice -- CHECK ethgasstation.info

const fs = require('fs');
const Web3 = require('web3');
const web3 =
  new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
//new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));
//new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8546"));

const MYGASPRICE = '' + 1 * 1e9;

function getABI() {
  return JSON.parse(
    fs.readFileSync('../build/Treasury_sol_Treasury.abi').toString() );
}

function getStubABI() {
  return JSON.parse(
    fs.readFileSync('../build/ERC20Stub_sol_ERC20Stub.abi').toString() );
}

function getBinary() {
  var binary =
    fs.readFileSync('../build/Treasury_sol_Treasury.bin').toString();

  if (!binary.startsWith('0x')) binary = '0x' + binary;
  return binary;
}

function getStubBinary() {
  var binary =
    fs.readFileSync('../build/ERC20Stub_sol_ERC20Stub.bin').toString();

  if (!binary.startsWith('0x')) binary = '0x' + binary;
  return binary;
}

function getContract(sca) {
  return new web3.eth.Contract( getABI(), sca );
}

function checkAddr(addr) {
  try {
    let isaddr = parseInt( addr );
  } catch( e ) {
    usage();
    process.exit(1);
  }
}

function shorten(addr) {
  var saddr = "" + addr;
  return "0x" + saddr.substring(26);
}

function printEvent(evt) {

  if (evt.event == 'Added' ) {
    console.log( 'Added:\n\tTrustee: ' + shorten(evt.raw.topics[1] ) );
  }
  else if (evt.event == 'Flagged' ) {
    console.log( "Flagged:\n\tTrustee: " +
                 shorten(evt.raw.topics[1]) +
                 "\n\tisRaised: " +
                 parseInt(evt.raw.data,16) );
  }
  else if (evt.event == 'Replaced' ) {
    console.log( "Replaced:\n\told: " +
                 shorten(evt.raw.topics[1]) +
                 "\n\tnew: " + shorten(evt.raw.topics[2]) );
  }
  else if (evt.event == 'Proposal' ) {
    var decoded = web3.eth.abi.decodeParameters(
                  ["uint256","string"],
                  evt.raw.data );
        
    console.log( "Proposal:\n\trecipient: " +
                 shorten(evt.raw.topics[1]) +
                 "\n\tamount(wei): " + decoded['0'] +
                 "\n\text ref: " + decoded['1'] );
  }
  else if (evt.event == 'TransferProposal' ) {
    var decoded = web3.eth.abi.decodeParameters(
                  ["uint256","string"],
                  evt.raw.data );

    console.log( "TransferProposal:\n\ttoksca: " +
                  shorten(evt.raw.topics[1]) +
                  "\n\tto: " + shorten(evt.raw.topics[2]) +
                  "\n\tqty: " + decoded['0'] +
                  "\n\text ref: " + decoded['1'] );
  }
  else if (evt.event == 'Approved' ) {
    var decoded = web3.eth.abi.decodeParameters(
                  ["uint256","string"],
                  evt.raw.data );

    console.log( "Approved:\n\tapprover: " +
                   shorten(evt.raw.topics[1]) +
                   "receipient: " +
                   shorten(evt.raw.topics[2]) +
                   "amount(wei): " + decoded['0'] +
                   "eref: " + decoded['1'] );
  }
  else if (evt.event == 'TransferApproved' ) {
    var decoded = web3.eth.abi.decodeParameters(
                  ["uint256","string"],
                  evt.raw.data );

    console.log( "TransferApproved:toksca: " +
                   shorten(evt.raw.topics[2]) +
                   "tapprover: " +
                   shorten(evt.raw.topics[1]) +
                   "tto: " +
                   shorten(evt.raw.topics[3]) +
                   "tqty: " + decoded['0'] +
                   "teref: " + decoded['1'] );
  }
  else if (evt.event == 'Spent' ) {
    var decoded = web3.eth.abi.decodeParameters(
                  ["uint256","string"],
                  evt.raw.data );

    console.log( "Spent:receiver: " +
                   shorten(evt.raw.topics[1]) +
                   "teref: " + decoded['1'] );
                   "amount(wei): " + decoded['0'] +

  }
  else if (evt.event == 'Transferred' ) {
    var decoded = web3.eth.abi.decodeParameters(
                  ["uint256","string"],
                  evt.raw.data );

    console.log( "Transfered:\n\ttoksca: " +
                   shorten(evt.raw.topics[1]) +
                   "tto: " + shorten(evt.raw.topics[2]) +
                   "tqty: " + decoded['0'] +
                   "text ref: " + decoded['1'] );
  }
  else {
    console.log( evt );
  }
}

const cmds =
  [
   'deploy',
   'stub',
   'chown',
   'shutdown',
   'events',
   'variables',
   'add',
   'flag',
   'replace',
   'proposal',
   'proposeTransfer',
   'approve',
   'approveTransfer'
  ];

function usage() {
  console.log(
    '\nUsage:\n$ node cli.js <acctindex> <SCA> <command> [arg]*\n',
     'Commands:\n',
     '\tdeploy |\n',
     '\tstub |\n',
     '\tchown <new owner eoa> |\n',
     '\tshutdown |\n',
     '\tevents |\n',
     '\tvariables |\n',
     '\tadd <eoa> |\n',
     '\tflag true,false |\n',
     '\treplace old with new value |\n',
     '\tproposal <payeeeoa> <wei> <eref> |\n',
     '\tproposeTransfer <tokensca> <transfereeeoa> <qty> <eref> |\n',
     '\tapprove <payeeeoa> <wei> <eref>\n',
     '\tapproveTransfer <tokensca> <transfereeeoa> <qty> <eref>\n'
  );
}

let cmd = process.argv[4];

let found = false;
for (let ii = 0; ii < cmds.length; ii++)
  if (cmds[ii] == cmd) found = true;

if (!found) {
  usage();
  process.exit(1);
}

let ebi = process.argv[2]; // etherbaseindex, i.e. use eth.accounts[ebi]
let sca = process.argv[3]; //env is not passed

let eb;
web3.eth.getAccounts().then( (res) => {
    eb = res[ebi];
    if (cmd == 'deploy')
    {
      let con = new web3.eth.Contract( getABI() );

      con
        .deploy({data:getBinary()} )
        .send({from: eb, gas: 1452525, gasPrice: MYGASPRICE}, (err, txhash) => {
          if (err) console.log( err );
        } )
        .on('error', (err) => { console.log("err: ", err); })
        .on('transactionHash', (h) => { console.log( "hash: ", h ); } )
        .on('receipt', (r) => { console.log( 'rcpt: ' + r.contractAddress); } )
        .on('confirmation', (cn, rcpt) => { console.log( 'cn: ', cn ); } )
        .then( (nin) => {
          console.log( "SCA", nin.options.address );
          process.exit(0);
        } );
    }
    else if (cmd == 'stub')
    {
      let con = new web3.eth.Contract( getStubABI() );
      con
        .deploy({data:getStubBinary()} )
        .send({from: eb, gas: 500000, gasPrice: MYGASPRICE})
        .on('error', (err) => { console.log("err: ", err); })
        .on('transactionHash', (h) => { console.log( "hash: ", h ); } )
        .on('receipt', (r) => { console.log( 'rcpt: ' + r.contractAddress); } )
        .on('confirmation', (cn, rcpt) => { console.log( 'cn: ', cn ); } )
        .then( (nin) => {
          console.log( "SCA", nin.options.address )
        } );
    }
    else
    {
      let con = new web3.eth.Contract( getABI(), sca );

      if (cmd == 'chown')
      {
        let addr = process.argv[5];
        checkAddr(addr);
        con.methods.setTreasurer( addr )
                   .send( {from: eb, gas: 30000, gasPrice: MYGASPRICE} )
                .catch( err => { console.log } );
      }

      if (cmd == 'shutdown')
      {
        console.log( 'for your protection: remove comment to closedown()' );
        con.methods.closedown()
                   .send( {from: eb, gas: 21000, gasPrice: MYGASPRICE} )
                .catch( err => { console.log } );
      }

      if (cmd == 'events')
      {
        con.getPastEvents('allEvents', {fromBlock: 0, toBlock: 'latest'})
           .then( (events) =>
        {
          for (var ii = 0; ii < events.length; ii++) {
            printEvent( events[ii] );
          } // end foreach event
        })  // end then
        .catch( err => { console.log } );
      } // end if events command

      if (cmd == 'variables')
      {
        con.methods.treasurer().call().then( (res) => {
          console.log( "treasurer = ", res )
        } )
        .catch( err => { console.log } );

        web3.eth.getBalance( sca ).then( (bal) => {
          console.log( "balance (wei): " + bal )
        } )
        .catch( err => { console.log } );
      }

      if (cmd == 'add')
      {
        let addr = process.argv[5];
        checkAddr(addr);
        con.methods.add( addr )
                   .send( {from: eb, gas: 100000, gasPrice: MYGASPRICE} )
                .catch( err => { console.log } );
      }
      if (cmd == 'flag')
      {
        let addr = process.argv[5];
        checkAddr(addr);
        let arg = process.argv[6].toLowerCase();
        let isRaised = (arg == 'true' || arg.startsWith('t') );

        con.methods.flag( addr, isRaised )
                   .send( {from: eb, gas: 100000, gasPrice: MYGASPRICE} )
                .catch( err => { console.log } );
      }
      if (cmd == 'replace')
      {
        let oldaddr = process.argv[5];
        checkAddr(oldaddr);
        let newaddr = process.argv[6];
        checkAddr(newaddr);
        con.methods.replace( oldaddr, newaddr )
                   .send( {from: eb, gas: 100000, gasPrice: MYGASPRICE} )
                .catch( err => { console.log } );
      }
      if (cmd == 'proposal')
      {
        let payee = process.argv[5];
        checkAddr( payee );
        let wei = process.argv[6];
        let eref = process.argv[7];

        console.log( 'proposal: ' + payee + " " + wei + " " + eref );

        con.methods.proposal( payee, wei, eref )
                   .send( {from: eb, gas: 120000, gasPrice: MYGASPRICE} )
                .catch( (err) => { console.log(err); } );
      }
      if (cmd == 'proposeTransfer')
      {
        let tokensca = process.argv[5];
        checkAddr( tokensca );
        let transferee = process.argv[6]
        checkAddr( transferee );
        let qty = parseInt( process.argv[7] );
        let eref = process.argv[8];

        con.methods.proposeTransfer( tokensca, transferee, qty, eref )
                   .send( {from: eb, gas: 120000, gasPrice: MYGASPRICE} )
                .catch( err => { console.log } );
      }
      if (cmd == 'approve')
      {
        let payee = process.argv[5];
        checkAddr( payee );
        let wei = process.argv[6];
        let eref = process.argv[7];

        con.methods.approve( payee, wei, eref )
                   .send( {from: eb, gas: 120000, gasPrice: MYGASPRICE} )
                .catch( err => { console.log(err); } );
      }
      if (cmd == 'approveTransfer')
      {
        let tokensca = process.argv[5];
        checkAddr( tokensca );
        let transferee = process.argv[6]
        checkAddr( transferee );
        let qty = process.argv[7];
        let eref = process.argv[8];

        con.methods.approveTransfer( tokensca, transferee, qty, eref )
                   .send( {from: eb, gas: 120000, gasPrice: MYGASPRICE} )
                .catch( (err) => { console.log(err) } );
      }

//    process.exit(0);
    }
} );