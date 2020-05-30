#!/usr/bin/env sh

# 进入到项目根目录
PWD="$( cd "$( dirname "$0"  )" && pwd  )"
DIR=$(dirname "$PWD") 
cd $DIR

echo '开始执行命令'

# 进入生成的文件夹
echo "执行命令：cd ./vuepress_config\n"
cd ./vuepress_config

# 初始化一个仓库，仅仅是做了一个初始化的操作，项目里的文件还没有被跟踪
echo "执行命令：git init\n"
git init

# 设置新仓库提交使用的用户名和邮箱
echo "设置用户名和邮箱"
git config user.name "lancelothe"
git config user.email "whoami.ace@gmail.com"

# 保存所有的修改
echo "执行命令：git add -A"
git add -A

# 把修改的文件提交
echo "执行命令：commit -m 'deploy'"
git commit -m 'deploy'

# 如果发布到 https://<USERNAME>.github.io/<REPO>
echo "执行命令：git push -f https://github.com/yulilong/book.git master:gh-pages"
git push -f https://github.com/Lancelothe/interview-guide.git master:vue-press

# 返回到上一次的工作目录
echo "回到刚才工作目录"
cd -
