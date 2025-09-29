# 自动 issue 统计 工作流
一个 GitHub Action，每当 issue 发生变动时自动统计并保存结果，便于后续查询和展示。

[English README](./README.en.md)

## 功能
- 提供一个 [GitHub Action 脚本](.github/workflows/stat.yaml)，在 issue 变动时自动统计各 label 下的 issue 数量
- 将统计数据以 JSON 格式存储在名为 `dashboard` 的 tag message 中
- 提供一个[示例脚本](./getStat.js)，可通过 GitHub API 获取并解析统计信息

## 要解决什么问题
在用 GitHub issue 存储数据时，常常需要“总览”——比如各 label 下有多少 issue、总 issue 数是多少。常规方案及其问题如下：
1. 用 REST API 的 search 查询：会返回每个 issue 的具体内容，而且有数目上限。
2. 用 GraphQL API 查询，但需要 token 。如果用自己的 token ，用户多了容易瓜分完；如果用用户的 token 则需登录，麻烦。
3. 把 issue 缓存到本地。这也太笨了！

因此，我想到用 GitHub Action 定时统计，并将结果写入仓库的某个位置，触发时机为 issue 变动，无需每个用户都实时统计。记录位置的常见方案及其缺陷：
1. 作为 commit：会产生大量无意义的提交，污染主分支历史。
2. 提交到 wiki 或其他分支：历史膨胀，增加仓库体积。我有洁癖。
3. 写到项目 description：这可是项目的门面啊！

在逼问LLM后，我得到了一个意想不到的方式：**将信息存储在 tag 的 message 中**！于是有了本项目。

## 使用方法
1. 将工作流文件复制到你的仓库 [`.github/workflows/stat.yaml`](.github/workflows/stat.yaml)。
2. 当 issue 发生变动时（为减少触发次数，未包含 label 相关事件），会自动统计并更新数据。
3. 使用 [`getStat.js`](./getStat.js) 脚本获取统计数据。