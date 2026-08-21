---
title: Docker 基础与容器化：镜像分层、数据卷、网络与 Compose 快照
capturedAt: 2026-08-21 00:00:00+08:00
sourceType: personal-notes-and-fuwari
sourceUrl: "https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9"
immutable: true
tags: [Docker, Container, Compose, Image, Volume, Network]
description: 来自 Personal-markdown-notes docker 目录 7 篇原文的聚合证据快照，固定提交 bbb2126，涵盖 Dockerfile、分层、数据卷、网络与 Compose。
---

# Docker 基础与容器化：镜像分层、数据卷、网络与 Compose 快照

本文件为聚合证据快照（immutable raw），按 LLM-Wiki 规范原样收录多篇来源原文，不改动正文，仅增加 provenance 头部与分隔。后续 wiki 页通过 `sources: ["{slug}"]` 引用本快照。

- raw slug: `ingest-docker-fundamentals`
- 对应 wiki: `docker-fundamentals`
- Personal-markdown-notes 固定提交: `bbb2126`（`https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9`）
- Fuwari 固定提交: `07cee2b`（`https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52`）
- 捕获方式: `gh repo clone --depth 1` 后按路径分组，原样拼接，空文件与完全重复文件已标注但未删改内容

## 来源清单

| 序号 | 仓库 | 相对路径 | 大小 | 去重标注 |
| --- | --- | --- | --- | --- |
| 1 | Personal-markdown-notes | `docker/DockerCompose.md` | 6223 |  |
| 2 | Personal-markdown-notes | `docker/Dockerfile基础.md` | 3882 |  |
| 3 | Personal-markdown-notes | `docker/Docker常见命令.md` | 4343 |  |
| 4 | Personal-markdown-notes | `docker/Docker数据卷.md` | 4801 |  |
| 5 | Personal-markdown-notes | `docker/Docker本地目录挂载.md` | 6527 |  |
| 6 | Personal-markdown-notes | `docker/Layer和BaseImage概念.md` | 8607 |  |
| 7 | Personal-markdown-notes | `docker/容器网络连接.md` | 7212 |  |

## 免责与边界

- 黑马课程、实战 156KB、Feed 流等笔记含课程截图、本地路径、未验证配置，未作可复现实验复核，仅作证据保存。
- Fuwari 部分文章含零宽度字符（如 `OptimisticvsPessimisticLocking​.md` 路径含 `\u200b`），已按原样保留文件名。
- 个人笔记中的 `redis/业务/事务的作用域.md` 为空文件（仅 1 字节换行），已保留记录。
- 本快照不改写任何原文；冲突或过时结论由 wiki 层显式标注。

---

## 来源 1: Personal-markdown-notes / `docker/DockerCompose.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/docker/DockerCompose.md>
- 本地路径: `docker/DockerCompose.md`

```markdown
## Docker Compose

**Docker Compose** 是一个用于定义和运行多容器 Docker 应用的工具。它允许你使用一个简单的 YAML 文件来描述应用的服务、网络和卷等，之后只需要一条命令就可以启动和管理应用的所有容器。

Docker Compose 特别适合开发、测试和生产环境中，涉及多个容器服务协作的应用程序，如微服务架构。通过 Compose，你可以定义容器服务的依赖关系、共享卷、端口映射、环境变量等。

### Docker Compose 的基本概念

1. **服务（Services）**：服务是 Docker 容器的抽象。一个服务代表一个容器的配置，比如它使用的镜像、环境变量、端口映射等。
2. **网络（Networks）**：Docker Compose 支持容器间的网络通信，默认情况下，所有在同一个 `docker-compose.yml` 文件中的容器都会共享一个自定义网络。
3. **卷（Volumes）**：卷用于持久化容器中的数据，确保容器删除或重新创建时数据不会丢失。

### Docker Compose 工作流程

1. **定义（Define）**：你可以通过一个 `docker-compose.yml` 文件来定义你的应用，包括服务、网络和卷的配置。
2. **启动（Start）**：通过一条命令启动应用，Compose 会自动构建并启动所有容器。
3. **停止和管理（Manage）**：你可以使用命令来停止、重新启动、查看日志等操作。

### Docker Compose 基本命令

1. **启动所有服务**
   ```bash
   docker-compose up
   ```

   这个命令会启动 `docker-compose.yml` 中定义的所有服务。

2. **在后台启动所有服务**
   ```bash
   docker-compose up -d
   ```

   使用 `-d` 参数让服务在后台运行。

3. **停止所有服务**
   ```bash
   docker-compose down
   ```

   这个命令会停止并删除所有服务容器，同时删除网络和卷（除非它们被标记为外部卷）。

4. **查看服务的状态**
   ```bash
   docker-compose ps
   ```

   列出当前项目中所有正在运行的容器。

5. **查看服务的日志**
   ```bash
   docker-compose logs
   ```

   查看所有服务的日志，或指定某个服务的日志。

6. **重启服务**
   ```bash
   docker-compose restart
   ```

   这个命令会重启所有的服务，或者你可以指定特定的服务。

7. **构建镜像**
   ```bash
   docker-compose build
   ```

   使用 Compose 文件中定义的配置，构建服务所需的 Docker 镜像。

8. **拉取镜像**
   ```bash
   docker-compose pull
   ```

   从远程仓库中拉取镜像。

### Docker Compose 文件结构

官方 Docker Compose 文件结构和语法的详细文档可以在以下链接中找到：[Compose File Reference](https://docs.docker.com/compose/compose-file/)

Docker Compose 使用 `docker-compose.yml` 文件来定义多容器应用。该文件使用 YAML 格式。

#### `docker-compose.yml` 的基本结构：

```yaml
version: '3'
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
    networks:
      - webnet

  db:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: example
    volumes:
      - dbdata:/var/lib/mysql
    networks:
      - webnet

volumes:
  dbdata:

networks:
  webnet:
