import { defineStore } from "pinia";
import { ref } from "vue";
export const useUploadFileStore = defineStore('uploadFile',()=>{
    const file = ref({})
    const filePid = ref()
    function addFile(filedata,filePiddata){
        file.value = filedata
        filePid.value = filePiddata
    }
    return {file,filePid,addFile}
})