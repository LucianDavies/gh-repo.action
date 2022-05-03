"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = __importDefault(require("@actions/github"));
const axios_1 = __importDefault(require("axios"));
const core_1 = require("@actions/core");
function createRepository(targetOrgName) {
    var _a, _b, _c, _d;
    if (targetOrgName === void 0) { targetOrgName = (_d = (_c = (_b = (_a = github_1.default === null || github_1.default === void 0 ? void 0 : github_1.default.context) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.repository) === null || _c === void 0 ? void 0 : _c.owner) === null || _d === void 0 ? void 0 : _d.login; }
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve(targetOrgName)
            .then(gatherInputs)
            .then(callGithubEndpoint)
            .then(function ({ targetOrgName, targetRepoName }) {
            (0, core_1.debug)("Repo " + targetRepoName + ' created successfully!');
            (0, core_1.setOutput)("repo-url", "https://github.com/" + targetOrgName + "/" + targetRepoName);
        }).catch((error) => {
            (0, core_1.setOutput)("repo-url", "");
            if (error instanceof Error) {
                (0, core_1.setFailed)(error.message || error);
            }
        });
    });
}
exports.default = createRepository;
function gatherInputs(targetOrgName) {
    if (!targetOrgName) {
        throw new Error("Cant extract owner login from github context");
    }
    const targetRepoName = (0, core_1.getInput)('repo-name', { required: true });
    const ghToken = (0, core_1.getInput)('org-admin-token', { required: true });
    const isPrivate = (0, core_1.getBooleanInput)('is-private');
    return { targetOrgName, targetRepoName, ghToken, isPrivate };
}
function callGithubEndpoint({ targetOrgName, targetRepoName, ghToken, isPrivate }) {
    return __awaiter(this, void 0, void 0, function* () {
        yield axios_1.default.request(generateCreateRepoRequest({ targetOrgName, targetRepoName, ghToken, isPrivate }));
        return { targetRepoName, targetOrgName };
    });
}
function generateCreateRepoRequest({ targetOrgName, targetRepoName, ghToken, isPrivate }) {
    const createRepoData = JSON.stringify({
        "name": targetRepoName,
        "private": isPrivate,
        "visibility": "private"
    });
    return {
        method: 'post',
        url: 'https://api.github.com/orgs/' + targetOrgName + '/repos',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + ghToken,
            'Content-Type': 'application/json'
        },
        data: createRepoData
    };
}
process.env.NODE_ENV !== "test" && createRepository();
