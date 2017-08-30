<template>
  <div class="block">
    <div class="label">
      <label for="selectV">选择视频设备标签</label>
      <select id="selectV" v-model="chosenV">
        <option v-for="vDev of devInfo.video" :key="vDev.id" :value="vDev.label">{{vDev.label}}</option>
        <option :value="undefined">禁用标签选择</option>
      </select>
    </div>
    <div v-if="micShow" class="label">
      <label for="selectV">选择音频设备标签</label>
      <select id="selectV" v-model="chosenA">
        <option v-for="aDev of devInfo.audio" :key="aDev.id" :value="aDev.label">{{aDev.label}}</option>
        <option :value="undefined">禁用标签选择</option>
      </select>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ui-selectLabel',
  props: {
    // 设备信息
    devInfo: {
      type: Object,
      default: () => {}
    },
    micShow: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      chosenA: '', // 选中的视频设备标签
      chosenV: '' // 选中的音频设备标签
    }
  },
  watch: {
    chosenA: function (val) {
      this.$emit('chosenA', val)
    },
    chosenV: function (val) {
      this.$emit('chosenV', val)
    }
  }
}
</script>
<style scoped>
.label {
  margin: 20px 0;
}
</style>