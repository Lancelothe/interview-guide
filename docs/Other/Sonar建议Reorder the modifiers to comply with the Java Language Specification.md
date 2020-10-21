

`Sonar `提示`Reorder the modifiers to comply with the Java Language Specification`

是建议我们`重新排序修饰符以符合Java语言规范`

反例：`private final static String DD = "测试";`

改成：`private static final String DD = "测试";`

以下是修饰符的顺序：

1. Annotations
2. public
3. protected
4. private
5. abstract
6. static
7. final
8. transient
9. volatile
10. synchronized
11. native
12. strictfp



原文链接：https://blog.csdn.net/qq_34004088/article/details/102843039