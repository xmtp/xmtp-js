function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

import { Web3Provider } from '@ethersproject/providers';
import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletLink from 'walletlink';
var web3Provider;
var selectedAddress;
var infuraId = process.env.INFURA_ID;
var infuraRpcUrl = "".concat(process.env.INFURA_RPC_URL).concat(infuraId);
var METAMASK = 'METAMASK';
var WALLET_CONNECT = 'WALLET_CONNECT';
var WALLET_LINK = 'WALLET_LINK';

//
function setWeb3Provider(_x) {
  return _setWeb3Provider.apply(this, arguments);
}

function _setWeb3Provider() {
  _setWeb3Provider = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(connectorProvider) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (connectorProvider) {
              _context.next = 2;
              break;
            }

            throw new Error("You must provide a connector provider");

          case 2:
            _context.prev = 2;
            _context.next = 5;
            return new Web3Provider(connectorProvider);

          case 5:
            web3Provider = _context.sent;
            _context.next = 11;
            break;

          case 8:
            _context.prev = 8;
            _context.t0 = _context["catch"](2);
            throw new Error("Unable to set web3 provider.");

          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[2, 8]]);
  }));
  return _setWeb3Provider.apply(this, arguments);
}

function setSelectedAddress(_x2) {
  return _setSelectedAddress.apply(this, arguments);
}

function _setSelectedAddress() {
  _setSelectedAddress = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(provider) {
    var accounts;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (provider) {
              _context2.next = 2;
              break;
            }

            throw new Error("You must pass a provider to get a list of accounts");

          case 2:
            _context2.prev = 2;
            _context2.next = 5;
            return provider.send('eth_requestAccounts', []);

          case 5:
            accounts = _context2.sent;
            selectedAddress = accounts[0];
            _context2.next = 12;
            break;

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2["catch"](2);
            throw new Error("We were unable to retrieve your account(s). \n Reason: ".concat(_context2.t0.message));

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[2, 9]]);
  }));
  return _setSelectedAddress.apply(this, arguments);
}

function getWeb3Provider() {
  return web3Provider;
}

function getWeb3Signer() {
  if (!web3Provider) {
    throw new Error("You must connect a wallet first");
  }

  return web3Provider.getSigner(); // @TODO(fw): do we need to call "unlock" for locked accounts here?
  // https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/json-rpc-provider.ts#L277
}

function getAccountAddress() {
  return selectedAddress;
} // @TODO(fw): following convo with Martin, we probably just need to check
// for existence of the ID key, then otherwise listen to wallet events for
// connection status
//
// //type GetSignerType = () => ??
// //function getSigner() {}
// /**
//  * [checkAuthStatus check whether wallet is connected]
//  * @param {object} Web3Provider - ethersjs-wrappped Ethereum provider
//  */
// type CheckConnectionStatus = (provider: Web3Provider) => boolean;
// function checkConnectionStatus(fn: CheckConnectionStatus) {
//   if (!provider) {
//     throw new Error("You must pass a provider to check connection status");
//   }
// }
//

/**
 * [addConnectorProviderEvents ethers providers do not implement or expose the underlying
 * EIP-1193 events :/, so in order to listen for accountChange, disconnect, etc, we need to
 * attach event listeners on the underlying wallet connector provider]
 * @param {[type]} provider [wallet connector provider]
 */


function addConnectorProviderEvents(provider) {
  // Subscribe to accounts change
  provider.on("accountsChanged", function (accounts) {
    // @TODO(fw): given the API, what's our response here?
    console.log(accounts);
  }); // Subscribe to chainId change

  provider.on("chainChanged", function (chainId) {
    // @TODO(fw): given the API, what's our response here?
    console.log(chainId);
  }); // Subscribe to session disconnection

  provider.on("disconnect", function (code, reason) {
    // @TODO(fw): given the API, what's our response here?
    console.log(code, reason);
  });
}
/**
 * [connectWallet: connect a wallet via one of the supported connectors]
 * @param {union} connectorType [currently, one of 'metamask', 'walletConnect', 'walletLink']
 * @return {string} user account address
 */


