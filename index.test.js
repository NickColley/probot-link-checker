const outdent = require('outdent')
const checkRelativeLinks = require('./index.js')

describe('check relative links', () => {
    it('shouldnt fail on simple markdown', async () => {
        const results = await checkRelativeLinks([
            {
                path: '/',
                contents: outdent`
                    # Hello World
                `
            }
        ])
        expect(results).toEqual([])
    })
    it('should not warn if a relative link goes to a file that does exist', async () => {
        const results = await checkRelativeLinks([
            {
                path: 'fixture/entry.md',
                contents: outdent`
                    [Nested page](./nested/nested.md)
                `
            },
            {
                path: 'fixture/nested/nested.md',
                contents: outdent`
                    # Nested
                `
            }
        ])
        expect(results).toEqual([])
    })
    it('should warn if a relative link goes to a file that does not exist', async () => {
        const results = await checkRelativeLinks([
            {
                path: 'fixture/entry.md',
                contents: outdent`
                    [Nested page](./nested/nested.md)
                `
            },
            {
                path: 'fixture/nested/not-nested.md',
                contents: outdent`
                    # Not Nested
                `
            }
        ])
        expect(results).toEqual([
            {
                link: "./nested/nested.md",
                message: "Relative link not found",
                path: "fixture/entry.md",
                position: {
                    indent: [],
                    end: {
                        column: 34,
                        line: 1,
                        offset: 33,
                    },
                    start: {
                        column: 1,
                        line: 1,
                        offset: 0,
                    }
                }
            }
        ])
    })
    it('should not warn if anchor does exist in same page', async () => {
        const results = await checkRelativeLinks([
            {
                path: '/',
                contents: outdent`
                    [anchor](#anchor)
                    # Anchor
                `
            }
        ])
        expect(results).toEqual([])
    })
    it('should warn if anchor doesnt exist in same page', async () => {
        const results = await checkRelativeLinks([
            {
                path: '/',
                contents: outdent`
                    [anchor](#anchor)
                    # Heading that doesnt exist
                `
            }
        ])
        expect(results).toEqual([
            {
                hash: "#anchor",
                link: "#anchor",
                message: "Relative anchor link not found",
                path: "/",
                position: {
                    indent: [],
                    end: {
                        column: 18,
                        line: 1,
                        offset: 17,
                    },
                    start: {
                        column: 1,
                        line: 1,
                        offset: 0,
                    }
                }
            }
        ])
    })
    it('should not warn if a relative link with anchor goes to a file that does not have an anchor', async () => {
        const results = await checkRelativeLinks([
            {
                path: 'fixture/entry.md',
                contents: outdent`
                    [Nested page](./nested/nested.md#nested)
                `
            },
            {
                path: 'fixture/nested/nested.md',
                contents: outdent`
                    # Nested
                `
            }
        ])
        expect(results).toEqual([])
    })
    it('should warn if anchor doesnt exist in a relative page', async () => {
        const results = await checkRelativeLinks([
            {
                path: 'fixture/entry.md',
                contents: outdent`
                    [Nested page](./nested/nested.md#nested)
                `
            },
            {
                path: 'fixture/nested/nested.md',
                contents: outdent`
                    # Not Nested
                `
            }
        ])
        expect(results).toEqual([
            {
                hash: "#nested",
                link: "./nested/nested.md#nested",
                message: "Relative anchor link not found",
                path: "fixture/entry.md",
                position: {
                    indent: [],
                    end: {
                        column: 41,
                        line: 1,
                        offset: 40,
                    },
                    start: {
                        column: 1,
                        line: 1,
                        offset: 0,
                    }
                }
            }
        ])
    })
})