```

### 解释：
1. **version**：指定 Compose 文件的版本。在 Docker Compose 3.x 中推荐使用 `version: '3'`。
2. **services**：定义应用中的各个服务。在上面的例子中，定义了 `web` 和 `db` 两个服务。
   - `web`：使用 `nginx:alpine` 镜像，端口映射为宿主机的 `8080` 端口对应容器的 `80` 端口。
   - `db`：使用 `mysql:5.7` 镜像，设置环境变量 `MYSQL_ROOT_PASSWORD`，并使用 `dbdata` 卷来存储 MySQL 数据。
3. **volumes**：定义数据卷，用于持久化数据。上面的例子中，`dbdata` 被挂载到 MySQL 容器的 `/var/lib/mysql` 目录。
4. **networks**：定义网络，用于不同服务之间的通信。`web` 和 `db` 服务共享同一个 `webnet` 网络。

### 示例：创建一个带有 Nginx 和 MySQL 的 Web 应用

#### 步骤 1：创建 `docker-compose.yml`

```yaml
version: '3'  # 指定 Docker Compose 文件的版本

services:  # 定义服务
  web:  # 定义名为 "web" 的服务
    image: nginx:alpine  # 使用 nginx:alpine 镜像
    ports:
      - "8080:80"  # 将宿主机的8080端口映射到容器的80端口
    volumes:
      - ./html:/usr/share/nginx/html  # 将当前目录的 html 文件夹挂载到容器内的指定路径
    environment:  # 设置环境变量
      - NGINX_HOST=localhost
      - NGINX_PORT=80
    networks:
      - webnet  # 该服务连接到自定义网络 "webnet"

  db:  # 定义名为 "db" 的数据库服务
    image: mysql:5.7  # 使用 mysql:5.7 镜像
    environment:
      MYSQL_ROOT_PASSWORD: example  # 设置 MySQL 的 root 密码
    volumes:
      - dbdata:/var/lib/mysql  # 将数据库数据持久化存储到数据卷 "dbdata"
    networks:
      - webnet  # 该服务连接到自定义网络 "webnet"

volumes:  # 定义卷
  dbdata:  # 持久化数据库的数据

networks:  # 定义网络
  webnet:  # 创建一个名为 "webnet" 的网络
```

#### 步骤 2：创建目录结构

在与 `docker-compose.yml` 同一个目录下，创建 `html` 目录，并放入一个 `index.html` 文件，作为 Nginx 的 Web 根目录。

```bash
mkdir html
echo "<h1>Hello, Docker Compose!</h1>" > html/index.html
```

#### 步骤 3：启动应用

使用以下命令启动服务：

```bash
docker-compose up -d
```

现在，Nginx 服务运行在 `localhost:8080`，MySQL 数据库也已经启动。

### Docker Compose 的常用参数

1. **`docker-compose up` 的常用参数**：
   - `-d`：在后台启动服务。
   - `--build`：强制重新构建服务所需的镜像。
   - `--force-recreate`：强制重新创建容器，即使配置未发生变化。

2. **`docker-compose down` 的常用参数**：
   - `-v`：删除与服务关联的卷。

3. **`docker-compose logs` 的常用参数**：
   - `-f`：实时输出日志。

4. **`docker-compose ps` 的常用参数**：
   - `-q`：只显示容器的 ID。
   - `--services`：只列出服务名称。
```

## 来源 2: Personal-markdown-notes / `docker/Dockerfile基础.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/docker/Dockerfile基础.md>
- 本地路径: `docker/Dockerfile基础.md`

```markdown
## Dockerfile语法

`Dockerfile` 是一个包含一系列命令的文本文件，用于定义如何构建 Docker 镜像。通过编写 `Dockerfile`，你可以自定义镜像，设置环境、安装软件、复制文件、配置入口点等。

### Dockerfile 基本语法

1. **FROM**：指定基础镜像，所有镜像都是从一个基础镜像开始的。
   ```dockerfile
   FROM <镜像名>:<标签>
   ```
   **示例**：
   ```dockerfile
   FROM ubuntu:20.04
   ```

2. **RUN**：执行命令来安装软件包或执行其他操作。每一个 `RUN` 命令都会创建一个新的镜像层。
   ```dockerfile
   RUN <命令>
   ```
   **示例**：
   ```dockerfile
   RUN apt-get update && apt-get install -y nginx
   ```

3. **COPY**：将文件或目录从宿主机复制到镜像中。
   ```dockerfile
   COPY <源路径> <目标路径>
   ```
   **示例**：
   ```dockerfile
   COPY ./index.html /var/www/html/index.html
   ```

4. **ADD**：功能与 `COPY` 类似，但支持解压归档文件和从 URL 下载文件。
   ```dockerfile
   ADD <源路径/URL> <目标路径>
   ```

5. **WORKDIR**：设置接下来的工作目录，如果目录不存在，Docker 会为你创建它。
   ```dockerfile
   WORKDIR <路径>
   ```

6. **CMD**：设置容器启动时执行的默认命令，但可以被 `docker run` 提供的命令覆盖。
   ```dockerfile
   CMD ["<可执行文件>", "<参数1>", "<参数2>"]
   ```
   **示例**：
   ```dockerfile
   CMD ["nginx", "-g", "daemon off;"]
   ```

7. **ENTRYPOINT**：和 `CMD` 类似，用于指定容器启动时运行的主进程。与 `CMD` 不同的是，它不会被覆盖。
   ```dockerfile
   ENTRYPOINT ["<可执行文件>", "<参数1>", "<参数2>"]
   ```

8. **ENV**：设置环境变量，容器在运行时可以使用这些变量。
   ```dockerfile
   ENV <环境变量名>=<值>
   ```
   **示例**：
   ```dockerfile
   ENV LANG C.UTF-8
   ```

9. **EXPOSE**：声明容器要暴露的端口号，但不会自动打开端口。需要使用 `-p` 或 `-P` 来映射端口。
   ```dockerfile
   EXPOSE <端口号>
   ```

10. **VOLUME**：声明容器中的挂载点，用于持久化数据。
   ```dockerfile
   VOLUME ["/data"]
   ```

11. **USER**：切换用户，之后的命令将以指定用户的身份运行。
   ```dockerfile
   USER <用户名/UID>
   ```

### 自定义镜像

通过 `Dockerfile`，你可以构建完全自定义的镜像，包含你需要的软件、配置和依赖。以下是构建自定义镜像的基本步骤：

1. **编写 Dockerfile**：
   创建一个包含必要指令的 `Dockerfile`，例如安装软件、配置环境等。

2. **构建镜像**：
   使用 `docker build` 命令基于 `Dockerfile` 构建镜像。

   ```bash
   docker build -t <镜像名>:<标签> <Dockerfile所在路径>
   ```

   **示例**：
   ```bash
   docker build -t my_custom_image:1.0 .
   ```

3. **运行镜像**：
   使用 `docker run` 来启动基于自定义镜像的容器。

   ```bash
   docker run -d --name my_container my_custom_image:1.0
   ```

### 示例：创建一个包含 Nginx 和自定义网页的镜像

```dockerfile
# 使用官方的 Nginx 基础镜像
FROM nginx:alpine

