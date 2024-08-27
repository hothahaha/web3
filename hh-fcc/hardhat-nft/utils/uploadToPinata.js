const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const pinataApiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret)

async function storeImage(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath)
    const files = fs
        .readdirSync(fullImagesPath)
        .filter((file) => /\b.png|\b.jpg|\b.jpeg/.test(file))
    let responses = []
    console.log("Uploading to IPFS!")
    for (let fileIndex in files) {
        const readableStreamForFile = fs.createReadStream(
            path.join(fullImagesPath, files[fileIndex]),
        )
        const options = {
            pinataMetadata: {
                name: files[fileIndex],
            },
        }

        try {
            await pinata
                .pinFileToIPFS(readableStreamForFile, options)
                .then((result) => {
                    responses.push(result)
                })
                .catch((error) => {
                    console.log(error)
                })
        } catch (error) {
            console.log(error)
        }
    }
    return { responses, files }
}

async function storeTokenUrlMetadata(metadata) {
    try {
        return await pinata.pinJSONToIPFS(metadata)
    } catch (error) {
        console.log(error)
    }
    return null
}
module.exports = {
    storeImage,
    storeTokenUrlMetadata,
}
