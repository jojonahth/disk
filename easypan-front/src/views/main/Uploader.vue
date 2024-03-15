<template>
  <div class="uploader-panel">
    <!-- 标题 -->
    <div class="uploader-title">
      <span>上传任务</span>
      <span class="tips">(仅展示本次上传任务)</span>
    </div>
    <!-- 上传文件列表 -->
    <div class="file-list">
      <div v-for="(item, index) in fileList" class="file-item">
        <!-- 显示左边的文件信息 -->
        <div class="upload-panel">
          <!-- 文件名 -->
          <div class="file-name">{{ item.fileName }}</div>
          <!-- 文件上传进度条-->
          <div class="progress">
            <el-progress
              :percentage="item.uploadProgress"
              v-if="
                item.status === STATUS.uploading.value ||
                item.status === STATUS.upload_seconds.value ||
                item.status == STATUS.upload_finish.value
              "
            />
          </div>
          <!-- 状态 -->
          <div class="upload-status">
            <!-- 图标 -->
            <span
              :class="['iconfont', 'icon-' + STATUS[item.status].icon]"
              :style="{ color: STATUS[item.status].color }"
            ></span>
            <!-- 状态描述 -->
            <span
              class="status"
              :style="{ color: STATUS[item.status].color }"
              >{{
                item.status === "fail"
                  ? item.errorMsg
                  : STATUS[item.status].desc
              }}</span
            >
            <!-- 状态为上传中时，显示已上传文件大小 -->
            <span
              class="upload-info"
              v-if="item.status === STATUS.uploading.value"
              >{{ proxy.Utils.size2Str(item.uploadSize) }}/{{
                proxy.Utils.size2Str(item.totalSize)
              }}</span
            >
          </div>
        </div>
        <!-- 显示右边的解析过程和操作图标 -->
        <div class="op">
          <!-- MD5解析过程 -->
          <el-progress
            type="circle"
            :width="50"
            :percentage="item.md5Progress"
            v-if="item.status === STATUS.init.value"
          />
          <!-- 文件上传时 -->
          <div class="op-btn">
            <!-- 暂停/继续 -->
            <span v-if="item.status === STATUS.uploading.value">
              <icon
                class="btn"
                :width="28"
                iconName="upload"
                v-if="item.pause"
                title="上传"
                @click="startUpload(item.uid)"
              ></icon>
              <icon
                class="btn"
                :width="28"
                iconName="pause"
                v-else
                title="暂停"
                @click="pauseUpload(item.uid)"
              ></icon>
            </span>
            <!-- 取消上传 -->
            <icon
              class="del btn-item"
              :width="28"
              iconName="del"
              v-if="
                item.status !== STATUS.init.value &&
                item.status !== STATUS.upload_finish.value &&
                item.status !== STATUS.upload_seconds.value
              "
              title="取消上传"
              @click="delUpload(item.uid, index)"
            ></icon>
            <!-- 删除文件 -->
            <icon
              class="clean btn-item"
              :width="28"
              iconName="clean"
              v-if="
                item.status === STATUS.upload_finish.value ||
                item.status === STATUS.upload_seconds.value
              "
              title="删除"
              @click="delUpload(item.uid, index)"
            ></icon>
          </div>
        </div>
      </div>
      <!-- 文件列表为空 -->
      <div v-if="fileList.length === 0">
        <NoData msg="暂无上传任务"></NoData>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from "vue";

import SparkMD5 from "spark-md5";

const { proxy } = getCurrentInstance();

const api = {
  upload: "/file/uploadFile",
};

