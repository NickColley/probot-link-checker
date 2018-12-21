const fs = require('fs')
const checkRelativeLinks = require('./index.js')

const glob = require('glob')

glob("fixtures/**/*.md", (error, filePaths) => {
    if (error) {
        throw error
    }

    const filesWithContentsPromises = filePaths.map(path => {        
        return new Promise((resolve, reject) => {
            fs.readFile(path, (error, contents) => {
                if (error) {
                    reject(error)
                }

                resolve({
                    path,
                    contents
                })
            })
        })
    })

    console.time('nested')
    Promise
        .all(filesWithContentsPromises)
        .then(checkRelativeLinks)
        .then(results => {
            if(!results.every(result => result.link)) {
                throw new Error('Link not truthy on result')
            }
            if(!results.every(result => result.position)) {
                throw new Error('Position not truthy on result')
            }
            if (results.length !== 8) {
                throw new Error('Unexpected amount of errors')
            }
            console.timeEnd('nested')
        })
        .catch(error => {
            console.error(error)
        })
})