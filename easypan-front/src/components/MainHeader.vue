<template>
  <div>
    <div class="header">
      <div class="logo-panel">
        <span class="iconfont icon-pan"></span>
        <span class="name">Easy云盘</span>
      </div>
      <div class="right-panel">
        <!-- 弹出框 -->
        <el-popover
          placement="bottom"
          :width="800"
          trigger="click"
          v-model:visible="showUploader"
          :offset="20"
          transition="none"
          :popper-style="{ padding: '0px' }"
        >
          <template #reference>
            <span class="iconfont icon-transfer"></span>
          </template>
          <template #default>
            <Uploader ref="uploaderRef"></Uploader>
          </template>
        </el-popover>
        <!-- 下拉菜单 -->
        <el-dropdown>
          <div class="user-info">
            <div class="avatar">
              <Avatar
                :userId="userInfo.userId"
                :avatar="userInfo.avatar"
                :timestamp="timestamp"
                :width="46"
              >
              </Avatar>
            </div>
            <div class="nick-name">{{ userInfo.nickName }}</div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="updateAvatar"
                >修改头像</el-dropdown-item
              >
              <el-dropdown-item @click="updatePassword"
                >修改密码</el-dropdown-item
              >
              <el-dropdown-item @click="logout">退出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <!-- 修改头像 -->
    <Dialog
      :model="avatarFormData"
      :show="dialogConfig.Avatar.show"
      :title="dialogConfig.Avatar.title"
      :buttons="dialogConfig.Avatar.buttons"
      width="500px"
      :showCancel="true"
      @close="dialogConfig.Avatar.show = false"
    >
      <el-form label-width="80px" @submit.prevent>
        <el-form-item label="昵称">{{ avatarFormData.nickName }}</el-form-item>
        <el-form-item label="头像">
          <div class="avatar-upload">
            <div class="avatar-show">
              <img :src="upAvatar" v-if="upAvatar" />
              <img
                :src="`${proxy.globalInfo.avatarUrl}${avatarFormData.userId}`"
                v-else
              />
            </div>
            <div class="avatar-btn">
              <el-upload
                :show-file-list="false"
                accept=".png,.PNG,.jpg,.JPG,.jpeg,.JPEG,.gif,.GIF,.bmp,.BMP"
                :mutiple="false"
                :http-request="uploadImage"
              >
                <el-button type="primary">选择</el-button>
              </el-upload>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </Dialog>
    <!-- 修改密码 -->
    <Dialog
      :show="dialogConfig.Password.show"
      :title="dialogConfig.Password.title"
      :buttons="dialogConfig.Password.buttons"
      width="500px"
      :showCancel="true"
      @close="dialogConfig.Password.show = false"
    >
      <el-form
        ref="pwdFirmDataRef"
        label-width="80px"
        :rules="rules"
        :model="pwdFirmData"
        @submit.prevent
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            type="password"
            size="large"
            placeholder="请输入密码"
            v-model.trim="pwdFirmData.password"
            show-password
            clearable
          >
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="rePassword">
          <el-input
            type="password"
            size="large"
            placeholder="请再次输入密码"
            v-model.trim="pwdFirmData.rePassword"
            show-password
            clearable
          >
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import Uploader from "@/views/main/Uploader.vue";

const router = useRouter();
const { proxy } = getCurrentInstance();
const api = {
  updateUserAvatar: "updateUserAvatar",
  updatePassword: "updatePassword",
  logout: "/logout",
};

// 显示上传窗口
const showUploader = ref(false);
// 添加文件
const uploaderRef = ref();
proxy.$mitt.on("addFile", (data) => {
  const { file, filePid } = data;
  showUploader.value = true;
  uploaderRef.value.addFile(file, filePid);
});

const timestamp = ref();
const userInfo = ref(proxy.VueCookies.get("userInfo"));

const dialogConfig = reactive({
  Avatar: {
    show: false,
    title: "修改头像",
    buttons: [
      {
        type: "primary",
        text: "确定",
        click: (e) => {
          submitAvatar();
        },
      },
    ],
  },
  Password: {
    show: false,
    title: "修改头像",
    buttons: [
      {
        type: "primary",
        text: "确定",
        click: (e) => {
          submitPassword();
        },
      },
    ],
  },
});
// 修改头像
const avatarFormData = ref({});
const upAvatar = ref();