// 文件状态（解析、上传）
const STATUS = {
  emptyfile: {
    value: "emptyfile",
    desc: "文件为空",
    color: "#F75000",
    icon: "close",
  },
  fail: {
    value: "fail",
    desc: "上传失败",
    color: "#F75000",
    icon: "close",
  },
  init: {
    value: "init",
    desc: "解析中",
    color: "#e6a23c",
    icon: "clock",
  },
  uploading: {
    value: "uploading",
    desc: "上传中",
    color: "#409eff",
    icon: "upload",
  },
  upload_finish: {
    value: "upload_finish",
    desc: "上传完成",
    color: "#67c23a",
    icon: "ok",
  },
  upload_seconds: {
    value: "upload_seconds",
    desc: "秒传",
    color: "#67c23a",
    icon: "ok",
  },
};
// 文件分片大小：5MB
const chunkSize = 1024 * 1024 * 5;
// 文件列表
const fileList = ref([]);
const delList = ref([]);

const emit = defineEmits(["uploadCallback"])
const addFile = async (file, filePid) => {
  const fileItem = {
    // 文件
    file: file,
    // 文件UID
    uid: file.uid,
    // MD5解析进度
    md5Progress: 0,
    //md5值
    md5: null,
    //文件名
    fileName: file.name,
    //上传状态
    status: STATUS.init.value,
    //已上传大小
    uploadSize: 0,
    //文件总大小
    totalSize: file.size,
    //上传进度
    uploadProgress: 0,
    //暂停
    pause: false,
    //当前分片
    chunkIndex: 0,
    //父级ID
    filePid: filePid,
    //错误信息
    errorMsg: null,
  };
  fileList.value.unshift(fileItem);
  if (fileItem.totalSize === 0) {
    fileItem.status = STATUS.emptyfile.value;
    return;
  }
  let md5FileUid = await computMD5(fileItem);
  if (md5FileUid === null) {
    return;
  }
  uploadFile(md5FileUid, 0);
};
defineExpose({ addFile });

// 计算MD5
const computMD5 = (fileItem) => {
  let file = fileItem.file;
  // 获取文件分片（兼容浏览器）
  let blobSlice =
    File.prototype.slice ||
    File.prototype.mozSlice ||
    File.prototype.webkitSlice;
  // 计算分片个数
  let chunks = Math.ceil(file.size / chunkSize);
  // 当前分片
  let currentChunk = 0;
  // 创建实例用于计算文件的MD5哈希值
  let spark = new SparkMD5.ArrayBuffer();
  // 创建实例用于读取文件内容
  let fileReader = new FileReader();
  let time = new Date().getTime();
  let loadNext = () => {
    // 分片开始位置
    let start = currentChunk * chunkSize;
    // 分片结束位置
    let end = start + chunkSize >= file.size ? file.size : start + chunkSize;
    // 读取分片内容，转换为ArrayBuffer，以进行MD5的计算
    fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
  };
  //读取第一块分片
  loadNext();
  //Promise对象包装异步计算MD哈希的过程
  return new Promise((resolve, reject) => {
    // 获取上传列表中的文件
    let resultFile = getFileByUid(file.uid);
    //读取文件完成后触发
    fileReader.onload = (e) => {
      // 将当前分片数据追加到MD5计算中
      spark.append(e.target.result);
      currentChunk++;
      if (currentChunk < chunks) {
        //没有解析完，向下取整
        console.log(
          `第${file.name},${currentChunk}分片解析完成, 开始第${
            currentChunk + 1
          } / ${chunks}分片解析`
        );
        let percent = Math.floor((currentChunk / chunks) * 100);
        resultFile.md5Progress = percent;
        // 递归调用读取分片文件
        loadNext();
      } else {
        //解析完成，计算MD5的计算
        let md5 = spark.end();
        console.log(
          `MD5计算完成：${file.name} \nMD5：${md5} \n分片：${chunks} 大小:${
            file.size
          } 用时：${new Date().getTime() - time} ms`
        );
        // 释放缓存
        spark.destroy();
        resultFile.md5Progress = 100;
        resultFile.status = STATUS.uploading.value;
        resultFile.md5 = md5;
        resolve(fileItem.uid);
      }
    };
    //读取分片数据发生错误
    fileReader.onerror = () => {
      resultFile.md5Progress = -1;
      resultFile.status = STATUS.fail.value;
      resolve(fileItem.uid);
    };
  }).catch((error) => {
    return null;
  });
};
//获取文件
const getFileByUid = (uid) => {
  let file = fileList.value.find((item) => {
    return item.file.uid === uid;
  });
  return file;
};

