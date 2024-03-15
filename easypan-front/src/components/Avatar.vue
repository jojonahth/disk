<template>
  <div class="avatar" :style="{ width: width + 'px', height: width + 'px' }">
    <img
      :src="avatar && avatar !='' ? avatar : `${proxy.globalInfo.avatarUrl}${userId}?${timestamp}`"
      v-if="userId"
    />
  </div>
</template>

<script setup>
import { getCurrentInstance } from "vue";

const { proxy } = getCurrentInstance();

const props = defineProps({
  userId: {
    type: String,
  },
  width: {
    type: Number,
    default: 40,
  },
  // 时间
  timestamp: {
    type: Number,
    default: 0,
  },
  avatar: {
    type: String,
  },
});
</script>

<style lang="scss" scoped>
.avatar {
  display: flex;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  img {
    width: 100%;
    object-fit: cover;
  }
}
</style>
