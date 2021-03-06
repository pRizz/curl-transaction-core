# curl-transaction-core

[![Greenkeeper badge](https://badges.greenkeeper.io/pRizz/curl-transaction-core.svg)](https://greenkeeper.io/)

Core code for curling IOTA transactions. Must inject either the WebGL curl or ccurl implementation.

## Example Usage with ccurl

    const ccurlImpl = require('curl-transaction-ccurl-impl')
    const curlTransaction = require('curl-transaction-core')
    const curl = curlTransaction({ curlImpl: ccurlImpl })
    
    curl.curl({ trunkTransaction, branchTransaction, minWeightMagnitude, trytesArray: trytes }).then((processedTrytes) => {
          callback(null, processedTrytes)
    }).catch((error) => {
          callback(error)
    })


## Example Usage with WebGL2
    import curlTransaction from 'curl-transaction-core'
    import curlImpl from 'curl-transaction-webgl2-impl'
    
    if(!curlImpl.error) {
        const curl = curlTransaction({ curlImpl })
        localAttachToTangle = function(trunkTransaction, branchTransaction, minWeightMagnitude, trytesArray, callback) {
            curl.curl({ trunkTransaction, branchTransaction, minWeightMagnitude, trytesArray }).then((processedTrytes) => {
                callback(null, processedTrytes)
            }).catch((error) => {
                callback(error)
            })
        }
        console.log("Your browser does support WebGL2")
    } else {
        console.error("Your browser does not support WebGL2")
        this.isWebGL2Supported = false
    }


## Using together with Masked Authenticated Messaging (@iota/mam)
    import * as Mam from '@iota/mam';
    import curlTransaction from 'curl-transaction-core';
    import curlImpl from 'curl-transaction-webgl2-impl';
    
    const curl = curlTransaction({ curlImpl });
    const localAttachToTangle = async function(trunkTransaction, branchTransaction, minWeightMagnitude, trytesArray) {
    
        var trytes = await curl.curl({ trunkTransaction, branchTransaction, minWeightMagnitude, trytesArray }).then((processedTrytes) => {
            return processedTrytes
        }).catch((error) => {
            throw error;
        });
    
        return trytes;
    };
    
    const mamConfig = {
        provider: "https://nodes.devnet.iota.org:443",
        attachToTangle: localAttachToTangle
    };
    
    Mam.init(mamConfig);
