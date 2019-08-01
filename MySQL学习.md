# 数据库 
=> 驱动 = 用来实现数据库的程序
## 数据 VS 缓存
1. 数据
- 数据 持久化
- 数据不会丢失,放硬盘里,永久
- 特性: 访问速度快,存储量大,查询速度快,curd… 多个请求的时候,并发.  稳定.     500ms 400ms
- 数据放硬盘
2. 缓存
- 缓存 =>特别快 10ms. 1ms 2ms
- 缓存session,
- redis=> (缓存) 内存

### 储存
- 类似于表格的形式. 关系型数据库mysql,非关系型数据库redis  key=>value

## MySQL

e.g.
#### soso_ordinary_user

  id 唯一标识   主键,btree,autoincrement  1.索引速度最快 2.关联外键 3.唯一
  username  姓名
  mobile_phone 手机号 登录用
  pass_word 密码
  email 邮箱
  create_at 生成时间
  update_at 更新时间

#### soso_user_relationship 关系表
  id 唯一标识   主键
  ordinary_user_id 是谁的朋友
  user_id_who_id 哪位朋友

### 增删改查
#### 查
1. 查  套餐表
`select * from medical_package where id=1;`
2. 排序order by 分页limit 
`select id,ctime,package_id,org_id,user_id from medical_booking order by id desc limit 30,10;`
3. 连表  通过主键连表查找
```sql
select b.id, b.ctime, p.name,o.name,o.level_id,p.price,o.upper_limit_cnt
from medical_booking as b
       left join medical_package as p on b.package_id = p.id
       left join organization as o on b.org_id = o.id
where b.id=263280;
```
4. 分组 根据status分组输出总额
```sql
select status,count(*) cnt from medical_booking group by status;
```
5. 分组进阶1  group by后带经过处理的数据
```sql
select DATE_FORMAT(“y%m”,ctime),count(*) cnt from medical_booking group by DATE_FORMAT(“y-m”,ctime);
```
6. 分组进阶2  group by 后面可以带多个条件
只要2019年以后的数据,每个月的已完成有多少条,取消了多少条…
```sql
# 1.提示 用where
# 2.group by的二次分组
select left(ctime, 7),status, count(*) cnt
  from medical_booking
  where ctime >= “2019-01-01 00:00:00”
  group by left(ctime, 7),status;
```
7. 分组进价3 group by having
2019年以后下单超过100单的用户
```sql
select left(ctime, 7), count(*) cnt
  from medical_booking
  where ctime >= “2019-01-01 00:00:00”
  group by left(ctime, 7) having cnt>=100;
```