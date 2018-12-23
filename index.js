const url = require('url')

const vfile = require('vfile')

const remark = require('remark')

const visit = require('unist-util-visit')

const GithubSlugger = require('github-slugger')
const slugger = new GithubSlugger()

function getRelativeLinks (options) {
    return function (tree, file) {
        var relativeLinksMap = {}
        var headingsMap = {}

        visit(tree, ['link'], find)
        visit(tree, ['heading'], getAnchors)

        function getAnchors (node) {
            if (!node || !node.children || !node.children[0] || !node.children[0].value) {
                return
            }
            const anchor = '#' + slugger.slug(node.children[0].value)
            if (headingsMap[file.path]) {
                headingsMap[file.path].push(anchor)
            } else {
                headingsMap[file.path] = [anchor]
            }
        }
        
        function find(node) {
            const { url: nodeUrl } = node
            const { path, hash } = url.parse(nodeUrl)

            if (path) {
                const isRelativeLink = (
                    path.startsWith('./') ||
                    path.startsWith('../') ||
                    path.startsWith('/')
                )
                const isLinkToMarkdownFile = path.endsWith('.md')
                if (isRelativeLink && isLinkToMarkdownFile) {
                    relativeLinksMap[path] = {
                        node,
                        hash
                    }
                }
            } else if (hash) {
                relativeLinksMap[hash] = {
                    node,
                    hash
                }
            }
        }
        file.data.headings = headingsMap
        file.data.relativeLinks = relativeLinksMap
        slugger.reset()
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
                        const { node, hash } = relativeLinks[link]
                        const relativeLinkMatches = (
                            files.some(originalFile => {
                                let originalPath = url.resolve('.', originalFile.path)
                                if (link.startsWith('#')) {
                                    return true
                                }
                                if (link.startsWith('/')) {
                                    originalPath = '/' + originalPath
                                }
                                return (
                                    originalPath === url.resolve(file.path, link)
                                )
                            })
                        )
                        if (relativeLinkMatches && hash) {
                            files.forEach(originalFile => {
                                const { headings: originalHeadings } = originalFile.data
                                if (!originalHeadings) {
                                    return
                                }
                                let originalPath = url.resolve('.', originalFile.path)
                                if (link.startsWith('/')) {
                                    originalPath = '/' + originalPath
                                }
                                if (
                                    link.startsWith('#') ||
                                    (originalPath === url.resolve(file.path, link))
                                ) {
                                    if (!originalHeadings[originalPath].includes(hash)) {
                                        messages.push({
                                            message: 'Relative anchor link not found',
                                            hash,
                                            path: file.path,
                                            link: node.url,
                                            position: node.position
                                        })
                                    }
                                }
                            })
                        }
                        if (!relativeLinkMatches) {
                            messages.push({
                                message: 'Relative link not found',
                                path: file.path,
                                link: node.url,
                                position: node.position
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