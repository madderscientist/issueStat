/**
 * 获取存在tag中的dashboard统计数据
 * @param {String} owner 用户名
 * @param {String} repo 仓库名
 * @returns 统计数据对象
 */
async function getDashboardStat(owner, repo) {
    const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/tags/dashboard`;
    const tagSha = await fetch(refUrl)
        .then(r => r.json())
        .then(d => d.object.sha);
    const tagUrl = `https://api.github.com/repos/${owner}/${repo}/git/tags/${tagSha}`;
    const msg = await fetch(tagUrl)
        .then(r => r.json())
        .then(d => d.message);
    return JSON.parse(msg);
}

// 示例用法：
// getDashboardStat('OWNER', 'REPO').then(stat => console.log(stat));