# 设置环境变量
ENV NGINX_VERSION=alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 复制自定义的网页到 Nginx 的默认目录
COPY ./index.html /usr/share/nginx/html/index.html

# 添加一个额外文件（支持解压归档文件）
ADD ./static.zip /usr/share/nginx/html/

# 暴露 Nginx 端口 80
EXPOSE 80

# 声明一个卷用于数据持久化
VOLUME ["/usr/share/nginx/html"]

# 使用一个非 root 用户来运行应用
USER nginx

# 设置默认的入口命令，保持 Nginx 在前台运行
CMD ["nginx", "-g", "daemon off;"]

# 设置可执行文件和参数（ENTRYPOINT 通常与 CMD 搭配使用）
ENTRYPOINT ["nginx"]
```
```

## 来源 3: Personal-markdown-notes / `docker/Docker常见命令.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/docker/Docker常见命令.md>
- 本地路径: `docker/Docker常见命令.md`

```markdown
## 常见命令

### 1. **拉取镜像**
   ```bash
   docker pull <镜像名>:<标签>
   ```
   **常用参数**：
   - `<镜像名>`：要拉取的镜像名称。
   - `<标签>`：镜像的版本标签（如`latest`、`8.0`等）。

   **示例**：
   ```bash
   docker pull nginx:latest
   ```

### 2. **推送镜像**
   ```bash
   docker push <镜像名>:<标签>
   ```
   **常用参数**：
   - `<镜像名>`：要推送的镜像名称，通常为`<Docker Hub用户名>/<镜像名>`。
   - `<标签>`：镜像的版本标签。

   **示例**：
   ```bash
   docker push myrepo/myimage:1.0
   ```

<div align="center">
  <img src="./image/docker-push-pull.png" />
  <p style="margin-top: 2px;">docker push 和 docker pull</p>
</div>

### 3. **查看本地镜像**
   ```bash
   docker images
   ```
   **常用参数**：
   - `-q`：只显示镜像的ID。
   - `-a`：显示所有镜像，包括中间层镜像。

   **示例**：
   ```bash
   docker images -a
   ```

### 4. **删除镜像**
   ```bash
   docker rmi <镜像ID或名称>
   ```
   **常用参数**：
   - `-f`：强制删除正在使用的镜像。

   **示例**：
   ```bash
   docker rmi nginx:latest
   ```

<div align="center">
  <img src="./image/docker-rmi.png" />
  <p style="margin-top: 2px;">docker rmi</p>
</div>

### 5. **构建镜像**
   ```bash
   docker build -t <镜像名>:<标签> <Dockerfile所在目录>
   ```
   **常用参数**：
   - `-t`：为构建的镜像命名并打标签。
   - `--no-cache`：不使用缓存，强制重新构建镜像。

   **示例**：
   ```bash
   docker build -t myapp:1.0 .
   ```

<div align="center">
  <img src="./image/docker-build.png" />
  <p style="margin-top: 2px;">docker build</p>
</div>

### 6. **打包镜像**
   ```bash
   docker save -o <文件名.tar> <镜像名>:<标签>
   ```
   **常用参数**：
   - `-o`：指定保存的文件名。

   **示例**：
   ```bash
   docker save -o myapp.tar myapp:1.0
   ```
      
<div align="center">
  <img src="./image/docker-save.png" />
  <p style="margin-top: 2px;">docker save</p>
</div>

### 7. **挂载打包的镜像**
   ```bash
   docker load -i <文件名.tar>
   ```
   **示例**：
   ```bash
   docker load -i myapp.tar
   ```
   
<div align="center">
  <img src="./image/docker-build.png" />
  <p style="margin-top: 2px;">docker load</p>
</div>

### 8. **运行镜像**
   ```bash
   docker run -d -p <主机端口>:<容器端口> --name <容器名> <镜像名>:<标签> -v<数据卷>:<容器内目录>
   ```
   **常用参数**：
   - `-d`：后台运行容器。
   - `-p`：端口映射。
   - `--name`：为容器命名。
   - `-v`：挂载数据卷

   **示例**：
   ```bash
   docker run -d -p 8080:80 --name mynginx nginx:latest -v /spark：/opt/spark
   ```

### 9. **停止容器**
   ```bash
   docker stop <容器ID或名称>
   ```

   **示例**：
   ```bash
   docker stop mynginx
   ```

### 10. **启动容器**
   ```bash
   docker start <容器ID或名称>
   ```

   **示例**：
   ```bash
   docker start mynginx
   ```

<div align="center">
  <img src="./image/docker-run-stop-start.png" />
  <p style="margin-top: 2px;">docker run 、 docker stop 和 docker start</p>
</div>

### 11. **查看容器运行状态**
   ```bash
   docker ps
   ```
   **常用参数**：
   - `-a`：显示所有容器（包括未运行的）。
   - --format{}：格式化输出
    
   **示例**：
   ```bash
   docker ps -a
   ```

### 12. **删除容器**
   ```bash
   docker rm <容器ID或名称>
   ```
   **常用参数**：
   - `-f`：强制删除正在运行的容器。

   **示例**：
   ```bash
   docker rm mynginx
   ```
   
<div align="center">
  <img src="./image/docker-rm.png" />
  <p style="margin-top: 2px;">docker rm</p>
</div>

### 13. **查看运行容器日志**
   ```bash
   docker logs <容器ID或名称>
   ```
   **常用参数**：
   - `-f`：实时输出日志。
   - `--tail`：显示日志的最后N行。

   **示例**：
   ```bash
   docker logs -f mynginx
   ```

### 14. **进入容器内部**
   ```bash
   docker exec -it <容器ID或名称> /bin/bash
   ```
   **常用参数**：
   - `-it`：允许交互式终端进入容器。
   - `/bin/bash`：进入容器后使用的Shell。

   **示例**：
   ```bash
   docker exec -it mynginx /bin/bash
   ```
```

