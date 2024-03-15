<template>
  <div>
    <div class="top">
      <div class="top-op">
        <div class="btn">
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="fileAccept"
          >
            <el-button type="primary">
              <span class="iconfont icon-upload"></span>
              上传
            </el-button>
          </el-upload>
        </div>
        <!-- 在总的文件目录中才能新建文件夹 -->
        <el-button type="success" @click="newFoloder">
          <span class="iconfont icon-folder-add"></span>
          新建文件夹
        </el-button>
        <el-button type="danger">
          <span class="iconfont icon-del"></span>
          批量删除
        </el-button>
        <el-button type="warning">
          <span class="iconfont icon-move"></span>
          批量移动
        </el-button>
        <!-- 搜索 -->
        <div class="search-panel">
          <el-input clearable placeholder="输入文件名搜索">
            <template #suffix>
              <i class="iconfont icon-search"></i>
            </template>
          </el-input>
        </div>
        <!-- 刷新 -->
        <div class="iconfont icon-refresh" @click="loadDataList"></div>
      </div>
    </div>
    <!-- 文件列表 -->
    <div class="file-list">
      <MainTable
        ref="dataTableRef"
        :columns="columns"
        :showPagination="true"
        :dataSource="tableData"
        :fetch="loadDataList"
        :initFetch="true"
        :options="tableOptions"
        @rowSelected="rowSelected"
      >
        <!-- 文件列表信息（文件图标，文件名，悬浮图标显示） -->
        <template #fileName="{ index, row }">
          <div
            class="file-item"
            @mouseenter="opShow(row)"
            @mouseleave="cancelOpShow(row)"
          >
            <!-- 图片、视频，且是转码之后时的图标 -->
            <template
              v-if="(row.fileType == 3 || row.fileType == 1) && row.status == 2"
            >
              <icon :cover="row.fileCover" :width="32"></icon>
            </template>
            <template v-else>
              <!-- 是否是文件目录 -->
              <icon v-if="row.folderType == 0" :fileType="row.fileType"></icon>
              <icon v-if="row.folderType == 1" :fileType="0"></icon>
            </template>
            <!-- 文件名 正在编辑时文件名不显示-->
            <span class="file-name" v-if="!row.showEdit" :title="row.fileName">
              <span @click="preview(row)">{{ row.fileName }}</span>
              <span v-if="row.status == 0" class="transfer-status">转码中</span>
              <span v-if="row.status == 1" class="transfer-status transfer-fail"
                >转码失败</span
              >
            </span>
            <div class="edit-panel" v-if="row.showEdit">
              <el-input
                v-model.trim="row.fileNameReal"
                ref="editNameRef"
                :maxLength="190"
                @keyup.enter="saveNameEdit(index)"
              >
                <template #suffix>{{ row.fileSuffix }}</template>
              </el-input>
              <!-- 有输入文件夹名称时才可保存 -->
              <span
                :class="[
                  'iconfont icon-right1',
                  row.fileNameReal ? '' : 'not-allow',
                ]"
                @click="saveNameEdit(index)"
              ></span>
              <span
                class="iconfont icon-error"
                @click="cancelNameEdit(index)"
              ></span>
            </div>
            <!-- 鼠标悬浮显示 -->
            <span class="op">
              <template v-if="row.showOp && row.fileId && row.status == 2">
                <span class="iconfont share1">分享</span>
                <span class="iconfont icon-download" v-if="row.folderType == 0"
                  >下载</span
                >
                <span class="iconfont icon-del">删除</span>
                <span
                  class="iconfont icon-edit"
                  @click.stop="editFileName(index)"
                  >重命名</span
                >
                <span class="iconfont icon-move">移动</span>
              </template>
            </span>
          </div>
        </template>
        <!-- 文件大小 -->
        <template #fileSize="{ index, row }">
          <span v-if="row.fileSize">
            {{ proxy.Utils.size2Str(row.fileSize) }}
          </span>
        </template>
      </MainTable>
    </div>
  </div>
</template>