const updateAvatar = () => {
  avatarFormData.value = {
    ...userInfo.value,
    avatar: { userId: userInfo.value.userId, qqAvatar: userInfo.value.avatar },
  };
  dialogConfig.Avatar.show = true;
};

const uploadImage = async (file) => {
  file = file.file;
  let img = new FileReader();
  // 以DataURL的形式读取文件内容
  img.readAsDataURL(file);
  img.onload = ({ target }) => {
    upAvatar.value = target.result;
  };
  avatarFormData.value.avatar = file;
};
const submitAvatar = async () => {
  // 检查用户信息中的头像是否为文件类型
  if (!(avatarFormData.value.avatar instanceof File)) {
    dialogConfig.Avatar.show = false; // 关闭对话框
    return; // 结束函数
  }
  // 发起一个异步请求来更新用户头像
  let result = await proxy.Request({
    url: api.updateUserAvatar, // API的URL地址
    params: {
      avatar: avatarFormData.value.avatar, // 用户头像文件
    },
  });
  // 如果更新不成功，直接返回
  if (!result) {
    return;
  }
  dialogConfig.Avatar.show = false; // 更新成功后关闭对话框
  // 从cookie中获取用户信息
  const cookeUserInfo = proxy.VueCookies.get("userInfo");
  //userInfo = cookeUserInfo
  // 删除用户信息中的头像属性
  delete cookeUserInfo.avatar;
  // 将更新后的用户信息重新设置到cookie中，有效期为0表示会话结束时过期
  proxy.VueCookies.set("userInfo", cookeUserInfo, 0);
  userInfo.value = proxy.VueCookies.get("userInfo");
  timestamp.value = new Date().getTime();
};
// 修改密码
const pwdFirmData = ref({});
const pwdFirmDataRef = ref();

const checkRePassword = (rule, value, callback) => {
  if (value !== pwdFirmData.value.password) {
    callback(new Error(rule.message));
  } else {
    callback();
  }
};

const rules = {
  password: [
    { required: true, message: "请输入密码" },
    {
      validator: proxy.Verify.password,
      message: "密码只能是数字，字母，特殊字符 8-18位",
    },
  ],
  rePassword: [
    { required: true, message: "请再次输入密码" },
    {
      validator: checkRePassword,
      message: "两次输入的密码不一致",
    },
  ],
};

const updatePassword = () => {
  dialogConfig.Password.show = true;
  nextTick(() => {
    pwdFirmDataRef.value.resetFields();
    pwdFirmData.value = {};
  });
};

const submitPassword = async () => {
  pwdFirmDataRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    let result = await proxy.Request({
      url: api.updatePassword,
      params: {
        password: pwdFirmData.value.password,
      },
    });
    if (!result) {
      return;
    }
    dialogConfig.Password.show = false;
    proxy.Message.success("密码修改成功");
  });
};

// 退出登录
const logout = () => {
  proxy.Confirm("你确定要退出吗", async () => {
    let result = await proxy.Request({
      url: api.logout,
    });
    if (!result) {
      return;
    }
    proxy.VueCookies.remove("userInfo");
    router.push("/login");
  });
};
</script>

<style lang="scss" scoped>
.header {
  box-shadow: 0px 3px 10px 0 rgb(0 0 0 / 6%);
  height: 56px;
  padding-left: 24px;
  padding-right: 24px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .logo-panel {
    color: #1296db;
    .icon-pan {
      font-size: 40px;
    }
    .name {
      font-weight: bold;
      margin-left: 5px;
      font-size: 25px;
      cursor: default;
      color: #05a1f5;
    }
  }
  .right-panel {
    display: flex;
    align-items: center;
    .icon-transfer {
      cursor: pointer;
    }
    .user-info {
      margin-right: 10px;
      display: flex;
      align-items: center;
      cursor: pointer;
      .avatar {
        margin: 0px 5px 0px 10px;
      }
      .nick-name {
        color: #05a1f5;
      }
    }
  }
}
.avatar-upload {
  display: flex;
  justify-content: center;
  align-items: end;
  .avatar-show {
    background: rgb(245, 245, 245);
    width: 150px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    img {
      width: 100%;
      height: 100%;
    }
  }
  .avatar-btn {
    margin-left: 10px;
    vertical-align: bottom;
  }
}
</style>
