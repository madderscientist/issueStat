# Automatic issue statistics workflow

A GitHub Actions workflow for automatically counting open issues and their labels, and saving the statistics to a tag message for further request.

[中文说明](./README.md)

## Features
- Automatically counts open issues and their labels when issues are opened, closed, or reopened
- Stores the statistics as a JSON message in a Git tag named `dashboard`
- Provides a sample script to fetch and parse the statistics via GitHub API

## What problem are we trying to solve?
When using GitHub Issues to store data, we sometimes need a "dashboard" that shows how many issues each label has and the total number of issues. While coding such a data-view application, the usual options and their drawbacks are:

1. Use the REST API’s search endpoint – it returns the full body of every issue and caps the result count.  
2. Use the GraphQL API – it needs a token. If I use my own token, heavy traffic from many users will burn through the rate-limit; if I ask users to supply theirs, they must log in first, which is cumbersome.  
3. Cache all issues locally – too clumsy.

So I decided to let a GitHub Action do the counting and persist the result somewhere, triggered only when an issue changes; each user no longer has to compute the stats on every visit. Where should the result live?

1. As a normal commit – it would drown meaningful commits and clutter the history. I’m obsessive about a clean log.  
2. As a commit to the wiki or an orphan branch – the repo would still balloon with historical snapshots.  
3. The repository’s description – it’s not versioned, and, well, that’s the face of the project!

After grilling an LLM, an unexpected answer popped up: store the JSON inside the **message of a lightweight tag**! Hence this repo.


## Usage
1. Copy the workflow file to `.github/workflows/stat.yaml` in your repository.
2. The workflow will run automatically on issue events. To avoid repeated triggering, 'label' related triggers were not included.
3. You can fetch the statistics using the provided `getStat.js` script.