## 来源 4: Personal-markdown-notes / `docker/Docker数据卷.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/docker/Docker数据卷.md>
- 本地路径: `docker/Docker数据卷.md`

```markdown
## 数据卷

> 数据卷（Volume）是一个虚拟目录，是容器内目录与宿主机目录之间映射的桥梁，这种映射是双向的

数据卷（Volume）是 Docker 中一种持久化数据的机制，允许你将数据从容器内保存到宿主机的指定位置。通过数据卷，容器可以方便地共享、存储和管理数据。它主要解决了容器中的数据不会随着容器删除而丢失的问题。

### 数据卷的特点：
1. **持久化存储**：数据卷可以将容器内的数据存储到宿主机的文件系统中，确保容器删除后数据依然存在。
2. **数据共享**：多个容器可以共享同一个数据卷，实现跨容器的数据访问和同步。
3. **独立于容器生命周期**：数据卷的生命周期独立于容器，即使容器删除，数据卷上的数据仍然保留。
4. **性能优化**：数据卷可以避免数据复制带来的性能开销，直接与宿主机文件系统交互，速度更快。
5. **备份和迁移方便**：可以轻松将数据卷中的数据进行备份或迁移到其他主机。

<div align="center">
  <img src="https://davidhlp.asia/d/HLP/Blog/docker/accb058285f227f6608d1fe1e8239b63.png" />
</div>

> 数据卷只能在创建容器（`docker run`）的时候挂载，以及创建的容器无法再挂载数据卷

### 数据卷操作常见命令

#### 1. **创建数据卷**

```bash
docker volume create <卷名>
```

**示例**：
```bash
docker volume create my_volume
```

这个命令会创建一个名为 `my_volume` 的数据卷。如果不提供卷名，Docker 会自动生成一个随机名称。

- **常用参数**：
  - 没有额外的参数，使用默认设置创建卷。如果需要自定义驱动或其他选项，可以通过 `--driver` 和 `--opt` 指定，但这是高级选项，通常不需要。

```bash
docker volume create --driver local --opt type=tmpfs --opt device=tmpfs my_tmpfs_volume
```

- `--driver`：指定卷的驱动程序（如 `local`）。
- `--opt`：提供额外的选项配置卷的类型和设备。
  - 常见参数：
    - **`type`**：指定文件系统类型，常见值包括 `tmpfs`（将数据存储在内存中，不持久化）、`none`（无文件系统类型，用于绑定宿主机目录）。
    - **`device`**：指定宿主机上的设备或路径，或在 `tmpfs` 的情况下，指定 `tmpfs` 本身。
    - **`o`**：挂载选项，用于设置卷的额外参数。常见值有：
      - **`size`**：限制 `tmpfs` 卷的最大内存使用大小（例如 `size=100m` 表示 100 MB）。
      - **`bind`**：用于绑定宿主机目录到容器。
      - **`ro`**：只读挂载，防止容器对数据卷进行写入。

#### 2. **查看所有数据卷**

```bash
docker volume ls
```

**示例**：
```bash
docker volume ls
```

- **常用参数**：
  - `-q`：只显示卷的名称，而不是完整的列表信息。
  
  **示例**：
  ```bash
  docker volume ls -q
  ```

#### 3. **删除指定数据卷**

```bash
docker volume rm <卷名>
```

**示例**：
```bash
docker volume rm my_volume
```

- **常用参数**：
  - `-f`：强制删除卷，即使卷被某个容器使用时也能删除。

  **示例**：
  ```bash
  docker volume rm -f my_volume
  ```

#### 4. **查看某个数据卷的详情**

```bash
docker volume inspect <卷名>
```

**示例**：
```bash
docker volume inspect my_volume
```

这会返回指定数据卷的详细信息（JSON 格式），包括存储路径、驱动程序、挂载点等。

#### 5. **清除未使用的数据卷**

```bash
docker volume prune
```

**示例**：
```bash
docker volume prune
```

此命令会清理所有未被使用的“悬空”数据卷。它会要求你确认清理，输入 `y` 后执行。

- **常用参数**：
  - `-f`：跳过确认步骤，直接删除未使用的卷。

  **示例**：
  ```bash
  docker volume prune -f
  ```
#### 6. **查看容器元数据**

```bash
docker inspect <容器名或容器ID>
```

`docker inspect` 命令用于查看容器的详细元数据信息，包括其配置、状态、网络设置、挂载卷等信息，输出为 JSON 格式。

**示例**：
```bash
docker inspect my_container
```

这将返回容器 `my_container` 的所有元数据。

- **常用参数**：
  - `--format`：自定义输出格式，用于筛选所需的信息。
  
  **示例**：
  仅查看容器的 IP 地址：
  ```bash
  docker inspect --format='{{.NetworkSettings.IPAddress}}' my_container
  ```

  查看容器的状态信息：
  ```bash
  docker inspect --format='{{.State.Status}}' my_container
  ```

>- 在执行docker run命令时，使用 -V 数据卷：容器 内目录可以完成数据卷挂载
>- 当创建容器时，如果挂载了数据卷且数据卷不存在，会自动创建数据卷
```

