# Redis代替session的业务

## 业务场景

### 1. 用户登录认证
- **邮箱/手机号+密码登录**
  - 用户输入邮箱/手机号和密码进行登录
  - 服务端验证通过后，生成唯一token作为用户凭证
  - 将token作为key，用户信息作为value存入Redis
  - 设置合理的过期时间（如7天）

- **验证码登录**
  - 用户输入手机号/邮箱，请求发送验证码
  - 服务端生成6位验证码，以`login:code:{手机号/邮箱}`为key存入Redis
  - 设置5分钟过期时间
  - 用户提交验证码，服务端进行比对验证

### 2. 会话管理
- **用户信息缓存**
  - 用户登录后，将用户基本信息、权限等存入Redis
  - 使用Hash结构存储，key格式：`user:token:{token}`
  - 包含字段：userId, username, avatar, roles等

- **登录设备管理**
  - 支持多设备同时在线
  - 使用Set结构存储用户的所有登录设备token
  - 实现单点登录/登出功能

### 3. 安全控制
- **登录失败限制**
  - 记录登录失败次数，防止暴力破解
  - 使用`login:fail:{账号}`作为key，设置过期时间
  - 达到阈值后临时锁定账号

- **敏感操作验证**
  - 修改密码、更换绑定手机等操作需要二次验证
  - 生成临时token，短时间有效
  - 验证通过后方可执行敏感操作

## 数据结构设计

### 前端实践

- **request.d.ts**

>  定义请求接口

```typescript
declare module '@/utils/request' {
  interface RequestConfig {
    url: string;
    method: string;
    data?: Record<string, unknown>;
    // 其他配置项可以根据需要添加
  }

  export default function request(config: RequestConfig): Promise<unknown>;
}

// 通用响应接口
export interface Request<T> {
  code: number
  message: string
  data: T
}
```

- **request.ts**

> 前端使用axios进行http请求，使用service.interceptors进行请求拦截

```typescript
import axios from 'axios'
import type { Request } from '@/utils/request/request.d'

// 创建一个 axios 实例
const service = axios.create({
  baseURL: '后端地址',
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 排除登录和注册接口
    const publicPaths = ['登录', '注册'];
    const isPublicPath = publicPaths.some(path => config.url?.endsWith(path));

    const token = localStorage.getItem('token');

    // 如果不是公开路径且没有token，直接拒绝请求
    if (!isPublicPath && !token) {
      window.location.href = '前端登录页面地址';
      return Promise.reject('No token available');
    }

    // 添加token到请求头
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error(error)
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return response.data?.data ?? (response.data as Request<unknown>)
    } else {
      return Promise.reject({
        code: response.status,
        message: response.data?.message || '请求失败',
        data: response.data,
      })
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // 触发全局登出逻辑
      window.dispatchEvent(new CustomEvent('unauthorized'))
    }
    return Promise.reject({
      code: error.response?.status || 500,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    })
  },
)
export default service
```

### 后端实践

- **LoginController**

```java
package com.david.hlp.web.system.auth;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class LoginController {

    private static final String Login_Token_KEY = "login:token:";

    /**
     * 用户登录
     *
     * @param request 登录请求信息
     * @return 登录令牌
     */
    @PostMapping("/login")
    public Result<Token> login(@RequestBody final LoginDTO request) {
        Objects.requireNonNull(request, "登录请求不能为空");
        if (Objects.isNull(request.getEmail()) || Objects.isNull(request.getPassword())) {
            log.warn("登录失败: 请求参数不完整, email={}", request.getEmail());
            throw new BusinessException(ResultCode.BAD_REQUEST);
        }
        try {
            final Token token = authService.login(request);
            HashMap<String, Object> map = new HashMap<>();
            map.put("userid", token.getUserId().toString());
            map.put("username", token.getUsername());
            map.put("avatar", token.getAvatar());
            map.put("roles", token.getRoles());
            map.put("permissions", token.getPermissions());
            redisCache.setCacheMap(Login_Token_KEY +token.getToken(), map, 18L, TimeUnit.HOURS);
            return Result.success(token);
        } catch (final Exception e) {
            log.error("用户登录异常: email={}, 错误={}", request.getEmail(), e.getMessage(), e);
            return Result.error(ResultCode.INTERNAL_ERROR, "登录失败: " + e.getMessage());
        }
    }

}
```

- **JwtAuthenticationFilter**

