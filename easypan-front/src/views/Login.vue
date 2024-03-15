<template>
  <div class="login-body">
    <div class="bg"></div>
    <!-- 注册登录 -->
    <div class="login-panel">
      <el-form
        ref="formDataRef"
        :model="formData"
        :rules="rules"
        class="login-register"
        @submit.prevent
      >
        <div class="login-title">Easy云盘</div>
        <!-- input邮箱 -->
        <el-form-item prop="email">
          <el-input
            size="large"
            placeholder="请输入邮箱"
            v-model.trim="formData.email"
            clearable
            maxlength="150"
          >
            <!-- 插槽引入前缀图标 -->
            <template #prefix>
              <span class="iconfont icon-account"></span>
            </template>
          </el-input>
        </el-form-item>
        <!-- 登录密码 -->
        <el-form-item prop="password" v-if="opType == 1">
          <el-input
            size="large"
            type="password"
            placeholder="请输入密码"
            v-model.trim="formData.password"
            show-password
            maxlength="150"
          >
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <!-- 注册和忘记密码 -->
        <div v-if="opType == 0 || opType == 2">
          <el-form-item prop="emailCode">
            <div class="send-email-panel">
              <el-input
                size="large"
                placeholder="请输入邮箱验证码"
                v-model.trim="formData.emailCode"
              >
                <template #prefix>
                  <span class="iconfont icon-checkcode"></span>
                </template>
              </el-input>
              <el-button class="send-email-btn" type="primary" size="large" @click="getEmailCode" :disabled="disabledBtn" 
                >
                <span v-if="disabledBtn==false">获取验证码</span>
                <span v-if="disabledBtn==true">重新获取({{ disabledTime }})秒</span>
                </el-button
              >
            </div>
            <el-popover placement="left" :width="500" trigger="click">
              <div>
                <p>1、在垃圾箱中查找邮箱验证码</p>
                <p>2、在邮箱中头像->设置->反垃圾->白名单->设置邮件地址白名单</p>
                <p>
                  3、将邮箱【941833528@qq.com】添加到白名单
                </p>
              </div>
              <template #reference>
                <span class="a-link" :style="{ 'font-size': '14px'}"
                  >未收到邮箱验证码？</span>
              </template>
            </el-popover>
          </el-form-item>
          <!-- 注册昵称 -->
          <el-form-item prop="nickName" v-if="opType==0">
          <el-input
            size="large"
            placeholder="请输入昵称"
            v-model.trim="formData.nickName"
            clearable
            maxlength="50"
          >
            <!-- 插槽引入前缀图标 -->
            <template #prefix>
              <span class="iconfont icon-account"></span>
            </template>
          </el-input>
        </el-form-item>
        <!-- 注册密码,找回密码 -->
        <el-form-item prop="registerPassword">
          <el-input
            size="large"
            type="password"
            placeholder="请设置密码"
            v-model.trim="formData.registerPassword"
            show-password
            maxlength="150"
          >
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <!-- 重复密码  -->
        <el-form-item prop="reRegisterPassword">
          <el-input
            size="large"
            type="password"
            placeholder="请再次输入密码"
            v-model.trim="formData.reRegisterPassword"
            show-password
            maxlength="150"
          >
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        </div>
        <!-- 验证码 -->
        <el-form-item prop="checkCode">
          <div class="check-code-panel">
            <el-input
              size="large"
              placeholder="请输入验证码"
              v-model.trim="formData.checkCode"
              @keyup.enter="doSubmit"
            >
              <template #prefix>
                <span class="iconfont icon-checkcode"></span>
              </template>
            </el-input>
            <img
              class="check-code"
              :src="checkCodeUrl"
              @click="changeCheckCode(0)"
              alt=""
              title=""
            />
          </div>
        </el-form-item>
        <!-- 登录选项（忘记密码） -->
        <el-form-item>
          <div class="rememberme-panel">
            <el-checkbox v-model="formData.rememberMe" v-if="opType==1">记住我</el-checkbox>
          </div>
          <div class="no-account">
            <!-- 点击不执行任何操作 a标签不跳转-->
            <a href="javascript:void(0)" class="a-link" @click="showpanel(2)" v-if="opType==1"
              >忘记密码？</a>
            <a href="javascript:void(0)" class="a-link" @click="showpanel(0)" v-if="opType==1"
              >没有账号？</a>
            <a href="javascript:void(0)" class="a-link" @click="showpanel(1)" v-if="opType==2"
              >去登录？</a>
            <a href="javascript:void(0)" class="a-link" @click="showpanel(1)" v-if="opType==0"
              >已有账号？</a>
          </div>
        </el-form-item>
        <!-- 登录按钮 -->
        <el-form-item>
          <el-button type="primary" class="login-btn" size="large" @click="doSubmit">
            <span v-if="opType==1">登录</span>
            <span v-if="opType==0">注册</span>
            <span v-if="opType==2">重置密码</span>
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, getCurrentInstance, onMounted } from "vue";
import {useRoute,useRouter} from "vue-router"
import md5 from "js-md5"
//获取当前组件的上下文
const { proxy } = getCurrentInstance();
// 路由
const router = useRouter()
const route = useRoute()
const api = {
  checkCode: "/api/checkCode",
  sendEmailCode: "/sendEmailCode",
  register:"/register",
  login:"/login",
  resetPwd:"/reserPwd",
  qqLogin:"/qqLogin"
};
// 登录信息
const formData = ref({});
const formDataRef = ref();
// 校验规则
const checkRePassword = (rule, value, callback) => {
  if (value !== formData.value.registerPassword) {
    callback(new Error(rule.message));
  } else {
    callback();
  }
};
const rules = {
  email: [
    { required: true, message: "请输入邮箱" },
    { validator: proxy.Verify.email, message: "请输入正确的邮箱" },
  ],
  password: [{ required: true, message: "请输入密码" }],
  emailCode: [{ required: true, message: "请输入邮箱验证码" }],
  nickName: [{ required: true, message: "请输入昵称" }],
  registerPassword: [
    { required: true, message: "请输入密码" },
    {
      validator: proxy.Verify.password,
      message: "密码只能是数字，字母，特殊字符 8-18位",
    },
  ],
  reRegisterPassword: [
    { required: true, message: "请再次输入密码" },
    {
      validator: checkRePassword, //自定义校验方法
      message: "两次输入的密码不一致",
    },
  ],
  checkCode: [{ required: true, message: "请输入图片验证码" }],
};
// 操作类型 0：注册 1：登录 2重置密码
const opType = ref(1);
const showpanel = (type) => {
  opType.value = type;
  resetForm()
}
// 切换页面时重置表单
const resetForm = ()=>{
  changeCheckCode(0)
  formDataRef.value.resetFields()
  formData.value = {}
  // 登录 记住我功能 保留信息
  if(opType.value ===1){
    const cookieLoginInfo = proxy.VueCookies.get("loginInfo")
    if(cookieLoginInfo){
      formData.value = cookieLoginInfo
    }
  }
}
onMounted(()=>{
  showpanel(1)
})
const checkCodeUrl = ref(api.checkCode);
//切换验证码
const changeCheckCode = (type) => {
  checkCodeUrl.value =
    api.checkCode + "?type" + type + "&time=" + new Date().getTime();
}

