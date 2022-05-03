# Create Repo Action

This action will create a repository in the namespace of the calling workflow. 

For example, if this action is called from `DemoOrg` , the repo will be created in `DemoOrg`.
If a GitHub user calls this from a personal repository, the repo will be created in the users workspace.

## Inputs:

`repo-name`: Name of the repository

`org-admin-token`: Org admin token with `repo` and `admin:org` scope

`is-private`: Optional boolean value to indicate if `repo` should be private or not

## Outputs:

`repo-url`: URL of the newly created repo. Blank if error.

## Demo Workflow:

### Secrets needed:

Create a Personal Access Token with relevant scopes and save it as a Repo Secret - `ORG_ADMIN_TOKEN`

```
name: Create Repo
on: 
  workflow_dispatch:
    inputs:
      repo-name: 
        description: 'Name of the repository to be created'
        required: true
        default: ''

jobs:
  create-repository:
    runs-on: ubuntu-latest
    name: Creating Organization Repository
    steps:
      - name: Use Node.js
        uses: actions/setup-node@v2
      - name: Creating GitHub Organization Repository
        uses: LucianDavies/gh-repo.action@latest
        id: create-repo
        with:
          repo-name: '${{ github.event.inputs.repo-name }}'
          org-admin-token: '${{ secrets.ORG_ADMIN_TOKEN }}'
          is-private: true  [Optional]
      - name: Log URL to the repo
        run: echo "The new repo is ${{ steps.create-repo.outputs.repo-url }}"
```
