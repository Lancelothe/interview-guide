`findFirst ConcurrentModificationException`

```java
private static final List<String> LIST = Collections.synchronizedList(new ArrayList<>());
//    private static final List<String> LIST = Lists.newCopyOnWriteArrayList();

    private static void reloadList() {
        List<String> newList = Arrays.asList("1", "2", "3");

        LIST.clear();
        LIST.addAll(newList);

        System.out.println("reload list: " + LIST);
    }

    public Optional<String> findById(String id) {
        return LIST.stream().filter(x -> x.equals(id)).findFirst();
    }

    public static void main(String[] args) throws InterruptedException {
        UserPrivilegeService userPrivilegeService = new UserPrivilegeService();
        userPrivilegeListService.scheduleAtFixedRate(UserPrivilegeService::reloadList, 0, 2, TimeUnit.SECONDS);
        String id = "2";
        final String[] res = {"2"};
        for (int i = 0; i < 1000; i++) {
            Optional.ofNullable(id)
                    .ifPresent(x -> res[0] = (userPrivilegeService.findById(id).map(u -> u + " -123").orElse("000")));
            System.out.println(Arrays.toString(res));
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
```



[Java Stream 详解 \| 鸟窝](https://colobu.com/2016/03/02/Java-Stream/#find)

