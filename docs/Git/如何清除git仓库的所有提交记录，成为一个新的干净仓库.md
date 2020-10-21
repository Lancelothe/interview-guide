当我们有时候在开发时提交了很多敏感信息的文件或者log，到正式开源的时候需要清除，但是不想麻烦重新建新的仓库，想在原有仓库中清理所有commit记录，使其成为一个新的仓库的样子，该怎么做呢？

## 操作步骤

　　1.切换到新的分支

```
git checkout --orphan latest_branch
```

　　2.缓存所有文件（除了.gitignore中声明排除的）

```
 git add -A
```

　　3.提交跟踪过的文件（Commit the changes）

```
 git commit -am "commit message"
```

　　4.删除master分支（Delete the branch）

```
git branch -D master
```

　　5.重命名当前分支为master（Rename the current branch to master）

```
 git branch -m master
```

　　6.提交到远程master分支 （Finally, force update your repository）

```
 git push -f origin master
```

　　通过以上几步就可以简单地把一个Git仓库的历史提交记录清除掉了，不过最好还是在平时的开发中严格要求一下提交日志的规范，尽量避免在里面输入一些敏感信息进来。

 