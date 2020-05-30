// .vuepress/config.js
module.exports = {
  title: '何小H文档',
  description: '个人总结',
  themeConfig: {
    search: false,
    searchMaxSuggestions: 10,
    sidebar: {
      '/Guide/':[         
        {
            title: 'Java相关',   // 一级菜单名称
            collapsable: false, // false为默认展开菜单, 默认值true是折叠,
            // sidebarDepth: 1,    //  设置侧边导航自动提取markdown文件标题的层级，默认1为h2层级
            children: [
                ['Java基础.md', 'Java基础']  //菜单名称为'子菜单1'，跳转至/pages/folder1/test1.md
            ]
        },
        {
            title: 'Redis相关',
            collapsable: false, 
            children: [
                ['一致性哈希.md', '一致性哈希'],
                ['Redis整理.md', 'Redis整理']
            ]
        }
      ],
      
      //...可添加多个不同的侧边栏，不同页面会根据路径显示不同的侧边栏
    },
    nav: [
      { text: 'Home', link: '/' },                      // 根路径
      { text: 'Guide', link: '/Guide/' },
      { text: 'External', link: 'https://lanzone.top' }, // 外部链接
      // 显示下拉列表
      {
        text: 'Languages',
        items: [
          { text: 'Chinese', link: '/language/chinese' },
          { text: 'Japanese', link: '/language/japanese' }
        ]
      },
      // 下拉列表显示分组
      {
        text: '高级',
        items: [
          { 
            text: '算法', 
            items: [
              { text: '冒泡', link: '/language/chinese' },
              { text: '快速', link: '/language/japanese' }
            ] 
          },
          { 
            text: '设计模式', 
            items: [
              { text: '工厂', link: '/language/chinese' },
              { text: '单例', link: '/language/chinese'},
            ] 
          },
        ]
      }
    ]
  }
}



