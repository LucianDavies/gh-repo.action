import createRepository from './main';
import * as core from '@actions/core';
import axios from 'axios';

jest.mock('axios');
jest.mock('@actions/core')

describe('createRepository()', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.spyOn(core, 'getInput').mockImplementation((key: string) => {
      const result = {
        'repo-name': "test-repo",
        'org-admin-token': "test-token",
      }[key]

      if (!result){
        throw new Error("Key not found");
      } else {
        return result
      }
    })

    jest.spyOn(core, 'getBooleanInput').mockImplementation((key: string) => {
      const result = {
        "is-private": 'false'
      }[key];

      if (!result){
        throw new Error("Key not found");
      } else {
        return Boolean(result)
      }
    })
  });
  it('should complete a run if all values are correctly provided', async () => {
    jest.spyOn(core, 'getInput').mockImplementationOnce((key: string) => {
      const result = {
        'repo-name': "test-repo",
        'org-admin-token': "test-token",
      }[key]

      if (!result){
        throw new Error("Key not found");
      } else {
        return result
      }
    })

    jest.spyOn(core, 'getBooleanInput').mockImplementationOnce((key: string) => {
      const result = {
        "is-private": 'false'
      }[key];

      if (!result){
        throw new Error("Key not found");
      } else {
        return Boolean(result)
      }
    })

    const axiosSpy = jest.spyOn(axios, 'request').mockImplementationOnce(() => Promise.resolve({status: 200}))

    await createRepository("testTargetOrgName");
    expect(axiosSpy).toHaveBeenCalledWith(expect.objectContaining({
      "url": "https://api.github.com/orgs/testTargetOrgName/repos",
    }))
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.debug).toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("repo-url", "https://github.com/testTargetOrgName/test-repo");
  });


  describe('should fail a run if', () => {
    it('targetRepoName is not provided', async () => {
      await createRepository(undefined);
      expect(core.setFailed).toHaveBeenCalledWith("Cant extract owner login from github context");
      expect(core.setOutput).toHaveBeenCalledWith("repo-url", "");
    });

    it('repo-name is not provided', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((key: string) => {
        if (key == 'repo-name') {
          throw new Error(`${key} is required`);
        }
        return `${key}-value`
      })

      await createRepository("testTargetOrgName");
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('is required'));
      expect(core.setOutput).toHaveBeenCalledWith("repo-url", "");
    });

    it('org-admin-token is not provided', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((key: string) => {
        if (key == 'org-admin-token') {
          throw new Error(`${key} is required`);
        }
        return `${key}-value`
      })

      await createRepository("testTargetOrgName");
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('is required'));
      expect(core.setOutput).toHaveBeenCalledWith("repo-url", "");
    });

    it('axios request return an error', async () => {
      jest.spyOn(axios, 'request').mockRejectedValue(new Error("Error: Something is not right"));
      await createRepository("testTargetOrgName")
      expect(core.setOutput).toHaveBeenCalledWith("repo-url", "");
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Error'));
    });
  })
});
