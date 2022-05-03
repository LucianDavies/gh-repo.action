import github from '@actions/github';
import axios, { AxiosRequestConfig } from 'axios';
import { getInput, getBooleanInput, setOutput, debug, setFailed } from '@actions/core';

interface Inputs {
  targetOrgName: string;
  targetRepoName: string;
  ghToken:string;
  isPrivate: boolean
}

export default async function createRepository(targetOrgName = github?.context?.payload?.repository?.owner?.login): Promise<void> {
  return Promise.resolve(targetOrgName)
    .then(gatherInputs)
    .then(callGithubEndpoint)
    .then(function ({targetOrgName, targetRepoName}) {
      debug("Repo "+targetRepoName+' created successfully!');
      setOutput("repo-url", "https://github.com/"+targetOrgName+"/"+targetRepoName);
    }).catch((error)  => {
      setOutput("repo-url", "");
      if (error instanceof Error) {
        setFailed(error.message || error);
      }
    })
}

function gatherInputs(targetOrgName: string | undefined) {
    if(!targetOrgName){
      throw new Error("Cant extract owner login from github context")
    }
    const targetRepoName = getInput('repo-name', {required: true});
    const ghToken = getInput('org-admin-token', {required: true});
    const isPrivate = getBooleanInput('is-private');

  return {targetOrgName, targetRepoName, ghToken, isPrivate}
}

async function callGithubEndpoint({targetOrgName, targetRepoName, ghToken, isPrivate}: Inputs) {
  await axios.request(generateCreateRepoRequest({targetOrgName, targetRepoName, ghToken, isPrivate}))
  return {targetRepoName, targetOrgName}
}

function generateCreateRepoRequest ({targetOrgName, targetRepoName, ghToken, isPrivate}: Inputs): AxiosRequestConfig {
  const createRepoData = JSON.stringify(
    {
      "name":targetRepoName,
      "private":isPrivate,
      "visibility":"private"
    }
  );

  return {
    method: 'post',
    url: 'https://api.github.com/orgs/'+targetOrgName+'/repos',
    headers: { 
      'Accept': 'application/vnd.github.v3+json', 
      'Authorization': 'token '+ghToken, 
      'Content-Type': 'application/json'
    },
    data : createRepoData
  };

}

process.env.NODE_ENV !== "test" && createRepository();