function connectWallet(_x3) {
  return _connectWallet.apply(this, arguments);
}

function _connectWallet() {
  _connectWallet = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(connectorType) {
    var connectorProvider, walletLink;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!selectedAddress) {
              _context3.next = 2;
              break;
            }

            return _context3.abrupt("return", selectedAddress);

          case 2:
            _context3.t0 = connectorType;
            _context3.next = _context3.t0 === METAMASK ? 5 : _context3.t0 === WALLET_CONNECT ? 7 : _context3.t0 === WALLET_LINK ? 9 : 12;
            break;

          case 5:
            connectorProvider = window.ethereum;
            return _context3.abrupt("break", 13);

          case 7:
            connectorProvider = new WalletConnectProvider({
              infuraId: infuraId
            });
            return _context3.abrupt("break", 13);

          case 9:
            walletLink = new WalletLink({
              appName: process.env.APP_NAME || '',
              appLogoUrl: process.env.APP_LOGO_URL || '',
              darkMode: false
            });
            connectorProvider = walletLink.makeWeb3Provider(infuraRpcUrl, parseInt(process.env.ETH_CHAIN_ID || '', 10));
            return _context3.abrupt("break", 13);

          case 12:
            throw new Error("Please provide a wallet connector type");

          case 13:
            addConnectorProviderEvents(connectorProvider);
            _context3.next = 16;
            return setWeb3Provider(connectorProvider);

          case 16:
            _context3.next = 18;
            return setSelectedAddress(getWeb3Provider());

          case 18:
            if (selectedAddress) {
              _context3.next = 20;
              break;
            }

            throw new Error("There was an unknown error connecting wallet. Please try again.");

          case 20:
            return _context3.abrupt("return", selectedAddress);

          case 21:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _connectWallet.apply(this, arguments);
}

function changeAccount() {
  return _changeAccount.apply(this, arguments);
}

function _changeAccount() {
  _changeAccount = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            console.log("user requesting to change selected account"); // @TODO

          case 1:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _changeAccount.apply(this, arguments);
}

function changeChain() {
  return _changeChain.apply(this, arguments);
} // @TODO(fw) - sync w/Martin


function _changeChain() {
  _changeChain = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            console.log("user requesting to change selected chain"); // @TODO

          case 1:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _changeChain.apply(this, arguments);
}

function generateIdentitySignature() {
  if (!web3Provider) {
    return;
  }

  var signer = getWeb3Signer();
  console.log(signer);
}

function disconnectWallet() {
  // "disconnect" just means revoking a signer/signatures, so we just need
  // to clear whatever storage we're using to hold those...assuming we want
  // to provide this functionality at the dapp-level (people can disconnect
  // from their wallet UIs directly in most cases).
  console.log("disconnect");
  selectedAddress = undefined;
  web3Provider = undefined;
}