```java
package com.david.hlp.web.system.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.util.Assert;

/**
 * JWT 认证过滤器。
 *
 * 该过滤器会在每次请求时运行一次，用于验证 JWT 并设置用户的认证信息到 Spring Security 的上下文中。
 */
@Slf4j
@Component
@RequiredArgsConstructor // 自动生成包含所有必需依赖项的构造函数
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  // 用于处理 JWT 的服务类
  private final JwtService jwtService;

  // 用于加载用户详细信息
  @Qualifier("userDetailsService")
  private final UserDetailsService userDetailsService;

  private final String[] publicPaths = {
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/logout",
      "/api/auth/refresh-token",
      "/api/repeater/auth/login",
  };

  /**
   * 核心过滤逻辑。
   *
   * @param request     HTTP 请求对象
   * @param response    HTTP 响应对象
   * @param filterChain 过滤器链，用于继续执行后续过滤器
   * @throws ServletException 如果过滤过程中出现问题
   * @throws IOException      如果发生 I/O 错误
   */
  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain) throws ServletException, IOException {
    // 记录请求信息：IP、路径和HTTP方法，使用键值对格式方便日志分析
    String clientIP = request.getRemoteAddr();
    String path = request.getServletPath();
    String method = request.getMethod();
    String userAgent = request.getHeader("User-Agent");
    long timestamp = System.currentTimeMillis();

    // 使用键值对格式记录日志，便于后期数据分析
    log.info("ACCESS|ts={}|ip={}|path={}|method={}|ua={}",
        timestamp, clientIP, path, method, userAgent != null ? userAgent : "-");

    // 总是允许 OPTIONS 请求通过（CORS预检请求）
    if (request.getMethod().equals("OPTIONS")) {
      filterChain.doFilter(request, response);
      return;
    }

    // 1. 检查是否为公开路径
    boolean isPublicPath = Arrays.stream(publicPaths).anyMatch(path::startsWith);

    // 2. 检查Authorization头
    final String authHeader = request.getHeader("Authorization");

    // 3. 如果不是公开路径且没有有效token，直接返回401
    if (!isPublicPath && (authHeader == null || !authHeader.startsWith("Bearer "))) {
      log.warn("拒绝访问：路径 {} 需要授权但未提供有效token", path);
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }

    // 4. 如果是公开路径，允许通过
    if (isPublicPath) {
      filterChain.doFilter(request, response);
      return;
    }

    try {
      // 5. 处理正常的带token请求
      final String jwt = authHeader.substring(7);
      Assert.hasText(jwt, "Token不能为空");
      // 验证用户并设置认证信息
      if (SecurityContextHolder.getContext().getAuthentication() == null) {
        // 从 UserDetailsService 加载用户信息
        UserDetails userDetails;
        try {
          userDetails = this.userDetailsService.loadUserByUsername(jwt);
        } catch (Exception e) {
          log.error("加载用户信息失败: {}", e.getMessage());
          response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
          return;
        }

        // 直接从UserDetails获取权限
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            userDetails,
            null,
            userDetails.getAuthorities());

        // 设置认证请求的详细信息
        authToken.setDetails(
            new WebAuthenticationDetailsSource().buildDetails(request));

        // 确保在认证成功后设置SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authToken);
      }
    } catch (Exception e) {
      log.error("JWT认证过程发生错误: {}", e.getMessage());
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }

    filterChain.doFilter(request, response);
  }
}
```

- **UserDetailsServiceImpl**

```java
package com.david.hlp.web.system.service.imp;

// Java核心导入
import org.springframework.util.Assert;
// Spring框架导入
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.david.hlp.web.common.util.RedisCache;
import com.david.hlp.web.system.entity.auth.AuthUser;

// Lombok导入
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 用户详情服务实现类
 * 实现Spring Security的UserDetailsService接口
 * 用于加载用户特定数据的核心接口
 *
 * @author david
 * @since 1.0
 */
@Slf4j
@Service("userDetailsService")
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final RedisCache redisCache;
    private static final String Login_Token_KEY = "login:token:";

    /**
     * 根据用户邮箱加载用户详情
     *
     * @param Token 用户Token
     * @return UserDetails 用户详情
     * @throws UsernameNotFoundException 当用户不存在时抛出此异常
     */
    @Override
    public UserDetails loadUserByUsername(String Token) throws UsernameNotFoundException {
        Assert.hasText(Token, "Token不能为空");
        // 尝试通过邮箱查找用户
        AuthUser user = redisCache.getCacheObject(Login_Token_KEY + Token);
        if (user == null) {
            log.warn("User not found with Token: {}", Token);
            throw new UsernameNotFoundException("用户并未登录");
        }
        Assert.notNull(user.getRoleId(), "用户角色ID不能为空");
        Assert.notNull(user.getUserId(), "用户ID不能为空");
        Assert.notNull(user.getAuthorities(), "用户权限列表不能为空");
        return user;
    }
}
```

## 最佳实践

1. **合理设置过期时间**
   - 会话token：建议7-30天
   - 验证码：5-10分钟
   - 临时token：10-30分钟

2. **安全建议**
   - 使用HTTPS传输
   - Token设置httpOnly和Secure属性
   - 定期轮换密钥
   - 记录登录日志

3. **性能优化**
   - 使用Pipeline批量操作
   - 合理使用连接池
   - 避免大Key和热Key问题

4. **高可用**
   - 配置Redis主从复制
   - 开启持久化
   - 监控Redis性能指标

## 常见问题

1. **会话失效问题**
   - 实现token续期机制
   - 使用Redisson的看门狗机制

2. **分布式会话一致性**
   - 使用Redis Cluster保证数据分片
   - 配置合理的主从复制策略

3. **缓存击穿/穿透**
   - 对不存在的key设置空值
   - 使用布隆过滤器

4. **数据一致性**
   - 使用Redis事务
   - 实现最终一致性方案