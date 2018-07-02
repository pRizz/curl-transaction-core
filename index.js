const IOTALib = require('iota.lib.js')
const iota = new IOTALib({})

const MAX_TIMESTAMP_VALUE = (Math.pow(3, 27) - 1) / 2 // from curl.min.js

let _curlImpl // injected

async function processTrytes({ previousTxHash, unprocessedTrytes, minWeightMagnitude, trunkTransaction, branchTransaction }) {
    // PROCESS LOGIC:
    // Start with last index transaction
    // Assign it the trunk / branch which the user has supplied
    // IF there is a bundle, chain the bundle transactions via
    // trunkTransaction together

    let unprocessedTxObject = iota.utils.transactionObject(unprocessedTrytes)
    unprocessedTxObject.tag = unprocessedTxObject.tag || unprocessedTxObject.obsoleteTag
    unprocessedTxObject.attachmentTimestamp = Date.now()
    unprocessedTxObject.attachmentTimestampLowerBound = 0
    unprocessedTxObject.attachmentTimestampUpperBound = MAX_TIMESTAMP_VALUE

    // If this is the first transaction, to be processed
    // Make sure that it's the last in the bundle and then
    // assign it the supplied trunk and branch transactions
    if (!previousTxHash) {
        // Check if last transaction in the bundle
        if (unprocessedTxObject.lastIndex !== unprocessedTxObject.currentIndex) {
            throw new Error('Wrong bundle order. The bundle should be ordered in descending order from currentIndex')
        }

        unprocessedTxObject.trunkTransaction = trunkTransaction
        unprocessedTxObject.branchTransaction = branchTransaction
    } else {
        // Chain the bundle together via the trunkTransaction (previous tx in the bundle)
        // Assign the supplied trunkTransaciton as branchTransaction
        unprocessedTxObject.trunkTransaction = previousTxHash
        unprocessedTxObject.branchTransaction = trunkTransaction
    }

    const updatedTrytes = iota.utils.transactionTrytes(unprocessedTxObject)

    return await _curlImpl.pow({ trytes: updatedTrytes, minWeightMagnitude })
}

async function processArrayOfTrytes({ trunkTransaction, branchTransaction, minWeightMagnitude, trytesArray }) {
    let finalBundleTrytes = []
    let previousTxHash = null

    for(let unprocessedTrytes of trytesArray) {
        const processedTrytes = await processTrytes({
            previousTxHash,
            unprocessedTrytes,
            minWeightMagnitude,
            trunkTransaction,
            branchTransaction
        })
        previousTxHash = iota.utils.transactionObject(processedTrytes).hash
        finalBundleTrytes.push(processedTrytes)
    }

    return finalBundleTrytes
}

async function curl({ trunkTransaction, branchTransaction, minWeightMagnitude = 14, trytesArray }) {
    if (!iota.valid.isHash(trunkTransaction)) {
        throw new Error("Invalid trunkTransaction")
    }

    if (!iota.valid.isHash(branchTransaction)) {
        throw new Error("Invalid branchTransaction")
    }

    if (!iota.valid.isValue(minWeightMagnitude)) {
        throw new Error("Invalid minWeightMagnitude")
    }

    return processArrayOfTrytes({ trunkTransaction, branchTransaction, minWeightMagnitude, trytesArray })
}

function localAttachToTangle(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, callback) {
    curl.curl({ trunkTransaction, branchTransaction, minWeightMagnitude, trytesArray: trytes }).then((processedTrytes) => {
        callback(null, processedTrytes)
    }).catch((error) => {
        callback(error)
    })
}

module.exports = function({ curlImpl }) {
    _curlImpl = curlImpl

    return {
        curl,
        localAttachToTangle
    }
}