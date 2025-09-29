// 用于统计 issue 总数和 open issue 的 label 分布，并强制推送 dashboard tag

const { execSync } = require('child_process');
const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GH_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const SHA = process.env.GITHUB_SHA;
const tagName = process.env.TAG_NAME || 'dashboard';

if (!GITHUB_TOKEN || !REPO || !SHA) {
    console.error('GH_TOKEN, GITHUB_REPOSITORY, GITHUB_SHA 环境变量必须设置');
    process.exit(1);
}

const [OWNER, NAME] = REPO.split('/');
const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'issue-stats-action'
};

async function fetchGraphQL(query, variables) {
    const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables })
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GraphQL error: ${res.status} ${text}`);
    }
    return res.json();
}


async function issueStat() {
    const query = `query($owner:String!,$name:String!,$cursor:String){
repository(owner:$owner,name:$name){
  issues(states:OPEN,first:100,after:$cursor){
    pageInfo{hasNextPage endCursor}
      nodes{
        createdAt
        labels(first:100){nodes{name}}
      }
    }
  }
}`;
    // 总数
    let total = 0;
    // 类别分布
    const labelCounts = {};
    // 时间分布
    const recentCreatedAt = Array(30).fill(0); // 30天内，每天创建的issue数目
    const aDay = 24 * 60 * 60 * 1000;       // 一天的毫秒数
    const since = Date.now() - 30 * aDay;   // 30天前的时间戳

    let cursor = null;
    let hasNextPage = true;
    while (hasNextPage) {
        // 一次请求最多 100 个 issue，分页获取
        const data = await fetchGraphQL(query, { owner: OWNER, name: NAME, cursor });
        const issues = data.data.repository.issues.nodes;
        for (const issue of issues) {
            // 统计总数
            total++;
            // 统计标签分布
            for (const label of issue.labels.nodes) {
                labelCounts[label.name] = (labelCounts[label.name] || 0) + 1;
            }
            // 统计每天创建的 issue 数目
            const createdTime = new Date(issue.createdAt).getTime();
            if (createdTime >= since) {
                const dayIndex = Math.floor((createdTime - since) / aDay);
                recentCreatedAt[dayIndex]++;
            }
        }
        hasNextPage = data.data.repository.issues.pageInfo.hasNextPage;
        cursor = data.data.repository.issues.pageInfo.endCursor;
    }
    return { total, labelCounts, recentCreatedAt };
}

async function main() {
    const { total, labelCounts, recentCreatedAt } = await issueStat();
    const updated = new Date().toISOString();
    const json = JSON.stringify({ total, labels: labelCounts, recentCreatedAt, updated });

    // 配置 git 用户
    execSync('git config user.name "github-actions[bot]"');
    execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');

    // 删除本地/远程旧 tag
    try { execSync(`git tag -d ${tagName}`); } catch { }
    try { execSync(`git push origin :refs/tags/${tagName}`); } catch { }

    // 新建附注 tag
    execSync(`git tag -a ${tagName} -m "${json}" ${SHA}`);
    execSync(`git push origin ${tagName} --force`);

    console.log(`${tagName} tag pushed:`, json);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