export var XMTPAuth = {
  changeAccount: changeAccount,
  changeChain: changeChain,
  connectWallet: connectWallet,
  disconnectWallet: disconnectWallet,
  generateIdentitySignature: generateIdentitySignature,
  getAccountAddress: getAccountAddress,
  getWeb3Provider: getWeb3Provider,
  getWeb3Signer: getWeb3Signer
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6WyJXZWIzUHJvdmlkZXIiLCJXYWxsZXRDb25uZWN0UHJvdmlkZXIiLCJXYWxsZXRMaW5rIiwid2ViM1Byb3ZpZGVyIiwic2VsZWN0ZWRBZGRyZXNzIiwiaW5mdXJhSWQiLCJwcm9jZXNzIiwiZW52IiwiSU5GVVJBX0lEIiwiaW5mdXJhUnBjVXJsIiwiSU5GVVJBX1JQQ19VUkwiLCJNRVRBTUFTSyIsIldBTExFVF9DT05ORUNUIiwiV0FMTEVUX0xJTksiLCJzZXRXZWIzUHJvdmlkZXIiLCJjb25uZWN0b3JQcm92aWRlciIsIkVycm9yIiwic2V0U2VsZWN0ZWRBZGRyZXNzIiwicHJvdmlkZXIiLCJzZW5kIiwiYWNjb3VudHMiLCJtZXNzYWdlIiwiZ2V0V2ViM1Byb3ZpZGVyIiwiZ2V0V2ViM1NpZ25lciIsImdldFNpZ25lciIsImdldEFjY291bnRBZGRyZXNzIiwiYWRkQ29ubmVjdG9yUHJvdmlkZXJFdmVudHMiLCJvbiIsImNvbnNvbGUiLCJsb2ciLCJjaGFpbklkIiwiY29kZSIsInJlYXNvbiIsImNvbm5lY3RXYWxsZXQiLCJjb25uZWN0b3JUeXBlIiwid2luZG93IiwiZXRoZXJldW0iLCJ3YWxsZXRMaW5rIiwiYXBwTmFtZSIsIkFQUF9OQU1FIiwiYXBwTG9nb1VybCIsIkFQUF9MT0dPX1VSTCIsImRhcmtNb2RlIiwibWFrZVdlYjNQcm92aWRlciIsInBhcnNlSW50IiwiRVRIX0NIQUlOX0lEIiwiY2hhbmdlQWNjb3VudCIsImNoYW5nZUNoYWluIiwiZ2VuZXJhdGVJZGVudGl0eVNpZ25hdHVyZSIsInNpZ25lciIsImRpc2Nvbm5lY3RXYWxsZXQiLCJ1bmRlZmluZWQiLCJYTVRQQXV0aCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLFNBQVNBLFlBQVQsUUFBNEMsMEJBQTVDO0FBQ0EsT0FBT0MscUJBQVAsTUFBa0MsOEJBQWxDO0FBQ0EsT0FBT0MsVUFBUCxNQUErQyxZQUEvQztBQUdBLElBQUlDLFlBQUo7QUFD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dEJDLEVBQUFBLGFBQWEsRUFBYkE7QUFSc0IsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXZWIzUHJvdmlkZXIsIEpzb25ScGNTaWduZXIgfSBmcm9tICdAZXRoZXJzcHJvamVjdC9wcm92aWRlcnMnO1xuaW1wb3J0IFdhbGxldENvbm5lY3RQcm92aWRlciBmcm9tICdAd2FsbGV0Y29ubmVjdC93ZWIzLXByb3ZpZGVyJztcbmltcG9ydCBXYWxsZXRMaW5rLCB7IFdhbGxldExpbmtQcm92aWRlciB9IGZyb20gJ3dhbGxldGxpbmsnO1xuXG5kZWNsYXJlIGxldCB3aW5kb3c6IGFueTtcbmxldCB3ZWIzUHJvdmlkZXI6IEluc3RhbmNlVHlwZTx0eXBlb2YgV2ViM1Byb3ZpZGVyPiB8IHVuZGVmaW5lZDtcbmxldCBzZWxlY3RlZEFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuY29uc3QgaW5mdXJhSWQgPSBwcm9jZXNzLmVudi5JTkZVUkFfSUQ7XG5jb25zdCBpbmZ1cmFScGNVcmwgPSBgJHtwcm9jZXNzLmVudi5JTkZVUkFfUlBDX1VSTH0ke2luZnVyYUlkfWA7XG5cbmNvbnN0IE1FVEFNQVNLID0gJ01FVEFNQVNLJztcbmNvbnN0IFdBTExFVF9DT05ORUNUID0gJ1dBTExFVF9DT05ORUNUJztcbmNvbnN0IFdBTExFVF9MSU5LID0gJ1dBTExFVF9MSU5LJztcblxudHlwZSBXYWxsZXRDb25uZWN0b3IgPSB0eXBlb2YgTUVUQU1BU0sgfCB0eXBlb2YgV0FMTEVUX0NPTk5FQ1QgfCB0eXBlb2YgV0FMTEVUX0xJTks7XG5cbi8vXG5hc3luYyBmdW5jdGlvbiBzZXRXZWIzUHJvdmlkZXIoY29ubmVjdG9yUHJvdmlkZXI6IHR5cGVvZiB3aW5kb3cuZXRoZXJldW0gfCBJbnN0YW5jZVR5cGU8dHlwZW9mIFdhbGxldENvbm5lY3RQcm92aWRlcj4gfCBJbnN0YW5jZVR5cGU8dHlwZW9mIFdhbGxldExpbmtQcm92aWRlcj4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFjb25uZWN0b3JQcm92aWRlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IHByb3ZpZGUgYSBjb25uZWN0b3IgcHJvdmlkZXJcIik7XG4gIH1cblxuICB0cnkge1xuICAgIHdlYjNQcm92aWRlciA9IGF3YWl0IG5ldyBXZWIzUHJvdmlkZXIoY29ubmVjdG9yUHJvdmlkZXIpO1xuICB9IGNhdGNoKGVycikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byBzZXQgd2ViMyBwcm92aWRlci5cIik7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2V0U2VsZWN0ZWRBZGRyZXNzKHByb3ZpZGVyOiBJbnN0YW5jZVR5cGU8dHlwZW9mIFdlYjNQcm92aWRlcj4gfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFwcm92aWRlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IHBhc3MgYSBwcm92aWRlciB0byBnZXQgYSBsaXN0IG9mIGFjY291bnRzXCIpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBhY2NvdW50cyA9IGF3YWl0IHByb3ZpZGVyLnNlbmQoJ2V0aF9yZXF1ZXN0QWNjb3VudHMnLCBbXSk7XG4gICAgc2VsZWN0ZWRBZGRyZXNzID0gYWNjb3VudHNbMF07XG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgLy8gSWYgdXNlciBkZW5pZXMgcmVxdWVzdCwgd2lsbCByZXR1cm4gNDAwMSBlcnJvclxuICAgIHRocm93IG5ldyBFcnJvcihgV2Ugd2VyZSB1bmFibGUgdG8gcmV0cmlldmUgeW91ciBhY2NvdW50KHMpLiBcXG4gUmVhc29uOiAke2Vyci5tZXNzYWdlfWApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFdlYjNQcm92aWRlcigpOiBJbnN0YW5jZVR5cGU8dHlwZW9mIFdlYjNQcm92aWRlcj4gfCB1bmRlZmluZWQge1xuICByZXR1cm4gd2ViM1Byb3ZpZGVyO1xufVxuXG5mdW5jdGlvbiBnZXRXZWIzU2lnbmVyKCk6IEluc3RhbmNlVHlwZTx0eXBlb2YgSnNvblJwY1NpZ25lcj4ge1xuICBpZiAoIXdlYjNQcm92aWRlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IGNvbm5lY3QgYSB3YWxsZXQgZmlyc3RcIik7XG4gIH1cbiAgcmV0dXJuIHdlYjNQcm92aWRlci5nZXRTaWduZXIoKTtcbiAgLy8gQFRPRE8oZncpOiBkbyB3ZSBuZWVkIHRvIGNhbGwgXCJ1bmxvY2tcIiBmb3IgbG9ja2VkIGFjY291bnRzIGhlcmU/XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ldGhlcnMtaW8vZXRoZXJzLmpzL2Jsb2IvbWFzdGVyL3BhY2thZ2VzL3Byb3ZpZGVycy9zcmMudHMvanNvbi1ycGMtcHJvdmlkZXIudHMjTDI3N1xufVxuXG5mdW5jdGlvbiBnZXRBY2NvdW50QWRkcmVzcygpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gc2VsZWN0ZWRBZGRyZXNzO1xufVxuXG4vLyBAVE9ETyhmdyk6IGZvbGxvd2luZyBjb252byB3aXRoIE1hcnRpbiwgd2UgcHJvYmFibHkganVzdCBuZWVkIHRvIGNoZWNrXG4vLyBmb3IgZXhpc3RlbmNlIG9mIHRoZSBJRCBrZXksIHRoZW4gb3RoZXJ3aXNlIGxpc3RlbiB0byB3YWxsZXQgZXZlbnRzIGZvclxuLy8gY29ubmVjdGlvbiBzdGF0dXNcbi8vXG4vLyAvL3R5cGUgR2V0U2lnbmVyVHlwZSA9ICgpID0+ID8/XG4vLyAvL2Z1bmN0aW9uIGdldFNpZ25lcigpIHt9XG4vLyAvKipcbi8vICAqIFtjaGVja0F1dGhTdGF0dXMgY2hlY2sgd2hldGhlciB3YWxsZXQgaXMgY29ubmVjdGVkXVxuLy8gICogQHBhcmFtIHtvYmplY3R9IFdlYjNQcm92aWRlciAtIGV0aGVyc2pzLXdyYXBwcGVkIEV0aGVyZXVtIHByb3ZpZGVyXG4vLyAgKi9cbi8vIHR5cGUgQ2hlY2tDb25uZWN0aW9uU3RhdHVzID0gKHByb3ZpZGVyOiBXZWIzUHJvdmlkZXIpID0+IGJvb2xlYW47XG4vLyBmdW5jdGlvbiBjaGVja0Nvbm5lY3Rpb25TdGF0dXMoZm46IENoZWNrQ29ubmVjdGlvblN0YXR1cykge1xuLy8gICBpZiAoIXByb3ZpZGVyKSB7XG4vLyAgICAgdGhyb3cgbmV3IEVycm9yKFwiWW91IG11c3QgcGFzcyBhIHByb3ZpZGVyIHRvIGNoZWNrIGNvbm5lY3Rpb24gc3RhdHVzXCIpO1xuLy8gICB9XG4vLyB9XG4vL1xuXG4vKipcbiAqIFthZGRDb25uZWN0b3JQcm92aWRlckV2ZW50cyBldGhlcnMgcHJvdmlkZXJzIGRvIG5vdCBpbXBsZW1lbnQgb3IgZXhwb3NlIHRoZSB1bmRlcmx5aW5nXG4gKiBFSVAtMTE5MyBldmVudHMgOi8sIHNvIGluIG9yZGVyIHRvIGxpc3RlbiBmb3IgYWNjb3VudENoYW5nZSwgZGlzY29ubmVjdCwgZXRjLCB3ZSBuZWVkIHRvXG4gKiBhdHRhY2ggZXZlbnQgbGlzdGVuZXJzIG9uIHRoZSB1bmRlcmx5aW5nIHdhbGxldCBjb25uZWN0b3IgcHJvdmlkZXJdXG4gKiBAcGFyYW0ge1t0eXBlXX0gcHJvdmlkZXIgW3dhbGxldCBjb25uZWN0b3IgcHJvdmlkZXJdXG4gKi9cbmZ1bmN0aW9uIGFkZENvbm5lY3RvclByb3ZpZGVyRXZlbnRzKHByb3ZpZGVyOiB0eXBlb2Ygd2luZG93LmV0aGVyZXVtIHwgSW5zdGFuY2VUeXBlPHR5cGVvZiBXYWxsZXRDb25uZWN0UHJvdmlkZXI+IHwgSW5zdGFuY2VUeXBlPHR5cGVvZiBXYWxsZXRMaW5rUHJvdmlkZXI+KSB7XG4gIC8vIFN1YnNjcmliZSB0byBhY2NvdW50cyBjaGFuZ2VcbiAgcHJvdmlkZXIub24oXCJhY2NvdW50c0NoYW5nZWRcIiwgKGFjY291bnRzOiBzdHJpbmdbXSkgPT4ge1xuICAgIC8vIEBUT0RPKGZ3KTogZ2l2ZW4gdGhlIEFQSSwgd2hhdCdzIG91ciByZXNwb25zZSBoZXJlP1xuICAgIGNvbnNvbGUubG9nKGFjY291bnRzKTtcbiAgfSk7XG5cbiAgLy8gU3Vic2NyaWJlIHRvIGNoYWluSWQgY2hhbmdlXG4gIHByb3ZpZGVyLm9uKFwiY2hhaW5DaGFuZ2VkXCIsIChjaGFpbklkOiBudW1iZXIpID0+IHtcbiAgICAvLyBAVE9ETyhmdyk6IGdpdmVuIHRoZSBBUEksIHdoYXQncyBvdXIgcmVzcG9uc2UgaGVyZT9cbiAgICBjb25zb2xlLmxvZyhjaGFpbklkKTtcbiAgfSk7XG5cbiAgLy8gU3Vic2NyaWJlIHRvIHNlc3Npb24gZGlzY29ubmVjdGlvblxuICBwcm92aWRlci5vbihcImRpc2Nvbm5lY3RcIiwgKGNvZGU6IG51bWJlciwgcmVhc29uOiBzdHJpbmcpID0+IHtcbiAgICAvLyBAVE9ETyhmdyk6IGdpdmVuIHRoZSBBUEksIHdoYXQncyBvdXIgcmVzcG9uc2UgaGVyZT9cbiAgICBjb25zb2xlLmxvZyhjb2RlLCByZWFzb24pO1xuICB9KTtcbn1cblxuLyoqXG4gKiBbY29ubmVjdFdhbGxldDogY29ubmVjdCBhIHdhbGxldCB2aWEgb25lIG9mIHRoZSBzdXBwb3J0ZWQgY29ubmVjdG9yc11cbiAqIEBwYXJhbSB7dW5pb259IGNvbm5lY3RvclR5cGUgW2N1cnJlbnRseSwgb25lIG9mICdtZXRhbWFzaycsICd3YWxsZXRDb25uZWN0JywgJ3dhbGxldExpbmsnXVxuICogQHJldHVybiB7c3RyaW5nfSB1c2VyIGFjY291bnQgYWRkcmVzc1xuICovXG5hc3luYyBmdW5jdGlvbiBjb25uZWN0V2FsbGV0KGNvbm5lY3RvclR5cGU6IFdhbGxldENvbm5lY3Rvcik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGlmIChzZWxlY3RlZEFkZHJlc3MpIHtcbiAgICByZXR1cm4gc2VsZWN0ZWRBZGRyZXNzO1xuICB9XG5cbiAgbGV0IGNvbm5lY3RvclByb3ZpZGVyO1xuICBzd2l0Y2goY29ubmVjdG9yVHlwZSkge1xuICAgIGNhc2UgTUVUQU1BU0s6XG4gICAgICBjb25uZWN0b3JQcm92aWRlciA9IHdpbmRvdy5ldGhlcmV1bTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV0FMTEVUX0NPTk5FQ1Q6XG4gICAgICBjb25uZWN0b3JQcm92aWRlciA9IG5ldyBXYWxsZXRDb25uZWN0UHJvdmlkZXIoeyBpbmZ1cmFJZCB9KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV0FMTEVUX0xJTks6XG4gICAgICBjb25zdCB3YWxsZXRMaW5rID0gbmV3IFdhbGxldExpbmsoe1xuICAgICAgICBhcHBOYW1lOiBwcm9jZXNzLmVudi5BUFBfTkFNRSB8fCAnJyxcbiAgICAgICAgYXBwTG9nb1VybDogcHJvY2Vzcy5lbnYuQVBQX0xPR09fVVJMIHx8ICcnLFxuICAgICAgICBkYXJrTW9kZTogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgY29ubmVjdG9yUHJvdmlkZXIgPSB3YWxsZXRMaW5rLm1ha2VXZWIzUHJvdmlkZXIoaW5mdXJhUnBjVXJsLCBwYXJzZUludCgocHJvY2Vzcy5lbnYuRVRIX0NIQUlOX0lEIHx8ICcnKSwgMTApKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyB0ZWNobmljYWxseSwgd2UgZG9uJ3QgbmVlZCBhIGRlZmF1bHQgY2FzZSB3L1RTIHVuaW9uIHR5cGVzLCBidXRcbiAgICAgIC8vIGxlYXZpbmcgaW4gZm9yIHJ1bnRpbWUgZXJyb3IgaGFuZGxpbmcuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbGVhc2UgcHJvdmlkZSBhIHdhbGxldCBjb25uZWN0b3IgdHlwZVwiKTtcbiAgfVxuXG4gIGFkZENvbm5lY3RvclByb3ZpZGVyRXZlbnRzKGNvbm5lY3RvclByb3ZpZGVyKTtcblxuICBhd2FpdCBzZXRXZWIzUHJvdmlkZXIoY29ubmVjdG9yUHJvdmlkZXIpO1xuICBhd2FpdCBzZXRTZWxlY3RlZEFkZHJlc3MoZ2V0V2ViM1Byb3ZpZGVyKCkpO1xuXG4gIGlmICghc2VsZWN0ZWRBZGRyZXNzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlcmUgd2FzIGFuIHVua25vd24gZXJyb3IgY29ubmVjdGluZyB3YWxsZXQuIFBsZWFzZSB0cnkgYWdhaW4uXCIpO1xuICB9XG5cbiAgcmV0dXJuIHNlbGVjdGVkQWRkcmVzcztcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2hhbmdlQWNjb3VudCgpIHtcbiAgY29uc29sZS5sb2coXCJ1c2VyIHJlcXVlc3RpbmcgdG8gY2hhbmdlIHNlbGVjdGVkIGFjY291bnRcIik7XG4gIC8vIEBUT0RPXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNoYW5nZUNoYWluKCkge1xuICBjb25zb2xlLmxvZyhcInVzZXIgcmVxdWVzdGluZyB0byBjaGFuZ2Ugc2VsZWN0ZWQgY2hhaW5cIik7XG4gIC8vIEBUT0RPXG59XG5cbi8vIEBUT0RPKGZ3KSAtIHN5bmMgdy9NYXJ0aW5cbmZ1bmN0aW9uIGdlbmVyYXRlSWRlbnRpdHlTaWduYXR1cmUoKSB7XG4gIGlmICghd2ViM1Byb3ZpZGVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHNpZ25lciA9IGdldFdlYjNTaWduZXIoKTtcbiAgY29uc29sZS5sb2coc2lnbmVyKTtcbn1cblxuZnVuY3Rpb24gZGlzY29ubmVjdFdhbGxldCgpIHtcbiAgLy8gXCJkaXNjb25uZWN0XCIganVzdCBtZWFucyByZXZva2luZyBhIHNpZ25lci9zaWduYXR1cmVzLCBzbyB3ZSBqdXN0IG5lZWRcbiAgLy8gdG8gY2xlYXIgd2hhdGV2ZXIgc3RvcmFnZSB3ZSdyZSB1c2luZyB0byBob2xkIHRob3NlLi4uYXNzdW1pbmcgd2Ugd2FudFxuICAvLyB0byBwcm92aWRlIHRoaXMgZnVuY3Rpb25hbGl0eSBhdCB0aGUgZGFwcC1sZXZlbCAocGVvcGxlIGNhbiBkaXNjb25uZWN0XG4gIC8vIGZyb20gdGhlaXIgd2FsbGV0IFVJcyBkaXJlY3RseSBpbiBtb3N0IGNhc2VzKS5cbiAgY29uc29sZS5sb2coXCJkaXNjb25uZWN0XCIpO1xuICBzZWxlY3RlZEFkZHJlc3MgPSB1bmRlZmluZWQ7XG4gIHdlYjNQcm92aWRlciA9IHVuZGVmaW5lZDtcbn1cblxuXG5leHBvcnQgY29uc3QgWE1UUEF1dGggPSB7XG4gIGNoYW5nZUFjY291bnQsXG4gIGNoYW5nZUNoYWluLFxuICBjb25uZWN0V2FsbGV0LFxuICBkaXNjb25uZWN0V2FsbGV0LFxuICBnZW5lcmF0ZUlkZW50aXR5U2lnbmF0dXJlLFxuICBnZXRBY2NvdW50QWRkcmVzcyxcbiAgZ2V0V2ViM1Byb3ZpZGVyLFxuICBnZXRXZWIzU2lnbmVyXG59O1xuIl19