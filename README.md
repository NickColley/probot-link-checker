# Probot link checker

Work in progress Probot to check links.

I built this to learn but also the other approaches I saw either didnt work for me or over used HTTP requests, which isnt needed for local files.

Thanks to:

- https://github.com/remarkjs/remark-validate-links
- https://github.com/davidtheclark/remark-lint-no-dead-urls
- https://github.com/wemake-services/remark-lint-are-links-valid

## TODO

- Cover more cases found in other scripts
- Figure out a way to make this a remark plugin
- Relative links to Github UI stuff, like issues/new
- Test for hidden dot .files
- Test for relative paths without a dot infront
- Test anchors relative in other files
- Test relative links that target readme.md e.g. src/vendor/polyfill
- Probot stuff