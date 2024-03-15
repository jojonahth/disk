

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import mitt from 'mitt'
// 引入pinia
import{ createPinia } from 'pinia'
// 引入element plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 图标
import '@/assets/icon/iconfont.css'
import '@/assets/base.scss'

// 引用cookies
import  VueCookies  from 'vue-cookies'

// 引用响应式函数
import Verify from '@/utils/Verify'
import Message from '@/utils/Message'
import Request from '@/utils/Request'
import Confirm from '@/utils/Confirm'
import Utils from '@/utils/Utils'

// 引用组件
import Dialog from '@/components/Dialog.vue'
import Avatar from '@/components/Avatar.vue'
import MainTable from '@/components/MainTable.vue'
import Icon from '@/components/Icon.vue'
import NoData from '@/components/NoData.vue'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)
app.use(router)
// 全局注册组件
app.component('Dialog',Dialog)
    .component('Avatar',Avatar)
    .component('MainTable',MainTable)
    .component('Icon',Icon)
    .component('NoData',NoData)

// 配置全局属性
app.config.globalProperties.Verify = Verify
app.config.globalProperties.Message = Message
app.config.globalProperties.Request = Request
app.config.globalProperties.Confirm = Confirm
app.config.globalProperties.Utils = Utils
app.config.globalProperties.VueCookies = VueCookies
app.config.globalProperties.$mitt = mitt()
app.config.globalProperties.globalInfo = {
    avatarUrl:"/api/getAvatar/"
}
app.mount('#app')
