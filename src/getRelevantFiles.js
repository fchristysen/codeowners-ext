import {Codeowner} from 'codeowners-api';
import * as octokit from '@octokit/rest';
import getPullRequestDetails from './getPullRequestDetails';
import {getGithubAuth} from './githubAuth';

const getChangedFiles = async (auth, prDetails) => {
    const octo = new octokit();
    octo.authenticate(auth);

    let prFilesRes = await octo.pullRequests.getFiles({...prDetails, per_page: 100});
    const files = prFilesRes.data.map(x => x.filename);
    while (octo.hasNextPage(prFilesRes)) {
        prFilesRes = await octo.getNextPage(prFilesRes);
        files.push(...prFilesRes.data.map(x => x.filename));
    }

    return files;
};

const getUser = () => document.querySelector('meta[name="user-login"]').content;

let relevantFiles = {};
const getRelevantFiles = async prUrl => {
    if (relevantFiles[prUrl]) return relevantFiles[prUrl];

    const prDetails = getPullRequestDetails();
    const auth = await getGithubAuth();
    const files = await getChangedFiles(auth, prDetails);

    const user = getUser();

    const codeowner = new Codeowner(
        {
            owner: prDetails.owner,
            repo: prDetails.repo,
        },
        auth,
    );

    relevantFiles[prUrl] = await codeowner.filterForAuthenticatedUser(files, user);

    return relevantFiles[prUrl];
};

export default getRelevantFiles;
