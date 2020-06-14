[TOC]

我们是否有过想整理下Git的提交记录，修改某些不明确的commit的信息，来看看这篇文章吧，`git rebase`都能帮你实现：

- 合并多条commit记录
- 修改commit信息
- 修改commit的提交用户（可能自己GitHub和公司GitLab两个账号混用了）



## 修改最新的commit信息

`git commit --amend`

上面这条命令会将最后一次的提交信息载入到编辑器中供你修改。 当保存并关闭编辑器后，编辑器会将更新后的提交信息写入新提交中，它会成为新的最后一次提交。

## 修改历史commit信息

### 修改提交

修改更早的提交或修改多个提交就需要用到`git rebase -i parentCommitID`，其机理是通过重新衍合parentCommitID之后的全部提交，所以该操作会改变parentCommitID结点之后所有提交的commit id。

通过`rebase -i`我们可以交互式的运行rebase，以达到修改更早的提交或修改多个提交。

运行这个命令会弹出一个文本编辑器，其中包含了提交列表和一些简单说明，形如：

```bash
edit f7f3f6d changed my name a bit
pick 310154e updated README formatting and added blame
pick a5f4a0d added cat-file

# Rebase 710f0f8..a5f4a0d onto 710f0f8
#
# Commands:
#  p, pick = use commit  使用提交(即保留它，不做修改)
#  r, reword = use commit, but edit the commit message 使用提交，但编辑提交的日志消息
#  e, edit = use commit, but stop for amending 使用提交，但停下来修改（就是要修改提交的内容）
#  s, squash = use commit, but meld into previous commit 使用提交，但融入此前的提交（就是与在此之前一个提交合并）
#  f, fixup = like "squash", but discard this commit's log message 类似于squash，但是丢弃此提交的日志消息
#  x, exec = run command (the rest of the line) using shell 运行shell命令
#  d, drop = remove commit 删除提交
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
#
# Note that empty commits are commented out
```

你会发现提交列表的顺序与通过`git log`查看的命令是相反的，而且在每条提交前面都有一个`pick`，在说明中有提到，是选择该次提交，即不做修改，如果需要修改某个提交，就将对应记录（可是多个记录）的`pick`改为`edit`。保存，关闭文本编辑器后，回到命令行，会停在第一个标记为`edit`的提交前，eg：

```bash
$ git rebase -i HEAD~3
Stopped at 7482e0d... updated the gemspec to hopefully work better
You can amend the commit now, with

       git commit --amend

Once you’re satisfied with your changes, run

       git rebase --continue
```

根据提示，修改完成之后执行`git commit --amend`修改提交，然后执行`git rebase --continue`继续rebase。

所以`rebase -i`的流程如下：

- `git rebase -i parentCommitID`
- 在弹出的文本编辑器中，将要修改的commit的前方的pick改为edit，保存，关闭文本编辑器
- 在命令行处于等待状态后，修改内容
- 执行`git commit --amend`修改提交
- 执行`git rebase --continue`继续rebase
- 完成

最后，通过`git push --force`将篡改历史纪录后的结果同步到服务器

> 注意，强制更新会有一定风险，就是这个时候如果有其他人也在向服务器提交代码，那会被你的强制更新给覆盖掉。

这就是为什么我们经常听到有人说 `git rebase` 是一个危险命令，因为它改变了历史，我们应该谨慎使用。

除非你可以肯定该 `feature1` 分支只有你自己使用，否则请谨慎操作。

### 合并提交

如果，指定 “squash” 而不是 “pick” 或 “edit”，Git 将应用两者的修改并合并提交信息在一起。 所以，如果想要这三次提交变为一个提交，可以这样修改脚本：

```console
pick f7f3f6d changed my name a bit
squash 310154e updated README formatting and added blame
squash a5f4a0d added cat-file
```

当保存并退出编辑器时，Git 应用所有的三次修改然后将你放到编辑器中来合并三次提交信息：