<script setup>
import CategoryInfo from "@/js/CategoryInfo.js";
import { ref, reactive, getCurrentInstance, nextTick, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();


const showLoading = ref(true);
// 当前目录
const currentFolder = ref({ fileId: 0 });
// 添加文件
// 通过MainHeader调用Uploader组件中的addfile事件
const addFile = async (fileData) => {
  proxy.$mitt.emit("addFile", {file: fileData.file, filePid: currentFolder.value.fileId} );
};
const reload = ()=>{
  showLoading.value = false
  loadDataList()
}
defineExpose({
  reload,
});
const api = {
  loadDataList: "/file/loadDataList",
  rename: "/file/rename",
  newFoloder: "/file/newFoloder",
  getFolderInfo: "/file/getFolderInfo",
  delFile: "/file/delFile",
  changeFileFolder: "/file/changeFileFolder",
  createDownloadUrl: "/file/createDownloadUrl",
  download: "/api/file/download",
};

const dataTableRef = ref();

const category = ref();

// 表头
const columns = [
  {
    label: "文件名",
    prop: "fileName",
    scopedSlots: "fileName",
  },
  {
    label: "修改时间",
    prop: "lastUpdateTime",
    width: 200,
  },
  {
    label: "大小",
    prop: "fileSize",
    scopedSlots: "fileSize",
    width: 200,
  },
];
// 表格数据
const tableData = ref({});
const tableOptions = {
  extHeight: 50,
  selectType: "checkBox",
};
//文件名
const fileNameFuzzy = ref();
// 加载数据
const loadDataList = async () => {
  let params = {
    pageNo: tableData.value.pageNo,
    pageSize: tableData.value.pageSize,
    fileNameFuzzy: fileNameFuzzy.value,
    category: category.value,
    filePid: 0,
  };
  if (params.category !== "all") {
    delete params.filePid;
  }
  let result = await proxy.Request({
    url: api.loadDataList,
    showLoading:showLoading,
    params: params,
  });
  if (!result) {
    return;
  }
  tableData.value = result.data;
  editing.value = false;
};
// 展示操作按钮
const opShow = (row) => {
  tableData.value.list.forEach((element) => {
    element.showOp = false;
  });
  row.showOp = true;
};
const cancelOpShow = (row) => {
  row.showOp = false;
};

// 编辑行,为真时表示已有文件夹在编辑
const editing = ref(false);
const editNameRef = ref();
// 新建文件夹
const newFoloder = () => {
  if (editing.value) {
    return;
  }
  if (!tableData.value.list) {
    //文件列表为空时
    tableData.value.list = [];
  } else {
    tableData.value.list.forEach((element) => {
      element.showEdit = false;
    });
  }
  editing.value = true;
  tableData.value.list.unshift({
    showEdit: true,
    fileType: 0,
    fileId: "",
    filePid: 0,
  });
  nextTick(() => {
    editNameRef.value.focus();
  });
};
// 文件重命名
const editFileName = (index) => {
  // 停止正在进行的新建文件夹
  if (tableData.value.list[0].fileId === "") {
    tableData.value.list.splice(0, 1);
    index--;
  }
  tableData.value.list.forEach((element) => {
    element.showEdit = false;
  });
  let currentData = tableData.value.list[index];
  currentData.showEdit = true;
  // 文件重命名
  if (currentData.folderType == 0) {
    // 文件名
    currentData.fileNameReal = currentData.fileName.substring(
      0,
      cureentData.fileName.indexOf(".")
    );
    // 文件名后缀
    currentData.fileSuffix = currentData.fileName.substring(
      cureentData.fileName.indexOf(".")
    );
  } else {
    // 如果是文件夹
    currentData.fileNameReal = currentData.fileName;
    currentData.fileSuffix = "";
  }
  editing.value = true;
  nextTick(() => {
    editNameRef.value.focus();
  });
};
// 撤销编辑
const cancelNameEdit = (index) => {
  const fileData = tableData.value.list[index];
  // 修改文件名
  if (fileData.fileId) {
    fileData.showEdit = false;
    // 新建文件夹
  } else {
    tableData.value.list.splice(index, 1);
  }
  editing.value = false;
};
// 保存编辑结果
const saveNameEdit = async (index) => {
  const { fileId, filePid, fileNameReal } = tableData.value.list[index];
  if (fileNameReal == "" || fileNameReal.indexOf("/") != -1) {
    proxy.Message.warning("文件名不能为空且不能含有斜杠");
    return;
  }
  let url = api.rename;
  if (fileId == "") {
    url = api.newFoloder;
  }
  let result = await proxy.Request({
    url: url,
    params: {
      fileId: fileId,
      filePid: filePid,
      fileName: fileNameReal,
    },
  });
  if (!result) {
    return;
  }
  tableData.value.list[index] = result.data;
  editing.value = false;
};

const rowSelected = () => {};

// 上传文件的所有文件类型
const fileAccept = computed(() => {
  const categoryItem = CategoryInfo[category.value];
  return categoryItem ? categoryItem.accept : "*";
});
</script>

<style lang="scss" scoped>
// @表示"src/...."
@import "@/assets/file.list.scss";
</style>
