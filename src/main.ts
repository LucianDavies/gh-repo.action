import * as github from '@actions/github';
import axios from 'axios';
import {
  getInput,
  getBooleanInput,
  setOutput,
  debug,
  setFailed,
} from '@actions/core';

interface Inputs {
  targetOrgName: string;
  targetRepoName: string;
  ghToken: string;
  isPrivate: boolean;
}

export default async function createRepository(): Promise<void> {
  return Promise.resolve()
    .then(gatherInputs)
    .then(ghCreateRepository)
    .then(({ targetOrgName, targetRepoName }) => {
      debug('Repo ' + targetRepoName + ' created successfully!');
      setOutput(
        'repo-url',
        'https://github.com/' + targetOrgName + '/' + targetRepoName
      );
    })
    .catch(error => {
      setOutput('repo-url', '');
      setFailed(error.message);
    });
}

function gatherInputs() {
  const targetOrgName = github.context.payload.repository?.owner?.login;
  if (!targetOrgName) {
    throw new Error('Cant extract owner login from github context');
  }
  const targetRepoName = getInput('repo-name', { required: true });
  const ghToken = getInput('org-admin-token', { required: true });
  const isPrivate = getBooleanInput('is-private');

  return { targetOrgName, targetRepoName, ghToken, isPrivate };
}

async function ghCreateRepository({
  targetOrgName,
  targetRepoName,
  ghToken,
  isPrivate,
}: Inputs) {
  const createRepoData = JSON.stringify({
    name: targetRepoName,
    private: isPrivate,
    visibility: 'private',
  });

  await axios
    .request({
      method: 'post',
      url: 'https://api.github.com/orgs/' + targetOrgName + '/repos',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: 'token ' + ghToken,
        'Content-Type': 'application/json',
      },
      data: createRepoData,
    })
    .catch(err => {
      if (axios.isAxiosError(err) && err.response?.status == 422) {
        return { targetRepoName, targetOrgName, ghToken, isPrivate };
      }

      throw err;
    });
  return { targetRepoName, targetOrgName, ghToken, isPrivate };
}

createRepository();