```console
# This is a combination of 3 commits.
# The first commit's message is:
changed my name a bit

# This is the 2nd commit message:

updated README formatting and added blame

# This is the 3rd commit message:

added cat-file
```

当你保存之后，你就拥有了一个包含前三次提交的全部变更的提交。

### 核武器级选项：filter-branch

有另一个历史改写的选项，如果想要通过脚本的方式改写大量提交的话可以使用它——例如，全局修改你的邮箱地址或从每一个提交中移除一个文件。 这个命令是 `filter-branch`，它可以改写历史中大量的提交，除非你的项目还没有公开并且其他人没有基于要改写的工作的提交做的工作，否则你不应当使用它。 然而，它可以很有用。 你将会学习到几个常用的用途，这样就得到了它适合使用地方的想法。

> 警告：`git filter-branch` 有很多陷阱，不再推荐使用它来重写历史。 请考虑使用 `git-filter-repo`，它是一个 Python 脚本，相比大多数使用 `filter-branch` 的应用来说，它做得要更好。它的文档和源码可访问 https://github.com/newren/git-filter-repo 获取。

#### 全局修改邮箱地址

另一个常见的情形是在你开始工作时忘记运行 `git config` 来设置你的名字与邮箱地址， 或者你想要开源一个项目并且修改所有你的工作邮箱地址为你的个人邮箱地址。 任何情形下，你也可以通过 `filter-branch` 来一次性修改多个提交中的邮箱地址。 需要小心的是只修改你自己的邮箱地址，所以你使用 `--commit-filter`：

```console
$ git filter-branch --commit-filter '
        if [ "$GIT_AUTHOR_EMAIL" = "schacon@localhost" ];
        then
                GIT_AUTHOR_NAME="Scott Chacon";
                GIT_AUTHOR_EMAIL="schacon@example.com";
                git commit-tree "$@";
        else
                git commit-tree "$@";
        fi' HEAD
```

这会遍历并重写每一个提交来包含你的新邮箱地址。 因为提交包含了它们父提交的 SHA-1 校验和，这个命令会修改你的历史中的每一个提交的 SHA-1 校验和， 而不仅仅只是那些匹配邮箱地址的提交。

## 如何修改第一次commit的信息

因为rebase得有个base，如果要重写第一个commit那第一个commit也不能作为base，就没base可用了。

所以这里就用到下面这个命令：

> ```bash
> git rebase -i --root
> ```

详见：[Stackoverflow - Change first commit of project with Git?](https://stackoverflow.com/questions/2246208/change-first-commit-of-project-with-git/2309391#2309391.)

## 修改此次commit的author信息

> git commit --amend --author="lancelot  <whoami.ace@gmail.com>" --no-edit

## 相关命令详解

### git rebase

```bash
# -i，—interactive
# -i参数会打开互动模式，让用户选择定制rebase的行为。
git rebase -i xxx

# 如果你异常退出了 vi 窗口，不要紧张：
git rebase --edit-todo

# 跳出rebase，会回到rebase前的状态，之前的提交不会丢失
git rebase --abort

# 会引起冲突的commit丢弃掉
git rebase --skip

# 用户修复冲突，提示开发者，一步一步地有没有解决冲突，fix confilicts and then run "git rebase --continue"
git rebase --continue
```

参考：

[Git \- 重写历史](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E9%87%8D%E5%86%99%E5%8E%86%E5%8F%B2)

[git 修改已提交的某一次的邮箱和用户信息 \- SegmentFault 思否](https://segmentfault.com/q/1010000006999861)

[git rebase \-i命令修改commit历史 \- 苍枫露雨 \- 博客园](https://www.cnblogs.com/chrischennx/p/6993734.html)

[git rebase修改历史提交内容 \- 乌合之众 \- 博客园](https://www.cnblogs.com/oloroso/p/9723783.html)