import createRepository from './main';
import * as core from '@actions/core';
import * as github from '@actions/github';
import axios, { AxiosError } from 'axios';

describe('createRepository()', () => {
  let getInputSpy: jest.SpyInstance;
  let getBooleanInputSpy: jest.SpyInstance;
  let setFailedSpy: jest.SpyInstance;
  let setOutputSpy: jest.SpyInstance;
  let axiosSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(github, {
      context: {
        payload: {
          repository: {
            owner: {
              login: 'testTargetOrgName',
            },
          },
        },
      },
    });
    setFailedSpy = jest.spyOn(core, 'setFailed');
    setFailedSpy.mockImplementation(message => message);

    setOutputSpy = jest.spyOn(core, 'setOutput');
    setOutputSpy.mockImplementation(message => message);

    axiosSpy = jest.spyOn(axios, 'request');
    axiosSpy.mockImplementation(() => Promise.resolve({ status: 200 }));

    getInputSpy = jest.spyOn(core, 'getInput');
    getInputSpy.mockImplementation((key: string) => {
      const result = {
        'repo-name': 'test-repo',
        'org-admin-token': 'test-token',
      }[key];

      if (!result) {
        throw new Error('Key not found');
      } else {
        return result;
      }
    });

    getBooleanInputSpy = jest.spyOn(core, 'getBooleanInput');
    getBooleanInputSpy.mockImplementation((key: string) => {
      const result = {
        'is-private': 'false',
      }[key];

      if (!result) {
        throw new Error('Key not found');
      } else {
        return Boolean(result);
      }
    });
  });

  it('should create repo if all values are provided', async () => {
    await createRepository();
    expect(axiosSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.github.com/orgs/testTargetOrgName/repos',
      })
    );
    expect(setFailedSpy).not.toHaveBeenCalled();
    expect(setOutputSpy).toHaveBeenCalledWith(
      'repo-url',
      'https://github.com/testTargetOrgName/test-repo'
    );
  });

  it('should not fail if repo already exists', async () => {
    axiosSpy.mockRejectedValue(
      newAxiosError('Error', {
        status: 422,
        data: {
          message: 'Repository creation failed.',
          errors: [
            {
              resource: 'Repository',
              code: 'custom',
              field: 'name',
              message: 'name already exists on this account',
            },
          ],
          documentation_url:
            'https://docs.github.com/rest/reference/repos#create-an-organization-repository',
        },
      })
    );
    await createRepository();
    expect(setFailedSpy).not.toHaveBeenCalled();
    expect(setOutputSpy).toHaveBeenCalledWith(
      'repo-url',
      'https://github.com/testTargetOrgName/test-repo'
    );
  });

  describe('should fail a run if', () => {
    it('targetRepoName is not provided', async () => {
      Object.assign(github, {
        context: {
          payload: {
            repository: null,
          },
        },
      });
      await createRepository();
      expect(setFailedSpy).toHaveBeenCalledWith(
        'Cant extract owner login from github context'
      );
      expect(setOutputSpy).toHaveBeenCalledWith('repo-url', '');
    });

    it('repo-name is not provided', async () => {
      getInputSpy.mockImplementation((key: string) => {
        if (key == 'repo-name') {
          throw new Error(`${key} is required`);
        }
        return `${key}-value`;
      });

      await createRepository();
      expect(setFailedSpy).toHaveBeenCalledWith(
        expect.stringContaining('is required')
      );
      expect(setOutputSpy).toHaveBeenCalledWith('repo-url', '');
    });

    it('org-admin-token is not provided', async () => {
      getInputSpy.mockImplementation((key: string) => {
        if (key == 'org-admin-token') {
          throw new Error(`${key} is required`);
        }
        return `${key}-value`;
      });

      await createRepository();
      expect(setFailedSpy).toHaveBeenCalledWith(
        expect.stringContaining('is required')
      );
      expect(setOutputSpy).toHaveBeenCalledWith('repo-url', '');
    });

    it('client is misconfigured', async () => {
      axiosSpy.mockRejectedValue(new Error('Error'));
      await createRepository();
      expect(setOutputSpy).toHaveBeenCalledWith('repo-url', '');
      expect(setFailedSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });
    it('axios request returns an error', async () => {
      axiosSpy.mockRejectedValue(newAxiosError('Error'));
      await createRepository();
      expect(setOutputSpy).toHaveBeenCalledWith('repo-url', '');
      expect(setFailedSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });
  });
});

function newAxiosError(
  message: string,
  response: Partial<AxiosError['response']> = {}
): AxiosError {
  return {
    isAxiosError: true,
    name: '',
    message,
    toJSON: () => ({}),
    config: {},
    ...(response.status && {
      response: {
        data: response.data,
        status: response.status || 500,
        statusText: response.statusText || 'Error',
        headers: {},
        config: {},
      },
    }),
  };
}