## 来源 5: Personal-markdown-notes / `docker/Docker本地目录挂载.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/docker/Docker本地目录挂载.md>
- 本地路径: `docker/Docker本地目录挂载.md`

```markdown
## 本地目录挂载

> 这种挂载存在一些匿名卷

本地目录挂载（Bind Mount）是 Docker 中的一种机制，它允许你将宿主机的文件或目录挂载到容器内的指定路径。这使得容器可以直接访问和修改宿主机上的文件或目录，通常用于数据共享、持久化存储或使用宿主机上的配置文件。

### 本地目录挂载的特点：
- **双向同步**：容器和宿主机之间的数据是双向同步的，容器内对挂载目录的修改会直接反映在宿主机上，反之亦然。
- **持久化**：与 Docker 卷类似，挂载的目录可以实现数据持久化，但与 Docker 卷不同，绑定挂载完全由宿主机的文件系统管理。
- **灵活性**：允许你选择宿主机上的任何路径进行挂载，适合需要直接操作宿主机文件的场景。

### 使用 `docker run` 挂载本地目录

> 挂载的时候使用的是绝对路径

可以在创建容器时使用 `--mount` 或 `-v`（`--volume`）选项将宿主机的目录或文件挂载到容器内。

#### 1. **使用 `--mount`**

这是推荐的现代方式，语法清晰，适合复杂的挂载场景。

```bash
docker run -d --mount type=bind,source=<宿主机路径>,target=<容器路径> <镜像名>
```

- `type=bind`：表示使用绑定挂载。
- `source=<宿主机路径>`：宿主机上的目录或文件路径。
- `target=<容器路径>`：容器内的挂载点路径。

**示例**：
将宿主机的 `/home/user/data` 目录挂载到容器的 `/app/data` 目录：
```bash
docker run -d --mount type=bind,source=/home/user/data,target=/app/data nginx
```

#### 2. **使用 `-v`**

这是早期的方式，仍然广泛使用，但在处理更复杂的挂载场景时可读性不如 `--mount` 高。

```bash
docker run -d -v <宿主机路径>:<容器路径> <镜像名>
```

**示例**：
将宿主机的 `/home/user/data` 目录挂载到容器的 `/app/data` 目录：
```bash
docker run -d -v /home/user/data:/app/data nginx
```

### 挂载本地目录的常见参数

1. **只读挂载**：你可以使用 `readonly` 参数将宿主机的目录以只读模式挂载到容器，防止容器对目录进行写操作。

   **示例**：
   ```bash
   docker run -d --mount type=bind,source=/home/user/config,target=/app/config,readonly nginx
   ```

2. **挂载文件而非目录**：你也可以挂载单个文件，而不仅仅是目录。

   **示例**：
   ```bash
   docker run -d --mount type=bind,source=/home/user/config/app.conf,target=/etc/app.conf nginx
   ```

3. **临时文件系统（`tmpfs`）挂载**：除了绑定宿主机目录，你还可以使用 `tmpfs` 将临时文件系统挂载到容器内，所有数据都会保存在内存中。

   **示例**：
   ```bash
   docker run -d --mount type=tmpfs,target=/app/tmp nginx
   ```

### 查看挂载的卷和目录

你可以使用 `docker inspect` 查看容器的详细信息，包括哪些目录被挂载：

```bash
docker inspect <容器ID或容器名>
```

这将返回 JSON 格式的输出，其中包含卷和挂载信息。

## 匿名卷

在 Docker 中，绑定挂载（Bind Mount）有时会涉及匿名卷的概念，尤其是当你使用 `docker run` 命令时，默认情况下 Docker 会为某些情况创建匿名卷，这些匿名卷可能会引起混淆。让我们来解释一下匿名卷的情况以及如何避免它们。

### 匿名卷的产生

匿名卷是在容器启动时，由 Docker 自动创建的未命名的卷。它们通常用于保存容器的持久化数据，但因为没有明确的名称，所以这些卷不易管理和跟踪。

#### 什么时候会创建匿名卷？
匿名卷通常在以下情况下自动创建：

1. **没有明确指定挂载目标**：当 Docker 容器的某个路径（例如 `/var/lib/mysql`）需要持久化存储时，如果没有为该路径明确指定挂载卷，Docker 会自动创建一个匿名卷。
   
   **示例**：
   ```bash
   docker run -d mysql:latest
   ```

   在这个例子中，MySQL 容器会在 `/var/lib/mysql` 保存数据库数据。因为没有明确为这个路径指定卷，Docker 会自动创建一个匿名卷并将其挂载到容器的 `/var/lib/mysql`。

2. **使用 `VOLUME` 指令的镜像**：如果镜像的 `Dockerfile` 中包含了 `VOLUME` 指令，并且你没有明确指定挂载路径，Docker 也会为这个路径创建匿名卷。

   **示例**：
   在使用 `VOLUME /data` 指令构建的镜像时，如果你不手动指定挂载卷，Docker 将为 `/data` 创建一个匿名卷。

### 如何避免匿名卷

为了避免 Docker 自动创建匿名卷，你可以明确指定数据卷或绑定挂载。这使你能更好地管理卷，避免不必要的匿名卷占用磁盘空间。

#### 1. **使用命名卷**
命名卷可以通过 Docker 命令明确指定，并且可以轻松管理和追踪。

**示例**：
```bash
docker run -d -v my_named_volume:/var/lib/mysql mysql:latest
```

在这个例子中，`my_named_volume` 是我们手动创建的卷，它将挂载到容器的 `/var/lib/mysql` 目录。这样可以避免 Docker 创建匿名卷。

#### 2. **使用绑定挂载（Bind Mount）**
通过绑定宿主机上的目录到容器中的路径，确保你完全控制数据的存储位置。

**示例**：
```bash
docker run -d --mount type=bind,source=/home/user/mysql-data,target=/var/lib/mysql mysql:latest
```

在这个例子中，宿主机上的 `/home/user/mysql-data` 目录被挂载到容器的 `/var/lib/mysql`，确保了数据直接存储在宿主机指定的目录中，而不会创建匿名卷。

### 如何管理匿名卷

如果系统中已经产生了匿名卷，你可以通过以下步骤来查看和清理它们：

#### 1. **查看匿名卷**
使用 `docker volume ls` 可以列出所有卷，包括匿名卷。匿名卷通常没有名称，Docker 会生成一个随机的 ID 作为名称。

```bash
docker volume ls
```

输出示例：
```
DRIVER    VOLUME NAME
local     my_named_volume
local     1d9ae6879ec2d4d39172a8bb8a0a2b16f291d6eae1a2fdce93613fd74c446f9f  # 匿名卷
```

#### 2. **删除匿名卷**
你可以通过 `docker volume prune` 删除所有未使用的卷，包括匿名卷：

```bash
docker volume prune
```

Docker 会提示你确认删除所有未使用的卷，输入 `y` 以继续。

如果你想手动删除某个特定的匿名卷，可以使用 `docker volume rm <卷ID>` 命令删除它：

```bash
docker volume rm 1d9ae6879ec2d4d39172a8bb8a0a2b16f291d6eae1a2fdce93613fd74c446f9f
```
```