// 上传文件
const uploadFile = async(uid, chunkIndex) => {
  let currentFile = getFileByUid(uid);
  const file = currentFile.file;
  const fileSize = currentFile.totalSize;
  let chunks = Math.ceil(fileSize / chunkSize);
  for (let i = chunkIndex; i < chunks; i++) {
    //取消上传
    let delIndex = delList.value.indexOf(uid);
    if (delIndex != -1) {
      delList.value.splice(delIndex, 1);
      break;
    }
    currentFile = getFileByUid(uid);
    // 暂停
    if (currentFile.pause) {
      break;
    }
    // 上传文件当前片段
    let start = i * chunkSize;
    let end = start + chunkSize >= fileSize ? fileSize : start + chunkSize;
    let chunkFile = file.slice(start,end)
    let uploadResult = await proxy.Request({
      url:api.upload,
      showloading:false,
      dataType:"file",
      params:{
        file:chunkFile,
        fileName:file.name,
        fileMd5:currentFile.md5,
        chunkIndex:i,
        chunks:chunks,
        fileId:currentFile.fileId,
        filePid:currentFile.filePid,
      },
      showError:false,
      // 上传错误回调
      errorCallback:(err)=>{
        currentFile.status=STATUS.fail.value
        currentFile.errorMsg = err
      },
      // 上传进度更新回调
      uploadProgressCallback:(event) =>{
        let loaded = event.loaded
        if(loaded>fileSize){
          loaded=fileSize
        }
        currentFile.uploadSize=loaded+i*chunkSize
        currentFile.uploadProgress = Math.floor((currentFile.uploadSize/fileSize)*100)
      }
    })
    // 上传结果判断
    if(uploadResult ==null){
      break
    }
    currentFile.fileId = uploadResult.data.fileId
    currentFile.status = STATUS[uploadResult.data.status].value
    currentFile.chunkSize = i
    if (
      uploadResult.data.status == STATUS.upload_seconds.value ||
      uploadResult.data.status == STATUS.upload_finish.value
    ) {
      currentFile.uploadProgress = 100;
      //上传完成之后，刷新列表
      proxy.$mitt.emit("uploadCallbackHandler");
      break;
    }
  }
};
</script>

<style lang="scss" scoped>
.uploader-panel {
  .uploader-title {
    border-bottom: 1px solid #ddd;
    line-height: 40px;
    padding: 0px 10px;
    font-size: 15px;
    .tips {
      font-size: 13px;
      color: rgb(169, 169, 169);
    }
  }
  .file-list {
    overflow: auto;
    padding: 10px 0px;
    min-height: calc(100vh / 2);
    max-height: calc(100vh - 120px);
    .file-item {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3px 10px;
      background-color: #fff;
      border-bottom: 1px solid #ddd;
    }
    .file-item:nth-child(even) {
      background-color: #fcf8f4;
    }
    .upload-panel {
      flex: 1;
      .file-name {
        color: rgb(64, 62, 62);
      }
      .upload-status {
        display: flex;
        align-items: center;
        margin-top: 5px;
        .iconfont {
          margin-right: 3px;
        }
        .status {
          color: red;
          font-size: 13px;
        }
        .upload-info {
          margin-left: 5px;
          font-size: 12px;
          color: rgb(112, 111, 111);
        }
      }
      .progress {
        height: 10px;
      }
    }
    .op {
      width: 100px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      .op-btn {
        .btn-item {
          cursor: pointer;
        }
        .del,
        .clean {
          margin-left: 5px;
        }
      }
    }
  }
}
</style>
