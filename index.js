const url = require('url')

const vfile = require('vfile')

const remark = require('remark')

const visit = require('unist-util-visit')

function getRelativeLinks (options) {
    return function (tree, file) {
        var relativeLinksMap = {}

        visit(tree, ['link'], find)
        
        function find(node) {
            const { url } = node
            const isRelativeLink = (
                url.startsWith('./') ||
                url.startsWith('../') ||
                url.startsWith('/')
            )
            const isLinkToMarkdownFile = url.endsWith('.md')
            if (isRelativeLink && isLinkToMarkdownFile) {
                relativeLinksMap[url] = node
            }
        }
        file.data.relativeLinks = relativeLinksMap
    }
}

function checkRelativeLinks (files) {
    const filesWithRelativeLinksPromises = files.map(fileData => {
        return new Promise((resolve, reject) => {
            const file = vfile(fileData)
    
            remark()
                .use(getRelativeLinks)
                .process(file, (error, file) => {
                    if(error) {
                        reject(error)
                    }
                    fileData.data = file.data
                    resolve(fileData)
                })
        })
    })

    return new Promise((resolve, reject) => {
        Promise
            .all(filesWithRelativeLinksPromises)
            .then(files => {
                let messages = []
                files.forEach(file => {
                    const { relativeLinks } = file.data
                    Object.keys(relativeLinks).forEach(link => {
                        const relativeLinkMatches = (
                            files.some(originalFile => {
                                let originalPath = url.resolve('.', originalFile.path)
                                if (link.startsWith('/')) {
                                    originalPath = '/' + originalPath
                                }
                                return (
                                    originalPath === url.resolve(file.path, link)
                                )
                            })
                        )
                        if (!relativeLinkMatches) {
                            messages.push({
                                path: file.path,
                                link: relativeLinks[link].url,
                                position: relativeLinks[link].position
                            })
                        }
                    })
                })
                resolve(messages)
            })
            .catch(reject)
    })
}

module.exports = checkRelativeLinks