// 发送邮箱验证码
const disabledBtn = ref(false)
const disabledTime = ref(59)
const getEmailCode = () =>{
  formDataRef.value.validateField("email",async (valid)=>{
    if(!valid){
      return;
    }
    const params = {}
    params.email = formData.value.email
    params.type = opType.value == 0 ? 0 :1;
    let result = await proxy.Request({
      url:api.sendEmailCode,
      params:params,
    })
    if(!result){
      return 
    }
    proxy.Message.success("验证码发送成功，请登录邮箱查看");
    disabledBtn.value = true
    const timer = setInterval(()=>{
      disabledTime.value--
      if(disabledTime.value===0){
        clearInterval(timer)
        disabledBtn.value = false
      }
    },1000)
  })

}

// 登录 注册 重置密码 提交表单
const doSubmit = () =>{
  formDataRef.value.validate(async (valid)=>{
    if(!valid){
      return 
    }
    let params = {}
    Object.assign(params,formData.value) 
    //注册 找回密码 设置api请求参数
    if(opType.value === 0 || opType.value===2){
      params.password = params.registerPassword
      delete params.registerPassword
      delete params.reRegisterPassword
    }
    //登录
    if(opType.value ===1){
      let cookieLoginInfo = proxy.VueCookies.get("loginInfo")
      let cookiePassword = cookieLoginInfo===null ? null:cookieLoginInfo.password
      // 首次登录，对密码进行加密
      if(params.password !== cookiePassword){
        params.password = md5(params.password)
      }
    }
    // 发送请求
    let url = null
    if(opType.value === 0){
      url = api.register
    }else if(opType.value === 1){
      url = api.login
    }else if(opType.value === 2){
      url = api.resetPwd
    }
    let result = await proxy.Request({
      url:url,
      params:params,
      errorCallback:()=>{
        changeCheckCode(0)
      }
    })
    if (!result){
      return
    }
    // 请求成功
    if(opType.value === 0){
      proxy.Message.success("注册成功，请登录")
      showpanel(1)
    }else if(opType.value === 2){
      proxy.Message.success("重置密码成功，请登录")
      showpanel(1)
    }else if(opType.value === 1){
      if(params.rememberMe){
        const loginInfo = {
          email:params.email,
          password:params.password,
          rememberMe:params.rememberMe
        }
        proxy.VueCookies.set("loginInfo",loginInfo,"7d")
      }else{
        proxy.VueCookies.remove("loginInfo")
      }
      proxy.Message.success("登录成功")
      // 储存cooKie，在浏览器会话结束时被销毁
      proxy.VueCookies.set("userInfo",result.data,0)
      //重定向到主页
      const redirectUrl = route.query.redirectUrl || "/"
      router.push(redirectUrl)
    }
  })
}
</script>

<style lang="scss" scoped>
.login-body {
  height: calc(100vh);
  background-size: cover;
  background-image: url("../assets/login_bg.jpg");
  display: flex;
  .bg {
    flex: 1;
    background-size: cover;
    background-position: center;
    background-size: 500px;
    background-repeat: no-repeat;
    background-image: url(../assets/login_img.png);
  }
  .login-panel {
    width: 430px;
    margin-right: 15%;
    margin-top: calc((100vh - 600px) / 2);
    .login-register {
      margin-top: 80px;
      padding: 25px;
      background-color: #fff;
      border-radius: 5px;
      .login-title {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .send-email-panel {
        display: flex;
        width: 100%;
        justify-content: space-between;
        .send-email-btn {
          margin-left: 5px;
        }
      }
      .check-code-panel {
        display: flex;
        width: 100%;
        .check-code {
          margin-left: 5px;
          cursor: pointer;
        }
      }
      .rememberme-panel {
        width: 100%;
      }
      .no-account {
        display: flex;
        width: 100%;
        justify-content: space-between;
      }
      .login-btn {
        width: 100%;
      }
    }
  }
}
</style>
