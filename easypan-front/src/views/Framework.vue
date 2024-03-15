<template>
  <div class="Framework">
    <MainHeader></MainHeader>
    <div class="body">
      <div class="left-sider">
        <!-- 一级菜单 -->
        <div class="menu-list">
          <div
            v-for="item in menus"
            :class="[
              'menu-item',
              item.menuCode === currentMenu.menuCode ? 'active' : '',
            ]"
            @click="jump(item)"
          >
            <div :class="['iconfont', 'icon-' + item.icon]"></div>
            <div class="text">{{ item.name }}</div>
          </div>
        </div>
        <!-- 二级菜单 -->
        <div class="menu-sub-list">
          <div
            :class="['menu-item-sub', currentPath === sub.path ? 'active' : '']"
            v-for="sub in currentMenu.children"
            @click="jump(sub)"
          >
            <span
              :class="['iconfont', 'icon-' + sub.icon]"
              v-if="sub.icon"
            ></span>
            <span class="text">{{ sub.name }}</span>
          </div>
          <div class="tips" v-if="currentMenu && currentMenu.tips">
            {{ currentMenu.tips }}
          </div>
          <div class="space-info">
            <div>空间使用</div>
            <div class="percent">
              <el-progress
                :percentage="
                  Math.floor(
                    (useSpaceInfo.useSpace / useSpaceInfo.totalSpace) * 10000
                  ) / 100
                "
                color="#409eff"
              />
              <div class="space-use">
                <div class="use">
                  {{ proxy.Utils.size2Str(useSpaceInfo.useSpace) }}/
                  {{ proxy.Utils.size2Str(useSpaceInfo.totalSpace) }}
                </div>
                <div class="iconfont icon-refresh" @click="getUseSpace"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="body-content">
        <!-- 根据路由动态渲染组件 -->
        <!-- 根据传入的is属性来决定渲染哪个组件 -->
        <!-- 将路由间的关系转化为组件间的关系，便于实现文件上传功能 -->
        <router-view v-slot="{ Component }">
          <component :is="Component" ref="routerViewRef"></component>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  getCurrentInstance,
  watch,
  onMounted,
  nextTick,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import MainHeader from "../components/MainHeader.vue";

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();

const api = {
  getUseSpace: "/getUseSpace",
  logout: "/logout",
};
// 菜单部分
const menus = [
  {
    icon: "cloude",
    name: "首页",
    menuCode: "main",
    path: "/main/all",
    allShow: true,
    children: [
      {
        icon: "all",
        name: "全部",
        category: "all",
        path: "/main/all",
      },
      {
        icon: "video",
        name: "视频",
        category: "video",
        path: "/main/video",
      },
      {
        icon: "music",
        name: "音频",
        category: "music",
        path: "/main/music",
      },
      {
        icon: "image",
        name: "图片",
        category: "image",
        path: "/main/image",
      },
      {
        icon: "doc",
        name: "文档",
        category: "doc",
        path: "/main/doc",
      },
      {
        icon: "more",
        name: "其他",
        category: "others",
        path: "/main/others",
      },
    ],
  },
  {
    path: "/myshare",
    icon: "share",
    name: "分享",
    menuCode: "share",
    allShow: true,
    children: [
      {
        name: "分享记录",
        path: "/myshare",
      },
    ],
  },
  {
    path: "/recycle",
    icon: "del",
    name: "回收站",
    menuCode: "recycle",
    tips: "回收站为你保存10天内删除的文件",
    allShow: true,
    children: [
      {
        name: "删除的文件",
        path: "/recycle",
      },
    ],
  },
  {
    path: "/settings/fileList",
    icon: "settings",
    name: "设置",
    menuCode: "settings",
    allShow: false,
    children: [
      {
        name: "用户文件",
        path: "/settings/fileList",
      },
      {
        name: "用户管理",
        path: "/settings/userList",
      },
      {
        path: "/settings/sysSetting",
        name: "系统设置",
      },
    ],
  },
];

const currentMenu = ref({});
const currentPath = ref();

const jump = (data) => {
  if (!data.path || data.menuCode === currentMenu.value.menuCode) {
    return;
  }
  router.push(data.path);
};
const setMenu = (menuCode, path) => {
  const menu = menus.find((item) => {
    return item.menuCode === menuCode;
  });
  currentMenu.value = menu;
  currentPath.value = path;
};
watch(
  route,
  (newValue, oldValue) => {
    if (newValue.meta.menuCode) {
      setMenu(newValue.meta.menuCode, newValue.path);
    }
  },
  { immediate: true, deep: true }
);
const useSpaceInfo = ref({ useSpace: 0, totalSpace: 1 });
const getUseSpace = async () => {
  let result = await proxy.Request({
    url: api.getUseSpace,
    showLoading: false,
  });
  if (!result) {
    return;
  }
  useSpaceInfo.value = result.data;
};
//上传文件回调 更新文件 更新用户空间
const routerViewRef = ref();
proxy.$mitt.on("uploadCallbackHandler", () => {
  nextTick(() => {
    routerViewRef.value.reload();
    getUseSpace();
  });
});

onMounted(() => {
  nextTick(() => {
    getUseSpace();
  });
});
</script>

<style lang="scss" scoped>
.Framework {
  .body {
    display: flex;
    .left-sider {
      display: flex;
      border-right: 1px solid #f1f2f4;
      .menu-list {
        height: calc(100vh - 56px);
        width: 80px;
        box-shadow: 0 3px 10px rgb(0 0 0 / 6%);
        border-right: 1px solid #f1f2f4;
        .menu-item {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          padding: 20px 0px;
          cursor: pointer;
          &:hover {
            background: #f3f3f3;
          }
          .iconfont {
            font-weight: normal;
            font-size: 28px;
          }
        }
        .active {
          color: #06a7ff;
        }
      }
      .menu-sub-list {
        height: calc(100vh - 56px);
        width: 200px;
        padding: 20px 10px 0px;
        position: relative;
        .menu-item-sub {
          text-align: center;
          line-height: 40px;
          border-radius: 5px;
          cursor: pointer;
          &:hover {
            background: #f3f3f3;
          }
          .iconfont {
            font-size: 14px;
            margin-right: 20px;
          }
          .text {
            font-size: 13px;
          }
        }
      }
      .active {
        background: #eef9fe;
        color: #05a1f5;
      }

      .tips {
        margin-top: 10px;
        color: #888888;
        font-size: 13px;
      }

      .space-info {
        position: absolute;
        bottom: 10px;
        width: 100%;
        padding: 0px 5px;
        .percent {
          padding-right: 10px;
        }
        .space-use {
          margin-top: 5px;
          color: #7e7e7e;
          display: flex;
          justify-content: space-around;
          .use {
            flex: 1;
          }
          .iconfont {
            cursor: pointer;
            margin-right: 20px;
            color: #05a1f5;
          }
        }
      }
    }
    .body-content {
      flex: 1;
      width: 0;
      padding-left: 10px;
    }
  }
}
</style>