## 来源 6: Personal-markdown-notes / `docker/Layer和BaseImage概念.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/docker/Layer和BaseImage概念.md>
- 本地路径: `docker/Layer和BaseImage概念.md`

```markdown
## Docker 镜像中的层（Layer）

在 Docker 中，**层（Layer）** 是 Docker 镜像和容器的核心概念之一。Docker 使用分层的文件系统（Union File System），每一层都是只读的。当你构建 Docker 镜像时，每一个指令（如 `RUN`、`COPY`、`ADD` 等）都会创建一层，这些层叠加在一起，形成一个完整的镜像。

1. **分层结构**：Docker 镜像是由多个只读层组成的，这些层构建时会依赖于彼此。每一层都是不可变的，每一层都表示镜像构建过程中产生的一个状态。比如，第一层可能是基础镜像（如 Ubuntu），第二层可能是你安装的依赖，第三层可能是你应用程序的代码。
  
2. **镜像层（Image Layers）**：镜像的每一层是只读的。当 Docker 创建镜像时，镜像层不会发生改变。这些层之间是依赖关系，后续层依赖前面的层。每一层都可以被多个镜像共享。

3. **容器层（Container Layer）**：当你运行一个容器时，Docker 会在镜像的顶层添加一个**可写层**。这一层允许容器对文件系统进行修改，而不影响原始的只读镜像层。容器停止或删除时，这一层会被丢弃，但镜像层保留。

### 每条 Dockerfile 指令产生一层

当 Docker 构建镜像时，`Dockerfile` 中的每一条指令（例如 `RUN`、`COPY`、`ADD` 等）都会创建一个新的层。Docker 使用这些层的缓存来加速镜像构建的过程。

**示例：**
```dockerfile
FROM ubuntu:20.04            # 第一层: 基础镜像
RUN apt-get update           # 第二层: 更新包管理器缓存
RUN apt-get install -y nginx # 第三层: 安装 Nginx
COPY ./index.html /var/www/html/index.html # 第四层: 复制文件
```

每一条指令都会创建一层，它们叠加在一起，形成最终的镜像。

### 层的主要特点

1. **可复用**：镜像的每一层可以被其他镜像复用。例如，如果你在多个镜像中使用相同的基础镜像，Docker 只会下载和存储一次。
   
2. **缓存机制**：Docker 使用层的缓存机制来加速镜像的构建。如果某一层没有发生变化，Docker 会跳过这一步而复用已有的层。
   
3. **分离可读和可写层**：镜像的层是只读的，而容器在运行时，会有一个独立的可写层，所有写入操作（如文件修改、创建）都发生在容器层上，而不会影响到镜像。

### 层的优势

- **存储效率**：由于每一层是只读的，可以在多个镜像或容器之间共享，减少了存储空间。
- **加速构建**：通过层的缓存机制，Docker 只需要重新构建发生变化的层，未变的层可以复用，从而加速构建。
- **镜像小巧**：每一层只包含变化部分，避免了整个文件系统的重复存储，镜像更轻量化。

### 层的操作

1. **查看镜像层**：
   你可以使用 `docker history` 命令来查看镜像的层。
   ```bash
   docker history <镜像名>
   ```
   输出会显示每一层对应的 Dockerfile 指令及其大小。

2. **删除容器时清理可写层**：
   当你删除一个容器时，容器的可写层会被移除，但镜像的只读层不会受到影响。

### Layer 工作原理示意图

```
+--------------------+
| 容器的可写层       |  <-- 运行时写操作在这里发生
+--------------------+
| 镜像的只读层 3     |  <-- COPY 指令产生
+--------------------+
| 镜像的只读层 2     |  <-- RUN 指令产生
+--------------------+
| 镜像的只读层 1     |  <-- FROM 指令产生
+--------------------+
| 基础镜像            |  <-- 例如 ubuntu:20.04
+--------------------+
```

> - **层（Layer）** 是 Docker 镜像的核心组成部分，每个镜像由多个只读层叠加组成，每条 `Dockerfile` 指令创建一层。
> - **容器层** 是可写的，当你运行容器时，Docker 在镜像层的顶部添加一个可写层，所有对文件系统的更改都会发生在这个层上。
> - Docker 的分层存储机制提高了镜像的效率，使得镜像和容器更加轻量，构建速度更快，并且减少了存储占用。

## BaseImage

**BaseImage（基础镜像）** 是 Docker 镜像构建的起点。它是创建自定义 Docker 镜像的底层镜像，为后续的指令提供操作系统环境和必要的依赖库。所有 Docker 镜像都是从一个基础镜像开始构建的，除非你使用 **`FROM scratch`**，这是一个特殊的空白基础镜像。

### BaseImage 的主要作用：
1. **提供基础环境**：BaseImage 提供了一个操作系统的基本环境，通常包括文件系统、内核和一些基础的工具包。你可以在此基础上安装其他应用程序和依赖库。
   
2. **构建镜像的起点**：当你编写 Dockerfile 时，第一个指令通常是 `FROM <BaseImage>`，这就是告诉 Docker 使用哪个基础镜像作为构建的起点。

3. **优化构建**：使用合适的基础镜像可以减小自定义镜像的体积，并加快构建过程。基础镜像可以根据需要选择不同的操作系统、版本或配置。

### 常见的基础镜像类型

1. **官方基础镜像**：
   Docker Hub 上有许多官方维护的基础镜像，如 `ubuntu`、`alpine`、`debian`、`centos` 等，它们提供了各种操作系统的精简版。
   
   - **Ubuntu**：提供 Ubuntu 操作系统的基础环境。
   - **Alpine**：一个非常轻量级的 Linux 发行版，通常用于构建小巧的镜像。
   - **Debian**：基于 Debian 发行版的镜像，适用于需要稳定、全面的包管理支持的场景。
   - **CentOS**：提供 Red Hat 企业 Linux 兼容环境的镜像。

   **示例**：
   ```dockerfile
   FROM ubuntu:20.04
   ```
   这将基于 Ubuntu 20.04 作为基础镜像。

2. **轻量级基础镜像**：
   为了构建更加精简的容器镜像，可以使用 `alpine` 等轻量级基础镜像。它只有几兆大小，非常适合需要快速启动且占用空间少的应用场景。

   **示例**：
   ```dockerfile
   FROM alpine:latest
   ```

3. **`scratch`**：这是 Docker 提供的一个特殊基础镜像，它实际上是一个空镜像。使用 `scratch` 基础镜像通常用于构建非常精简的镜像，比如仅包含编译后的二进制文件的 Go 程序。

   **示例**：
   ```dockerfile
   FROM scratch
   COPY hello /hello
   CMD ["/hello"]
   ```

   这里的 `FROM scratch` 表示从一个完全空白的基础环境开始，没有任何预装的软件或操作系统。

### BaseImage 的选择

选择合适的基础镜像对构建的效率和容器的大小有很大影响。以下是选择基础镜像时的一些考虑因素：

1. **镜像大小**：如果你关心镜像的大小，`alpine` 是一个非常好的选择，它的体积非常小，大约 5MB 左右。相比之下，`ubuntu` 和 `debian` 基础镜像会更大一些。

2. **操作系统依赖**：如果你的应用程序依赖于特定的操作系统或包管理工具（如 `apt` 或 `yum`），选择与之对应的基础镜像会更合适。

3. **兼容性和稳定性**：如果你构建的是生产环境的镜像，通常会选择一些稳定版本的基础镜像，如 `ubuntu:20.04` 或 `debian:buster`。

4. **轻量 vs 完整**：对于简单的应用，可以选择轻量级的基础镜像（如 `alpine`）；而如果应用依赖于较多的库或工具，则可能需要一个更完整的基础镜像（如 `ubuntu` 或 `debian`）。

### BaseImage 的例子

#### 1. 使用 Ubuntu 作为基础镜像

```dockerfile
FROM ubuntu:20.04

