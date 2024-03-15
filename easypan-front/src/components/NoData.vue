<template>
    <div class="no-data">
      <icon iconName="no_data" :width="120" fit="fill"></icon>
      <div class="msg">{{ msg }}</div>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    msg: {
      type: String,
    },
  });
  </script>
  
  <style lang="scss" scoped>
  .no-data {
    text-align: center;
    padding: 10px 0px;
    .msg {
      margin-top: 10px;
      color: #909399;
      font-size: 14px;
    }
  }
  </style>