RUN apt-get update && apt-get install -y nginx

COPY ./index.html /var/www/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 使用 Alpine 作为基础镜像

```dockerfile
FROM alpine:latest

RUN apk add --no-cache nginx

COPY ./index.html /var/lib/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. 使用 scratch 作为基础镜像

```dockerfile
FROM scratch

COPY hello /hello

CMD ["/hello"]
```
在这个例子中，`scratch` 是一个完全空白的基础镜像，`hello` 是一个独立的二进制文件。

> - **BaseImage** 是构建 Docker 镜像的起点，它为你的应用程序提供了操作系统和基础环境。
> - 常见的基础镜像包括 `ubuntu`、`alpine`、`debian` 等，选择合适的基础镜像可以优化镜像大小和构建效率。
> - 特殊的 `scratch` 镜像用于构建极简的容器，通常只包含应用的二进制文件。
> - 基础镜像的选择应根据项目需求、操作系统依赖、体积优化等进行权衡。
```

## 来源 7: Personal-markdown-notes / `docker/容器网络连接.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/docker/容器网络连接.md>
- 本地路径: `docker/容器网络连接.md`

```markdown
## 容器网络连接

在 Docker 中，容器网络是容器化应用程序通信的基础。Docker 提供了多种网络模式，用来控制容器如何相互连接以及如何与外部网络进行通信。理解 Docker 网络模式和连接方式非常重要，尤其是在构建复杂的微服务架构时。

### Docker 的网络模式

Docker 提供了几种不同的网络模式，帮助容器之间以及容器与外部系统之间建立连接：

1. **Bridge 网络模式**（默认）
   - **Bridge 网络**是 Docker 中最常用的网络模式，默认情况下每个容器都会被连接到 `bridge` 网络。
   - 每个容器在启动时会被分配一个虚拟网卡（veth），并获得一个独立的 IP 地址。容器之间可以通过 IP 地址通信。
   - 默认的 `bridge` 网络模式允许容器与宿主机通信，但不允许容器直接暴露给外部网络，除非显式映射端口。

   **示例**：
   ```bash
   docker run -d --name mynginx --network bridge -p 8080:80 nginx
   ```

<div align="center">
  <img src="https://davidhlp.asia/d/HLP/Blog/docker/fc63c02c67db92757735695b4972ae0a.png" />
</div>

   在这个例子中，容器通过桥接网络模式运行，并将容器内的 `80` 端口映射到宿主机的 `8080` 端口。

2. **Host 网络模式**
   - 在 Host 网络模式下，容器将使用宿主机的网络栈，而不是创建独立的虚拟网络接口。
   - 容器中的服务可以直接访问宿主机的网络资源，且容器端口与宿主机端口是一一对应的。
   - Host 网络模式会让容器直接与外部网络通信，没有任何网络隔离。

   **示例**：
   ```bash
   docker run -d --network host nginx
   ```

   在 Host 网络模式下，Nginx 容器将使用宿主机的网络资源，容器的所有端口都直接绑定到宿主机。

3. **None 网络模式**
   - 当容器使用 `none` 网络模式时，Docker 不会为容器分配任何网络资源，容器只有本地的 `lo`（loopback）接口。
   - 这种模式通常用于需要完全独立于外部网络的特殊场景。

   **示例**：
   ```bash
   docker run -d --network none nginx
   ```

   在这个模式下，Nginx 容器没有任何网络连接。

4. **Container 网络模式**
   - 在 `container` 网络模式下，多个容器可以共享同一个容器的网络栈。新容器会与指定的容器共享 IP 地址、网络接口等。
   - 这种模式适用于需要将应用分解为多个容器，但共享相同网络环境的场景。

   **示例**：
   ```bash
   docker run -d --name container1 nginx
   docker run -d --network container:container1 alpine ping localhost
   ```

   在这个例子中，`container2` 将与 `container1` 共享相同的网络栈。

5. **自定义 Bridge 网络**
   - 除了默认的 `bridge` 网络，Docker 还允许用户创建自定义的 `bridge` 网络。自定义网络允许用户为容器分配可预测的 IP 地址，并支持容器之间使用容器名称进行通信。
   - 自定义 `bridge` 网络使容器能够通过名称相互访问，而无需使用 IP 地址。

   **创建自定义网络**：
   ```bash
   docker network create my_bridge_network
   ```

   **将容器连接到自定义网络**：
   ```bash
   docker run -d --name myapp --network my_bridge_network nginx
   docker run -d --name db --network my_bridge_network mysql
   ```

   在这个例子中，`myapp` 容器可以通过 `db` 直接访问 MySQL 数据库，而无需知道它的 IP 地址。

### Docker 网络的常见命令

在 Docker 网络管理中，你可以使用多种命令和参数来创建、查看、连接和管理容器网络。以下是 Docker 网络常见命令及其常用的 `-xxx` 参数：

1. **列出所有网络**

```bash
docker network ls
```

**常用参数**：
- `-q`：只显示网络的 ID，而不是完整的信息。

**示例**：
```bash
docker network ls -q
```

2. **创建自定义网络**

```bash
docker network create <网络名>
```

**常用参数**：
- `-d` 或 `--driver`：指定网络的驱动程序，默认是 `bridge`。
- `--subnet`：指定自定义子网。
- `--gateway`：指定自定义网关。
- `--ip-range`：设置 IP 地址分配的范围。
- `--internal`：创建一个内部网络，使网络仅限于容器之间，不允许外部访问。
- `--attachable`：使网络支持独立的容器连接到此网络。

**示例**：
```bash
docker network create --driver bridge --subnet 192.168.1.0/24 my_network
```

3. **连接容器到网络**

```bash
docker network connect <网络名> <容器名或容器ID>
```

**常用参数**：
- `--ip`：为容器分配指定的 IP 地址。
- `--alias`：为容器指定一个网络别名，用于在容器网络中访问。

**示例**：
```bash
docker network connect --ip 192.168.1.100 my_network my_container
```

4. **断开容器与网络的连接**

```bash
docker network disconnect <网络名> <容器名或容器ID>
```

**常用参数**：
- `-f` 或 `--force`：强制断开容器与网络的连接，即使容器正在运行。

**示例**：
```bash
docker network disconnect -f my_network my_container
```

5. **查看网络的详细信息**

```bash
docker network inspect <网络名>
```

这个命令没有常用的 `-xxx` 参数，它会返回一个 JSON 格式的输出，详细描述该网络的配置，包括容器连接信息、子网配置等。

**示例**：
```bash
docker network inspect my_network
```

6. **移除网络**

```bash
docker network rm <网络名>
```

- **无常见的 `-xxx` 参数**，但是注意，只有没有连接到该网络的容器时，才能删除网络。

**示例**：
```bash
docker network rm my_network
```

7. **清理未使用的网络**

```bash
docker network prune
```

**常用参数**：
- `-f` 或 `--force`：跳过确认，直接删除未使用的网络。

**示例**：
```bash
docker network prune -f
```

8. **运行容器时直接指定网络**

```bash
docker run -d --network <网络名> <镜像名>
```

**常用参数**：
- `--network-alias`：指定网络别名，用于在容器间的通信中访问。

**示例**：
```bash
docker run -d --network my_network --network-alias myalias nginx
```

9. **指定容器的 MAC 地址**

```bash
docker network connect --mac-address <MAC地址> <网络名> <容器名>
```

- **常用参数**：
  - `--mac-address`：指定容器的 MAC 地址。

**示例**：
```bash
docker network connect --mac-address 02:42:ac:11:00:02 my_network my_container
```

### 容器间通信

在自定义 `bridge` 网络中，Docker 会自动为每个容器分配一个可识别的 DNS 名称，这个名称默认就是容器的名称。容器可以通过名称相互通信，而不需要依赖 IP 地址。

**示例**：

1. 创建自定义网络：
   ```bash
   docker network create my_bridge_network
   ```

2. 启动两个容器并加入该网络：
   ```bash
   docker run -d --name app1 --network my_bridge_network nginx
   docker run -d --name app2 --network my_bridge_network nginx
   ```

3. 使用容器名称通信：
   在 `app1` 容器中，你可以通过 `app2` 的名称直接访问它：
   ```bash
   docker exec -it app1 ping app2
   ```
```
